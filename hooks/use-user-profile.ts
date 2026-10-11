"use client";

import { useCallback, useEffect, useState } from "react";

const GUEST_PROFILE_KEY = "your-dream-guest-profile-v1";

export interface UserProfile {
  uid: string;
  name: string;
  provider: "guest";
}

function guestFromStorage(): UserProfile | null {
  try {
    const name = window.localStorage.getItem(GUEST_PROFILE_KEY)?.trim();
    return name ? { uid: `guest:${name.toLocaleLowerCase()}`, name, provider: "guest" } : null;
  } catch (error) {
    console.error("Mehmon profili yuklanmadi.", error);
    return null;
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    const timer = window.setTimeout(() => {
      if (!isActive) return;
      setProfile(guestFromStorage());
      setIsLoading(false);
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const signInAsGuest = useCallback(async (name: string) => {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      setError("Davom etish uchun ismingizni kiriting.");
      return false;
    }

    try {
      window.localStorage.setItem(GUEST_PROFILE_KEY, normalizedName);
      setError("");
      setProfile({
        uid: `guest:${normalizedName.toLocaleLowerCase()}`,
        name: normalizedName,
        provider: "guest",
      });
      return true;
    } catch (authError) {
      console.error("Mehmon rejimiga o'tib bo'lmadi.", authError);
      setError("Kirishni yakunlab bo'lmadi. Qayta urinib ko'ring.");
      return false;
    }
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(GUEST_PROFILE_KEY);
      setProfile(null);
      setError("");
    } catch (error) {
      console.error("Hisobdan chiqishda xatolik yuz berdi.", error);
      setError("Hisobdan chiqib bo'lmadi. Qayta urinib ko'ring.");
    }
  }, []);

  return { profile, isLoading, error, signInAsGuest, signOut };
}
