"use client";

import { useEffect } from "react";
import { PRESENCE_PING_MS } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";

async function pingPresence() {
  if (document.visibilityState !== "visible") return;

  try {
    await fetch("/api/presence", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // ignore network errors while offline
  }
}

export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    let interval: ReturnType<typeof setInterval> | null = null;
    let active = false;

    function start() {
      if (active) return;
      active = true;
      void pingPresence();
      interval = setInterval(() => void pingPresence(), PRESENCE_PING_MS);
      window.addEventListener("focus", pingPresence);
      document.addEventListener("visibilitychange", pingPresence);
    }

    function stop() {
      active = false;
      if (interval) clearInterval(interval);
      interval = null;
      window.removeEventListener("focus", pingPresence);
      document.removeEventListener("visibilitychange", pingPresence);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) start();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) start();
      else stop();
    });

    return () => {
      subscription.unsubscribe();
      stop();
    };
  }, []);

  return null;
}
