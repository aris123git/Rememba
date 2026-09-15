import { EVENT_GAP_MS, EVENT_MIN_PHOTOS, PERSON_MIN_PHOTOS, faceMatchThreshold } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { nearestCentroid } from "@/server/ai/cluster";
import { groupByTimeWindows } from "@/server/ai/eventWindows";
import { getFaceRecognitionService } from "@/server/ai/faceRecognition";
import { clusterDedupeKey, eventDedupeKey } from "@/server/ai/keys";
import { bufferToFloat32, cosineSimilarity, float32ToBuffer, meanNormalized } from "@/server/ai/vectors";
import { enqueueJob } from "@/server/jobs/queue";

export async function processPhotoJob(photoId: string) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, deletedAt: null },
  });
  if (!photo) return;

  const consent = await prisma.consent.findUnique({
    where: { userId_type: { userId: photo.ownerId, type: "AI_PHOTO_ANALYSIS" } },
  });
  if (!consent?.granted) {
    await prisma.photo.update({
      where: { id: photo.id },
      data: { analysisStatus: "SKIPPED", analysisError: null },
    });
    return;
  }

  await prisma.photo.update({
    where: { id: photo.id },
    data: { analysisStatus: "RUNNING", analysisError: null },
  });

  try {
    const bytes = await getStorage().get(photo.storageKey);
    const faces = await getFaceRecognitionService().detectAndEmbed(bytes, photo.mimeType);
    await prisma.$transaction(async (tx) => {
      await tx.faceEmbedding.deleteMany({ where: { photoId: photo.id } });
      for (const face of faces) {
        await tx.faceEmbedding.create({
          data: {
            ownerId: photo.ownerId,
            photoId: photo.id,
            x: face.x,
            y: face.y,
            width: face.width,
            height: face.height,
            score: face.score,
            embedding: float32ToBuffer(face.embedding),
            dimensions: face.dimensions,
            modelId: face.model_id,
          },
        });
      }
      await tx.photo.update({
        where: { id: photo.id },
        data: { analysisStatus: "DONE", analysisError: null },
      });
    });
    await enqueueJob("CLUSTER_USER", { userId: photo.ownerId }, photo.ownerId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.photo.update({
      where: { id: photo.id },
      data: { analysisStatus: "FAILED", analysisError: message },
    });
    throw error;
  }
}

type ClusterCache = {
  id: string;
  status: string;
  personId: string | null;
  faces: { id: string; embedding: Buffer | Uint8Array }[];
};

export async function clusterUserJob(userId: string) {
  const threshold = faceMatchThreshold();
  const embeddings = await prisma.faceEmbedding.findMany({
    where: { ownerId: userId, photo: { deletedAt: null } },
  });
  const existing = await prisma.faceCluster.findMany({
    where: { ownerId: userId, status: { in: ["UNCONFIRMED", "CONFIRMED"] } },
    include: { faces: true },
  });

  const clusters: ClusterCache[] = existing.map((cluster) => ({
    id: cluster.id,
    status: cluster.status,
    personId: cluster.personId,
    faces: cluster.faces.map((face) => ({ id: face.id, embedding: face.embedding })),
  }));

  const unassigned = embeddings.filter((item) => !item.clusterId);
  for (const face of unassigned) {
    const centroids = clusters
      .filter((cluster) => cluster.faces.length > 0)
      .map((cluster) => ({
        id: cluster.id,
        vector: meanNormalized(cluster.faces.map((item) => bufferToFloat32(item.embedding))),
      }));
    const match = nearestCentroid(bufferToFloat32(face.embedding), centroids, threshold);
    if (match) {
      await prisma.faceEmbedding.update({
        where: { id: face.id },
        data: { clusterId: match.id },
      });
      const target = clusters.find((cluster) => cluster.id === match.id);
      target?.faces.push({ id: face.id, embedding: face.embedding });
    } else {
      const created = await prisma.faceCluster.create({
        data: {
          ownerId: userId,
          status: "UNCONFIRMED",
          coverFaceId: face.id,
        },
      });
      await prisma.faceEmbedding.update({
        where: { id: face.id },
        data: { clusterId: created.id },
      });
      clusters.push({
        id: created.id,
        status: "UNCONFIRMED",
        personId: null,
        faces: [{ id: face.id, embedding: face.embedding }],
      });
    }
  }

  await mergeCloseClusters(clusters, threshold);
  await enqueueJob("GENERATE_SUGGESTIONS", { userId }, userId);
}

