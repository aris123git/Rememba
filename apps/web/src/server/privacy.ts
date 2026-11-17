import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export async function deleteAccount(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const storage = getStorage();
  await storage.deletePrefix(userId);
  await prisma.user.delete({ where: { id: userId } });
  return { deletedPhotos: photos.length };
}
