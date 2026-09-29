"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

/** Bicis de la empresa que están vinculadas a un ciclista. */
export function useLinkedBikesCount(empresa: string | null, enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!db || !empresa || !enabled) {
      setCount(0);
      return;
    }

    const bikesQuery = query(
      collection(db, "bikes"),
      where("operator", "==", empresa),
      where("status", "==", "linked")
    );

    return onSnapshot(bikesQuery, (snapshot) => setCount(snapshot.size));
  }, [empresa, enabled]);

  return count;
}
