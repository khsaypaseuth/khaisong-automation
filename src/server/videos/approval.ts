import { prisma } from "@/lib/db";

/** Approves a video for posting. Only meaningful once it's rendered. */
export function approveVideo(id: string) {
  return prisma.videoPost.update({
    where: { id },
    data: { approvalStatus: "APPROVED", status: "APPROVED" },
  });
}

/** Rejects a video; keeps the rendered assets but blocks posting. */
export function rejectVideo(id: string) {
  return prisma.videoPost.update({
    where: { id },
    data: { approvalStatus: "REJECTED" },
  });
}
