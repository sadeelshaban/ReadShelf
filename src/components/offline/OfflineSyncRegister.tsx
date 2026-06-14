"use client";

import { useEffect } from "react";
import { flushSyncQueue } from "@/lib/offline/reader-api";
import { onOnline } from "@/lib/offline/online";

export function OfflineSyncRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    void flushSyncQueue();

    return onOnline(() => {
      void flushSyncQueue();
    });
  }, []);

  return null;
}
