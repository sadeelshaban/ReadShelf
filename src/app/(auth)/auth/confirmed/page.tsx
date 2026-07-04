"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy confirmation links may still land here; send users straight to log in. */
export default function EmailConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?confirmed=1");
  }, [router]);

  return null;
}
