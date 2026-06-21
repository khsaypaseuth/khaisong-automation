import { prisma } from "@/lib/db";

export function listApiLogs(limit = 100) {
  return prisma.apiLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function listPostingLogs(limit = 100) {
  return prisma.postingLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      videoPost: { select: { id: true, title: true } },
    },
  });
}

export function countApiErrors() {
  return prisma.apiLog.count({ where: { status: "error" } });
}