async function mergeCloseClusters(clusters: ClusterCache[], threshold: number) {
  const active = clusters.filter((cluster) => cluster.faces.length > 0);
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const left = active[i];
      const right = active[j];
      if (left.status === "CONFIRMED" && right.status === "CONFIRMED") continue;
      const sim = cosineSimilarity(
        meanNormalized(left.faces.map((face) => bufferToFloat32(face.embedding))),
        meanNormalized(right.faces.map((face) => bufferToFloat32(face.embedding))),
      );
      if (sim < threshold) continue;

      const keep =
        left.status === "CONFIRMED" ? left : right.status === "CONFIRMED" ? right : left;
      const drop = keep.id === left.id ? right : left;
      await prisma.faceEmbedding.updateMany({
        where: { clusterId: drop.id },
        data: { clusterId: keep.id },
      });
      keep.faces.push(...drop.faces);
      drop.faces = [];
      await prisma.faceCluster.delete({ where: { id: drop.id } });
    }
  }
}

export async function generateSuggestionsJob(userId: string) {
  const clusters = await prisma.faceCluster.findMany({
    where: { ownerId: userId, status: "UNCONFIRMED" },
    include: { faces: { include: { photo: true } } },
  });

  for (const cluster of clusters) {
    const photoIds = [...new Set(cluster.faces.map((face) => face.photoId))];
    if (photoIds.length < PERSON_MIN_PHOTOS) continue;
    const dedupeKey = clusterDedupeKey(cluster.id);
    const existing = await prisma.aIRecommendation.findUnique({
      where: { userId_dedupeKey: { userId, dedupeKey } },
    });
    if (existing && existing.status !== "PENDING" && existing.status !== "SNOOZED") continue;
    await prisma.aIRecommendation.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {
        payload: JSON.stringify({
          clusterId: cluster.id,
          photoCount: photoIds.length,
          samplePhotoIds: photoIds.slice(0, 6),
        }),
      },
      create: {
        userId,
        type: "PERSON_IDENTITY",
        dedupeKey,
        confidence: photoIds.length >= 6 ? "HIGH" : photoIds.length >= 3 ? "MEDIUM" : "LOW",
        payload: JSON.stringify({
          clusterId: cluster.id,
          photoCount: photoIds.length,
          samplePhotoIds: photoIds.slice(0, 6),
        }),
      },
    });
  }

  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null },
    include: { eventPhotos: { include: { event: true } } },
  });
  const timed = photos.map((photo) => ({
    id: photo.id,
    at: photo.takenAt ?? photo.importedAt,
    alreadyInEvent: photo.eventPhotos.some((link) => link.event.status === "CONFIRMED"),
  }));
  const windows = groupByTimeWindows(timed, EVENT_GAP_MS, EVENT_MIN_PHOTOS);
  for (const window of windows) {
    const dedupeKey = eventDedupeKey(window.photoIds);
    const existing = await prisma.aIRecommendation.findUnique({
      where: { userId_dedupeKey: { userId, dedupeKey } },
    });
    if (existing && existing.status !== "PENDING" && existing.status !== "SNOOZED") continue;
    await prisma.aIRecommendation.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {
        payload: JSON.stringify({
          photoIds: window.photoIds,
          startsAt: window.startsAt.toISOString(),
          endsAt: window.endsAt.toISOString(),
          photoCount: window.photoIds.length,
        }),
      },
      create: {
        userId,
        type: "EVENT_CANDIDATE",
        dedupeKey,
        confidence: window.photoIds.length >= 12 ? "HIGH" : window.photoIds.length >= 5 ? "MEDIUM" : "LOW",
        payload: JSON.stringify({
          photoIds: window.photoIds,
          startsAt: window.startsAt.toISOString(),
          endsAt: window.endsAt.toISOString(),
          photoCount: window.photoIds.length,
        }),
      },
    });
  }
}
