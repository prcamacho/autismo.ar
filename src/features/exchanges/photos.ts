import "server-only";
import { randomUUID } from "node:crypto";
import { EXCHANGE_LIMITS } from "./model";
import { normalizeProfilePhoto } from "./photo-processing";
import { exchangeAdmin, recordExchangeFailure } from "./server";

export const PHOTO_BUCKET = "professional-photos";
export async function uploadProfilePhoto(file: File, userId: string) {
  if (file.size > EXCHANGE_LIMITS.photoInputBytes)
    throw new Error("PHOTO_SIZE");
  const admin = exchangeAdmin();
  if (!admin) throw new Error("PHOTO_UNAVAILABLE");
  const bytes = await normalizeProfilePhoto(
    new Uint8Array(await file.arrayBuffer()),
  );
  const path = `${userId}/${randomUUID()}.webp`;
  const tracked = await admin.rpc("exchange_photo_track", {
    p_path: path,
    p_user: userId,
  });
  if (tracked.error) throw new Error("PHOTO_UNAVAILABLE");
  const { error } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "0",
    });
  if (error) throw new Error("PHOTO_UNAVAILABLE");
  return path;
}
export async function removeProfilePhoto(path: string | null) {
  if (!path) return true;
  const admin = exchangeAdmin();
  if (!admin) return false;
  const { error } = await admin.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) {
    recordExchangeFailure("remove_photo", "STORAGE");
    return false;
  } else {
    const forgotten = await admin.rpc("exchange_photo_forget", {
      p_path: path,
    });
    if (forgotten.error)
      recordExchangeFailure("forget_photo", forgotten.error.code);
    return !forgotten.error;
  }
}
