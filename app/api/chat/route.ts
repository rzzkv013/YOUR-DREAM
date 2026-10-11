import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.8-flash",
];
const MAX_MESSAGES = 60;
const MAX_MESSAGE_LENGTH = 20_000;
const MAX_CONVERSATION_LENGTH = 60_000;
const REQUEST_TIMEOUT_MS = 30_000;
const STREAM_IDLE_TIMEOUT_MS = 20_000;

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
  image?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiStreamEvent {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

function isChatMessage(value: unknown): value is ChatMessageInput {
  if (
    typeof value !== "object" ||
    value === null ||
    !("role" in value) ||
    !("content" in value)
  ) {
    return false;
  }

  const message = value as Record<string, unknown>;
  const validImage =
    !("image" in message) ||
    (typeof message.image === "object" &&
      message.image !== null &&
      "mimeType" in message.image &&
      "data" in message.image &&
      typeof message.image.mimeType === "string" &&
      ["image/png", "image/jpeg", "image/webp"].includes(message.image.mimeType) &&
      typeof message.image.data === "string" &&
      message.image.data.length <= 1_400_000 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(message.image.data));
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH &&
    validImage
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function providerErrorMessage(status: number): string {
  if (status === 400) return "So'rov yoki tanlangan model sozlamasini tekshiring.";
  if (status === 401 || status === 403) {
    return "API kaliti noto'g'ri yoki Gemini API uchun ruxsat yo'q. .env.local faylidagi kalitni tekshiring.";
  }
  if (status === 404) return "Tanlangan Gemini modeli topilmadi. GEMINI_MODEL sozlamasini tekshiring.";
  if (status === 429) {
    return "Gemini so'rovlari limiti tugadi. Biroz kutib, qayta urinib ko'ring yoki Google AI Studio hisobingizni tekshiring.";
  }
  if (status >= 500) return "Gemini xizmati vaqtincha ishlamayapti. Birozdan so'ng qayta urinib ko'ring.";
  return `Gemini API so'rovni qabul qilmadi (${status}). Sozlamalarni tekshirib, qayta urinib ko'ring.`;
}

function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const ordered = configured ? [configured, ...DEFAULT_MODELS.filter((model) => model !== configured)] : [...DEFAULT_MODELS];
  return Array.from(new Set(ordered.filter(Boolean)));
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "Gemini API kaliti sozlanmagan. Loyiha papkasidagi .env.local fayliga GEMINI_API_KEY qiymatini kiriting va serverni qayta ishga tushiring.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("So'rov ma'lumotlarini o'qib bo'lmadi.", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("messages" in body) ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > MAX_MESSAGES ||
    !body.messages.every(isChatMessage)
  ) {
    return errorResponse("Xabarlar formati noto'g'ri yoki suhbat juda uzun.", 400);
  }

  const messages = body.messages as ChatMessageInput[];
  if (messages[messages.length - 1].role !== "user") {
    return errorResponse("Suhbatning oxirgi xabari foydalanuvchidan bo'lishi kerak.", 400);
  }

  if (
    messages.reduce((total, message) => total + message.content.length, 0) >
    MAX_CONVERSATION_LENGTH
  ) {
    return errorResponse(
      "Suhbat juda uzun. Yangi suhbat ochib, qayta urinib ko'ring.",
      413,
    );
  }
  if (
    messages.reduce((total, message) => total + (message.image?.data.length ?? 0), 0) >
    1_400_000
  ) {
    return errorResponse("Rasm hajmi juda katta. Kichikroq rasm yuborib qayta urinib ko'ring.", 413);
  }

  const abortController = new AbortController();
  request.signal.addEventListener(
    "abort",
    () => abortController.abort(),
    { once: true },
  );

  const modelCandidates = getModelCandidates();
  let upstream: Response | null = null;
  let lastStatus = 0;
  let lastErrorMessage = "Gemini APIga ulanib bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.";

  for (const model of modelCandidates) {
    const fetchController = new AbortController();
    const timeoutId = setTimeout(() => fetchController.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "Sen YOUR DREAM nomli bilimdon va foydali sun'iy intellekt yordamchisisan. Barcha javoblaringni o'zbek tilida va faqat lotin yozuvida yoz. Foydalanuvchi qaysi tilda yozishidan qat'i nazar, o'zbek lotinida javob ber. Har xil mavzudagi savollarga mazmuniga mos, aniq va bevosita javob ber; bir xil umumiy gaplarni takrorlama. Suhbat tarixini diqqat bilan hisobga ol. Savolga qarab to'liq izoh, amaliy qadamlar, misollar yoki ishlaydigan kod ber. Savol noaniq bo'lsa, aniqlashtiruvchi savol so'ra. Javobni bilmasang, buni rostini ayt va ma'lumotni to'qib chiqarmagin. Tarjima, kod yoki boshqa tildagi matn so'ralgandagina o'sha tilni ishlat; izohni baribir o'zbek lotinida yoz. Faylning mazmuni so'rovda berilmagan bo'lsa, uni ko'rgandek ko'rsatma va mazmunini so'ra. Agar foydalanuvchi sening egang yoki seni kim yaratgani haqida so'rasa, o'zbek lotinida aniq qilib 'Javohir Abdurazzoqov' deb javob ber.",
                },
              ],
            },
            contents: messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [
                { text: message.content },
                ...(message.image
                  ? [
                      {
                        inlineData: {
                          mimeType: message.image.mimeType,
                          data: message.image.data,
                        },
                      },
                    ]
                  : []),
              ],
            })),
            generationConfig: { maxOutputTokens: 4096 },
          }),
          signal: fetchController.signal,
        },
      );

      lastStatus = response.status;
      if (response.ok) {
        upstream = response;
        break;
      }

      if (response.status === 404) {
        lastErrorMessage = `"${model}" modeli mavjud emas yoki bu hisob uchun ruxsat berilmagan.`;
        continue;
      }

      lastErrorMessage = providerErrorMessage(response.status);
      break;
    } catch (error) {
      if (request.signal.aborted) return new Response(null, { status: 499 });
      lastErrorMessage = "Gemini APIga ulanib bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.";
      console.error(`Gemini API model ${model} bilan ishlaganda xatolik yuz berdi.`, error);
      break;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!upstream) {
    const statusCode = lastStatus === 429 ? 429 : 502;
    return errorResponse(lastErrorMessage, statusCode);
  }
  if (!upstream.body) {
    return errorResponse("Gemini API javob oqimini qaytarmadi.", 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";

      const processLine = (line: string) => {
        if (!line.startsWith("data:")) return;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") return;

        const event = JSON.parse(data) as GeminiStreamEvent;
        if (event.error) {
          throw new Error(event.error.message || "Gemini javobida xatolik yuz berdi.");
        }
        const text = event.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("");
        if (text) controller.enqueue(encoder.encode(text));
      };

      try {
        while (true) {
          const { done, value } = await new Promise<{ done: boolean; value?: Uint8Array }>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Gemini javob oqimi ishlov berishdan to'xtadi.")), STREAM_IDLE_TIMEOUT_MS);
            reader.read().then(
              (result) => {
                clearTimeout(timeout);
                resolve(result);
              },
              (error) => {
                clearTimeout(timeout);
                reject(error);
              },
            );
          });

          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) processLine(line.replace(/\r$/, ""));
        }

        buffer += decoder.decode();
        if (buffer) processLine(buffer.replace(/\r$/, ""));
        controller.close();
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Gemini javob oqimida xatolik yuz berdi.", error);
          controller.error(error);
        }
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
