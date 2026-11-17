import { prisma } from "@/lib/prisma";

export async function confirmCluster(input: {
  ownerId: string;
  clusterId: string;
  displayName: string;
  isUserSelf?: boolean;
}) {
  const cluster = await prisma.faceCluster.findFirst({
    where: { id: input.clusterId, ownerId: input.ownerId, status: { not: "SPLIT" } },
  });
  if (!cluster) return null;
  const person = await prisma.person.create({
    data: {
      ownerId: input.ownerId,
      displayName: input.displayName.trim(),
      isUserSelf: Boolean(input.isUserSelf),
      confirmationStatus: "CONFIRMED",
    },
  });
  await prisma.faceCluster.update({
    where: { id: cluster.id },
    data: { personId: person.id, status: "CONFIRMED" },
  });
  await prisma.aIRecommendation.updateMany({
    where: {
      userId: input.ownerId,
      type: "PERSON_IDENTITY",
      dedupeKey: `person-cluster:${cluster.id}`,
      status: "PENDING",
    },
    data: { status: "ACCEPTED" },
  });
  return person;
}

export async function ignoreCluster(ownerId: string, clusterId: string) {
  const cluster = await prisma.faceCluster.findFirst({
    where: { id: clusterId, ownerId },
  });
  if (!cluster) return null;
  await prisma.faceCluster.update({
    where: { id: clusterId },
    data: { status: "IGNORED" },
  });
  await prisma.aIRecommendation.updateMany({
    where: { userId: ownerId, dedupeKey: `person-cluster:${clusterId}` },
    data: { status: "DISMISSED" },
  });
  return true;
}

export async function splitCluster(ownerId: string, clusterId: string) {
  const cluster = await prisma.faceCluster.findFirst({
    where: { id: clusterId, ownerId },
    include: { faces: true },
  });
  if (!cluster) return null;
  await prisma.faceCluster.update({
    where: { id: clusterId },
    data: { status: "SPLIT", personId: null },
  });
  for (const face of cluster.faces) {
    const created = await prisma.faceCluster.create({
      data: {
        ownerId,
        status: "UNCONFIRMED",
        coverFaceId: face.id,
      },
    });
    await prisma.faceEmbedding.update({
      where: { id: face.id },
      data: { clusterId: created.id },
    });
  }
  await prisma.aIRecommendation.updateMany({
    where: { userId: ownerId, dedupeKey: `person-cluster:${clusterId}` },
    data: { status: "DISMISSED" },
  });
  return true;
}
