"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

const STALE_MINUTES = 3;

export interface LiveBus {
  id: string;
  busId: string;
  routeId: string;
  lat: number | null;
  lng: number | null;
  driverId: string | null;
  driverName: string;
  unidad: string;
  plate: string;
  passengersCount: number;
  updatedAt: Date | null;
  qrGenerated: boolean;
}

/** A bus counts as "active" when it has a fresh location fix. */
export function isBusActive(bus: LiveBus): bus is LiveBus & { lat: number; lng: number } {
  if (bus.lat === null || bus.lng === null) return false;
  if (!bus.updatedAt) return true;
  return Date.now() - bus.updatedAt.getTime() <= STALE_MINUTES * 60 * 1000;
}

/** Un bus solo cuenta como "con chofer" si tiene driver_id y una ubicación real. */
export function hasAssignedDriver(bus: LiveBus): bus is LiveBus & { lat: number; lng: number } {
  return Boolean(bus.driverId) && bus.lat !== null && bus.lng !== null;
}

export function useLiveBuses(empresa: string | null) {
  const [buses, setBuses] = useState<LiveBus[]>([]);

  useEffect(() => {
    if (!db || !empresa) {
      setBuses([]);
      return;
    }

    const busesQuery = query(
      collection(db, "buses"),
      where("empresa", "==", empresa),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(busesQuery, (snapshot) => {
      const allBuses: LiveBus[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const location = data.driver_location as { latitude: number; longitude: number } | undefined;
        const updatedAt = (data.updated_at as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

        allBuses.push({
          id: docSnap.id,
          busId: (data.bus_id as string) ?? docSnap.id,
          routeId: (data.route_id as string) ?? "",
          lat: location?.latitude ?? null,
          lng: location?.longitude ?? null,
          driverId: (data.driver_id as string) ?? null,
          driverName: (data.driver_name as string) ?? "",
          unidad: (data.unidad as string) ?? "",
          plate: (data.plate as string) ?? "",
          passengersCount: (data.passengers_count as number) ?? 0,
          updatedAt,
          qrGenerated: (data.qr_generated as boolean) ?? false,
        });
      });

      allBuses.sort((a, b) => a.unidad.localeCompare(b.unidad, undefined, { numeric: true }));
      setBuses(allBuses);
    });

    return () => unsubscribe();
  }, [empresa]);

  return buses;
}
