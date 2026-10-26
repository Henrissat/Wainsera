"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAlertsReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/alerts", { method: "PATCH" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-sm font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
    >
      {loading ? "…" : "Tout marquer comme vu"}
    </button>
  );
}
