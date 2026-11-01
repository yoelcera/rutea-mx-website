"use client";

import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { buildBusImi } from "@/lib/imi";

interface BusForImi {
  id: string;
  imi: string;
  unidad: string;
  empresa: string;
}

/** A los buses sin IMI se les genera y guarda uno (una vez por bus). No toca updated_at. */
export function useBackfillBusImis(buses: BusForImi[] | null) {
  const attempted = useRef(new Set<string>());

  useEffect(() => {
    if (!db || !buses) return;
    for (const bus of buses) {
      if (bus.imi || !bus.unidad || !bus.empresa || attempted.current.has(bus.id)) continue;
      attempted.current.add(bus.id);
      updateDoc(doc(db, "buses", bus.id), { imi: buildBusImi(bus.empresa, bus.unidad) }).catch(
        () => attempted.current.delete(bus.id)
      );
    }
  }, [buses]);
}
