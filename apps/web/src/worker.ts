import "@/lib/loadEnv";
import { completeJob, failJob, claimNextJob } from "@/server/jobs/queue";
import { enrichLibraryJob } from "@/server/enrich";
import { clusterUserJob, generateSuggestionsJob, processPhotoJob } from "@/server/orchestrator";
import { renderVideoJob } from "@/server/video";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function handle(type: string, payload: Record<string, unknown>) {
  if (type === "PROCESS_PHOTO") {
    await processPhotoJob(String(payload.photoId));
    return;
  }
  if (type === "CLUSTER_USER") {
    await clusterUserJob(String(payload.userId));
    return;
  }
  if (type === "GENERATE_SUGGESTIONS") {
    await generateSuggestionsJob(String(payload.userId));
    return;
  }
  if (type === "ENRICH_LIBRARY") {
    await enrichLibraryJob(String(payload.userId));
    return;
  }
  if (type === "RENDER_VIDEO") {
    await renderVideoJob(String(payload.videoId), Boolean(payload.withMusic));
    return;
  }
  throw new Error(`Type de job inconnu: ${type}`);
}

async function loop() {
  console.log("Rememba worker démarré");
  for (;;) {
    const job = await claimNextJob();
    if (!job) {
      await sleep(1500);
      continue;
    }
    try {
      const payload = JSON.parse(job.payload || "{}") as Record<string, unknown>;
      if (job.userId && !payload.userId) payload.userId = job.userId;
      await handle(job.type, payload);
      await completeJob(job.id);
    } catch (error) {
      console.error("Job failed", job.id, error);
      await failJob(job.id, error, job.maxAttempts, job.attempts);
    }
  }
}

loop().catch((error) => {
  console.error(error);
  process.exit(1);
});
