import type { ImageAttachment } from "@/types/chat";

const MAX_SOURCE_IMAGE_SIZE = 12 * 1024 * 1024;
const MAX_STORED_IMAGE_SIZE = 400 * 1024;
const MAX_IMAGE_DIMENSION = 1024;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasm faylini o'qib bo'lmadi."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Rasm ma'lumotini tayyorlab bo'lmadi."));
        return;
      }
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Rasmni siqib bo'lmadi."));
      },
      "image/webp",
      quality,
    );
  });
}

async function compressImage(blob: Blob, name: string): Promise<ImageAttachment> {
  if (blob.size > MAX_SOURCE_IMAGE_SIZE) {
    throw new Error("Rasm hajmi 12 MB dan oshmasligi kerak.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("Bu rasm formatini ochib bo'lmadi. PNG, JPG yoki WebP yuboring.");
  }

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));

    for (let resizeAttempt = 0; resizeAttempt < 3; resizeAttempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Rasmni tayyorlash imkoni bo'lmadi.");
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.78, 0.66, 0.54, 0.42]) {
        const compressed = await canvasToWebp(canvas, quality);
        if (compressed.size <= MAX_STORED_IMAGE_SIZE) {
          return {
            name,
            mimeType: "image/webp",
            data: await blobToBase64(compressed),
          };
        }
      }

      width = Math.max(1, Math.round(width * 0.75));
      height = Math.max(1, Math.round(height * 0.75));
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Rasmni saqlash uchun yetarlicha kichraytirib bo'lmadi.");
}

export function compressImageFile(file: File): Promise<ImageAttachment> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Faqat rasm fayllarini biriktirish mumkin."));
  }
  return compressImage(file, file.name);
}

export async function compressImageData(
  data: string,
  mimeType: string,
): Promise<ImageAttachment> {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return compressImage(new Blob([bytes], { type: mimeType }), "YOUR-DREAM-rasm.webp");
}
