import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_IMAGE_MODEL = "gemini-nano-banana-2.1";
const MAX_PROMPT_LENGTH = 4_000;
const MAX_IMAGE_DATA_LENGTH = 1_400_000;

interface InteractionPart {
  type?: string;
  text?: string;
  data?: string;
  mime_type?: string;
}

interface InteractionResponse {
  output_image?: InteractionPart;
  output?: InteractionPart[];
  error?: { message?: string };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function providerErrorMessage(status: number): string {
  if (status === 400) return "Rasm so'rovi noto'g'ri. Matnni o'zgartirib qayta urinib ko'ring.";
  if (status === 401 || status === 403) {
    return "API kaliti yoki hisobda rasm yaratish uchun ruxsat yo'q. Google AI Studio sozlamalarini tekshiring.";
  }
  if (status === 404) {
    return "Rasm modeli topilmadi. .env.local faylidagi GEMINI_IMAGE_MODEL qiymatini tekshiring.";
  }
  if (status === 429) {
    return "Rasm yaratish limiti tugadi. Biroz kutib, keyin qayta urinib ko'ring.";
  }
  if (status >= 500) return "Gemini rasm xizmati vaqtincha ishlamayapti. Keyinroq qayta urinib ko'ring.";
  return `Rasm xizmati so'rovni qabul qilmadi (${status}).`;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse("Gemini API kaliti sozlanmagan. .env.local faylini tekshiring.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("So'rov ma'lumotlarini o'qib bo'lmadi.", 400);
  }

  if (typeof body !== "object" || body === null || !("prompt" in body)) {
    return errorResponse("Rasm uchun matnli so'rov kiriting.", 400);
  }

  const requestBody = body as Record<string, unknown>;
  const prompt = requestBody.prompt;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    return errorResponse("Rasm tavsifi bo'sh yoki juda uzun (eng ko'pi 4 000 belgi).", 400);
  }

  let input: Array<Record<string, string>> = [
    {
      type: "text",
      text: `Create an image based on this user request. Follow the visual details precisely. Do not answer with text instead of an image. User request: ${prompt.trim()}`,
    },
  ];
  if ("image" in requestBody) {
    const image = requestBody.image;
    if (
      typeof image !== "object" ||
      image === null ||
      !("mimeType" in image) ||
      !("data" in image) ||
      typeof image.mimeType !== "string" ||
      !["image/png", "image/jpeg", "image/webp"].includes(image.mimeType) ||
      typeof image.data !== "string" ||
      image.data.length > MAX_IMAGE_DATA_LENGTH ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)
    ) {
      return errorResponse("Biriktirilgan rasm formati noto'g'ri yoki hajmi juda katta.", 400);
    }
    input = [
      ...input,
      { type: "image", mime_type: image.mimeType, data: image.data },
    ];
  }

  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  request.signal.addEventListener("abort", abortRequest, { once: true });
  const timeoutId = setTimeout(() => controller.abort(), 120_000);
  const model = process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ model, input, store: false }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return errorResponse(providerErrorMessage(response.status), response.status === 429 ? 429 : 502);
    }

    const result = (await response.json()) as InteractionResponse;
    const generatedImage =
      result.output_image ??
      result.output?.find((part) => part.type === "image" && part.data);
    if (
      !generatedImage?.data ||
      !["image/png", "image/jpeg", "image/webp"].includes(generatedImage.mime_type ?? "")
    ) {
      return errorResponse(
        "Gemini rasm qaytara olmadi. So'rovni boshqacha tasvirlab, qayta urinib ko'ring.",
        502,
      );
    }

    const text = result.output
      ?.filter((part) => part.type === "text" && part.text)
      .map((part) => part.text)
      .join("\n");
    return NextResponse.json({
      data: generatedImage.data,
      mimeType: generatedImage.mime_type,
      text,
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("Gemini rasm yaratishda xatolik yuz berdi.", error);
    return errorResponse("Gemini rasm xizmatiga ulanib bo'lmadi. Internetni tekshirib qayta urinib ko'ring.", 502);
  } finally {
    clearTimeout(timeoutId);
    request.signal.removeEventListener("abort", abortRequest);
  }
}
