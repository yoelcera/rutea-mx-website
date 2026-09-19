"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { ClockTime, RouteFare } from "@/data/route_types";

export interface RouteSchedule {
  fare: RouteFare;
  firstDeparture: ClockTime | null;
  lastDeparture: ClockTime | null;
  initialFrequencyMinutes: number | null;
  frequencyMinutes: number | null;
}

function parseClock(raw: unknown): ClockTime | null {
  const r = raw as { hour?: unknown; minute?: unknown } | null | undefined;
  return typeof r?.hour === "number" && typeof r?.minute === "number"
    ? { hour: r.hour, minute: r.minute }
    : null;
}

/** Equivalente a RouteSchedule(firestoreData:) de la app: null si no hay tarifa válida. */
function parseInfo(info: unknown): RouteSchedule | null {
  const data = info as Record<string, unknown> | null | undefined;
  const fare = data?.fare as { general?: unknown; preferente?: unknown } | undefined;
  if (typeof fare?.general !== "number" || typeof fare?.preferente !== "number") return null;

  const initial = data?.initial_frequency_minutes;
  const frequency = data?.frequency_minutes;
  return {
    fare: { general: fare.general, preferente: fare.preferente },
    firstDeparture: parseClock(data?.first_departure),
    lastDeparture: parseClock(data?.last_departure),
    // 0 es el placeholder que sube la app cuando no hay dato
    initialFrequencyMinutes: typeof initial === "number" && initial > 0 ? initial : null,
    frequencyMinutes: typeof frequency === "number" && frequency > 0 ? frequency : null,
  };
}

/**
 * Escucha en vivo el campo `info` del documento `routes/<id>` en Firestore.
 * Devuelve null mientras carga, si no hay conexión/permiso o si el documento
 * no trae datos válidos: en ese caso el llamador usa los datos locales.
 */
export function useRemoteRouteSchedule(routeId: string): RouteSchedule | null {
  const [remote, setRemote] = useState<RouteSchedule | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(
      doc(db, "routes", routeId),
      (snapshot) => setRemote(parseInfo(snapshot.data()?.info)),
      (error) => console.warn("[route info] listener error:", error.message)
    );
    return () => unsubscribe();
  }, [routeId]);

  return remote;
}
