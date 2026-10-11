"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface SignInScreenProps {
  error: string;
  onContinueAsGuest: (name: string) => Promise<boolean>;
}

export function SignInScreen({
  error,
  onContinueAsGuest,
}: SignInScreenProps) {
  const [name, setName] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const continueAsGuest = async () => {
    setIsBusy(true);
    await onContinueAsGuest(name);
    setIsBusy(false);
  };

  return (
    <main className="auth-screen flex min-h-[100dvh] items-center justify-center px-5 py-12">
      <section className="auth-card w-full max-w-[420px] rounded-[28px] p-7 sm:p-9">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="brand-mark mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-violet-200">
            <Sparkles size={22} />
          </div>
          <p className="text-xs font-semibold tracking-[0.22em] text-violet-300">YOUR DREAM</p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100">
            Xush kelibsiz
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Ismingizni kiriting va suhbatni boshlang.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void continueAsGuest();
          }}
        >
          <label className="mb-2 block text-xs font-medium text-zinc-300" htmlFor="guest-name">
            Ismingiz
          </label>
          <input
            autoComplete="given-name"
            className="auth-input h-12 w-full rounded-xl px-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600"
            id="guest-name"
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Masalan, Javohir"
            required
            value={name}
          />
          <button
            className="auth-guest mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy || !name.trim()}
            type="submit"
          >
            Faqat mehmon bo&apos;lib kirish
            <ArrowRight size={16} />
          </button>
        </form>

        {error && (
          <p className="auth-error mt-4 rounded-xl px-3.5 py-3 text-xs leading-5" role="alert">
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-[10px] leading-5 text-zinc-600">
          Mehmon rejimidagi suhbatlar faqat shu brauzerda saqlanadi.
        </p>
      </section>
    </main>
  );
}
