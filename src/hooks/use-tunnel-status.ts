import { useEffect, useState } from "react";
import { pingHealth } from "@/lib/api";

export type TunnelStatus = "checking" | "waking" | "online" | "offline";

/** Answers slower than this mean the free host was asleep and is spinning up. */
const WAKING_THRESHOLD_MS = 1500;
const RETRY_MS = 4000;
const GIVE_UP_MS = 120_000;

/**
 * Reports whether the backend is awake.
 *
 * The free host sleeps after ~15 idle minutes and takes tens of seconds to wake
 * (docs/decisions/0005-cold-start-warm-up.md). Rather than hide that behind an
 * unexplained spinner, the interface shows it as a facility status lamp.
 */
export function useTunnelStatus(): TunnelStatus {
  const [status, setStatus] = useState<TunnelStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const started = Date.now();

    const wakingTimer = window.setTimeout(() => {
      if (!cancelled) {
        setStatus((current) => (current === "checking" ? "waking" : current));
      }
    }, WAKING_THRESHOLD_MS);

    async function attempt() {
      const ok = await pingHealth(controller.signal);
      if (cancelled) {
        return;
      }
      if (ok) {
        setStatus("online");
        return;
      }
      if (Date.now() - started > GIVE_UP_MS) {
        setStatus("offline");
        return;
      }
      window.setTimeout(attempt, RETRY_MS);
    }

    void attempt();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(wakingTimer);
    };
  }, []);

  return status;
}
