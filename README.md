# YOUR DREAM

Next.js App Router, TypeScript, Tailwind CSS va Lucide React asosida yaratilgan sun'iy intellekt suhbat ilovasi.

## Loyihani ishga tushirish

```bash
npm install
npm run dev
```

Ilovani [http://localhost:3000](http://localhost:3000) manzilida oching.

## Gemini API'ni sozlash

1. [Google AI Studio](https://aistudio.google.com/apikey) orqali Gemini API kalitini oling.
2. Loyiha papkasidagi `.env.example` faylidan nusxa olib, nusxasini `.env.local` deb nomlang.
3. `.env.local` faylidagi `GEMINI_API_KEY` qiymatiga API kalitingizni kiriting. Kalitni sir saqlang: u faqat serverda ishlatiladi.
4. Server ishlab turgan bo'lsa, `npm run dev` buyrug'i bilan qayta ishga tushiring.

Ilova tezkor `gemini-flash-lite-latest` modelidan foydalanib, har bir javobda suhbat tarixini hisobga oladi. Bu loyiha API kaliti bilan oqimli so'rovda tekshirildi. Sun'iy intellektga barcha javoblarni o'zbek tilida, lotin yozuvida berish ko'rsatmasi berilgan. Agar tanlangan model topilmasa, loyiha avtomatik ravishda zaxira modellarga o'tadi. `GEMINI_MODEL` qiymatini `.env.local` faylida o'zgartirish mumkin.

## Rasm biriktirish va yaratish

- Composer yonidagi rasm tugmasi PNG, JPG yoki WebP rasmni chatga biriktiradi. Rasm siqilib, Gemini suhbatida tahlil uchun yuboriladi.
- **Rasm yaratish** rejimini yoqib, tasvir tavsifini yuboring. Shu rejimda rasm ham biriktirilsa, Gemini undan yangi rasm yaratishda namuna sifatida foydalanadi.
- Rasm yaratish uchun `GEMINI_API_KEY` kaliti rasm modeliga ruxsat berishi kerak. Standart model `gemini-nano-banana-2.1`; zarurat bo'lsa `.env.local` faylida `GEMINI_IMAGE_MODEL` orqali o'zgartiring.
- Rasm yaratish alohida `/api/images/generate` yo'nalishida bajariladi; mavjud matnli chat oqimi `/api/chat` orqali o'z holicha ishlaydi.

## Mehmon sifatida kirish

Ismingizni kiriting va **Faqat mehmon bo'lib kirish** tugmasini bosing. Suhbatlar shu brauzerda saqlanadi.

## Loyiha tuzilishi

```text
app/
  api/chat/route.ts    Gemini oqimli matnli chat va rasm tahlili
  api/images/generate/route.ts  Gemini rasm yaratish uchun alohida yo'nalish
  globals.css          Umumiy mavzu, Tailwind qatlamlari va moslashuvchan uslublar
  layout.tsx           Asosiy hujjat va sahifa ma'lumotlari
  page.tsx             Ilovaning asosiy sahifasi
components/
  brand-mark.tsx       YOUR DREAM logotipi
  chat-app.tsx         Asosiy ilova va Gemini javob oqimi
  chat-message.tsx     Xabarlar, formatlash va nusxa olish
  composer.tsx         Xabar kiritish, rasm biriktirish va rasm yaratish rejimi
  settings-modal.tsx   Sozlamalar va ma'lumotlarni boshqarish
  sidebar.tsx          Yig'iladigan suhbatlar paneli
  suggestions.tsx      Yangi suhbat uchun takliflar
hooks/
  use-chat-store.ts    Suhbat va sozlamalarni saqlash
types/
  chat.ts              Suhbatlar, rasm qo'shimchalari va sozlamalar uchun turlar
```

## Imkoniyatlar

- Kompyuter va telefon uchun mos, qorong'i interfeys.
- Suhbatlar tarixini brauzerda saqlash, qidirish, almashtirish va o'chirish.
- Gemini'dan mavzuga mos, suhbat tarixini hisobga oluvchi oqimli javoblar va rasm tahlili.
- Nano Banana orqali rasm yaratish yoki biriktirilgan rasm asosida yangi rasm tayyorlash.
- Kod formatlash, javobdan nusxa olish, savol takliflari va kattalashuvchi xabar maydoni.
- Ixcham ko'rinish, Enter bilan yuborish, ma'lumotlarni tozalash va suhbatni Markdown fayli sifatida yuklab olish.

Gemini API kalitisiz sun'iy intellekt javob bera olmaydi. Rasm yaratish Gemini modelingiz ruxsati hamda hisob limitlariga bog'liq.
