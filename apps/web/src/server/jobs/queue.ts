import { prisma } from "@/lib/prisma";

export async function enqueueJob(type: string, payload: unknown, userId?: string) {
  if ((type === "CLUSTER_USER" || type === "GENERATE_SUGGESTIONS" || type === "ENRICH_LIBRARY") && userId) {
    const existing = await prisma.job.findFirst({
      where: { userId, type, status: { in: ["QUEUED", "RUNNING"] } },
    });
    if (existing) return existing;
  }
  return prisma.job.create({
    data: {
      type,
      payload: JSON.stringify(payload ?? {}),
      userId,
      status: "QUEUED",
    },
  });
}

export async function claimNextJob() {
  const job = await prisma.job.findFirst({
    where: { status: "QUEUED", runAfter: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return null;
  const claimed = await prisma.job.updateMany({
    where: { id: job.id, status: "QUEUED" },
    data: { status: "RUNNING", attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return null;
  return prisma.job.findUnique({ where: { id: job.id } });
}

export async function completeJob(id: string) {
  await prisma.job.update({
    where: { id },
    data: { status: "SUCCEEDED", error: null },
  });
}

export async function failJob(id: string, error: unknown, maxAttempts: number, attempts: number) {
  const message = error instanceof Error ? error.message : String(error);
  const retry = attempts < maxAttempts;
  await prisma.job.update({
    where: { id },
    data: retry
      ? {
          status: "QUEUED",
          error: message,
          runAfter: new Date(Date.now() + attempts * 4000),
        }
      : { status: "FAILED", error: message },
  });
}
