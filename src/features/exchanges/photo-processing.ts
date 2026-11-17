import sharp from "sharp";
import { EXCHANGE_LIMITS } from "./model";

/** Decode the actual format; never trust the extension or MIME supplied by a browser. */
export async function normalizeProfilePhoto(
  input: Uint8Array,
): Promise<Buffer> {
  if (!input.byteLength || input.byteLength > EXCHANGE_LIMITS.photoInputBytes)
    throw new Error("PHOTO_SIZE");
  // Restrict decoders before probing metadata (SVG and document formats are not photos).
  const signature = Buffer.from(input.subarray(0, 12));
  const jpeg =
    signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const png = signature
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp =
    signature.subarray(0, 4).toString("ascii") === "RIFF" &&
    signature.subarray(8, 12).toString("ascii") === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("PHOTO_FORMAT");
  const pipeline = sharp(input, {
    limitInputPixels: 16_000_000,
    animated: false,
    failOn: "warning",
  });
  const metadata = await pipeline.metadata();
  if (
    !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
    (metadata.pages ?? 1) > 1
  )
    throw new Error("PHOTO_FORMAT");
  // Sharp removes EXIF/ICC/XMP by default; rotate before stripping orientation.
  const result = await pipeline
    .rotate()
    .resize(384, 384, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 78, effort: 3 })
    .toBuffer();
  if (result.byteLength > EXCHANGE_LIMITS.photoOutputBytes)
    throw new Error("PHOTO_SIZE");
  return result;
}
