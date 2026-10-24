"use client";

import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { BikeStatus } from "@/data/bike_types";
import { MobilityType } from "@/data/route_types";
import type { AdminStatus } from "@/hooks/use_admin_auth";
import type { LiveBus } from "@/hooks/use_live_buses";
import { db } from "@/lib/firebase";

/** Igual que en use_live_bikes: sin ubicación nueva en 3 min, el ride se considera caído. */
const STALE_RIDE_MINUTES = 3;
const STALE_CHECK_MS = 30_000;

export interface MasterAdmin {
  id: string;
  nombre: string;
  correo: string;
  empresa: string | null;
  status: AdminStatus;
  master: boolean;
}

/** Bus de cualquier empresa y cualquier status (useLiveBuses solo trae los "approved"). */
export interface MasterBus extends LiveBus {
  empresa: string;
  status: string;
}

export interface MasterBike {
  id: string;
  number: string;
  imi: string;
  operator: string;
  status: BikeStatus;
  riderId: string | null;
  riderLocation: { lat: number; lng: number } | null;
  rideUpdatedAt: Date | null;
  qrGenerated: boolean;
}

function toDate(raw: unknown): Date | null {
  return (raw as { toDate?: () => Date } | null | undefined)?.toDate?.() ?? null;
}

const byNumber = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

function parseAdmin(docSnap: QueryDocumentSnapshot): MasterAdmin {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    nombre: (data.nombre as string) ?? "",
    correo: (data.correo as string) ?? "",
    empresa: (data.empresa as string) ?? null,
    status: (data.status as AdminStatus) ?? "none",
    master: data.master === true,
  };
}

function parseBus(docSnap: QueryDocumentSnapshot): MasterBus {
  const data = docSnap.data();
  const location = data.driver_location as { latitude: number; longitude: number } | undefined;
  return {
    id: docSnap.id,
    busId: (data.bus_id as string) ?? docSnap.id,
    routeId: (data.route_id as string) ?? "",
    lat: location?.latitude ?? null,
    lng: location?.longitude ?? null,
    driverId: (data.driver_id as string) || null,
    driverName: (data.driver_name as string) ?? "",
    unidad: (data.unidad as string) ?? "",
    plate: (data.plate as string) ?? "",
    passengersCount: (data.passengers_count as number) ?? 0,
    updatedAt: toDate(data.updated_at),
    qrGenerated: (data.qr_generated as boolean) ?? false,
    empresa: (data.empresa as string) ?? "",
    status: (data.status as string) ?? "pending",
  };
}

function parseBike(docSnap: QueryDocumentSnapshot): MasterBike {
  const data = docSnap.data();
  const location = data.rider_location as { latitude: number; longitude: number } | null | undefined;
  const status = Object.values(BikeStatus).includes(data.status as BikeStatus)
    ? (data.status as BikeStatus)
    : BikeStatus.Unknown;
  return {
    id: docSnap.id,
    number: (data.number as string) ?? "",
    imi: (data.imi as string) ?? "",
    operator: (data.operator as string) ?? "",
    status,
    riderId: (data.rider_id as string) || null,
    riderLocation: location ? { lat: location.latitude, lng: location.longitude } : null,
    rideUpdatedAt: toDate(data.ride_location_updated_at),
    qrGenerated: (data.qr_generated as boolean) ?? false,
  };
}

/**
 * Escucha `buildQuery()` en tiempo real SOLO mientras `open` sea true.
 * Al cerrarse se desuscribe (cero lecturas) y conserva lo último que leyó.
 * `null` = todavía no se ha leído nunca.
 */
function useLazySnapshot<T>(
  open: boolean,
  key: string,
  buildQuery: () => Query<DocumentData> | null,
  parse: (docSnap: QueryDocumentSnapshot) => T,
  sort: (a: T, b: T) => number
): T[] | null {
  const [data, setData] = useState<T[] | null>(null);

  useEffect(() => {
    if (!open) return;
    const q = buildQuery();
    if (!q) return;

    return onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(parse).sort(sort));
    });
    // `key` describe la consulta; buildQuery/parse/sort son estables por uso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  return data;
}

/** Admins (todos, o solo los de `empresa`). */
export function useMasterAdmins(open: boolean, empresa?: string) {
  return useLazySnapshot(
    open,
    `admins:${empresa ?? "*"}`,
    () => {
      if (!db) return null;
      const ref = collection(db, "admins");
      return empresa ? query(ref, where("empresa", "==", empresa)) : ref;
    },
    parseAdmin,
    (a, b) => a.nombre.localeCompare(b.nombre)
  );
}

/** Buses (todos, solo de `empresa`, y/o solo los "approved"). */
export function useMasterBuses(open: boolean, options: { empresa?: string; onlyApproved?: boolean } = {}) {
  const { empresa, onlyApproved = false } = options;
  return useLazySnapshot(
    open,
    `buses:${empresa ?? "*"}:${onlyApproved}`,
    () => {
      if (!db) return null;
      const filters = [
        ...(empresa ? [where("empresa", "==", empresa)] : []),
        ...(onlyApproved ? [where("status", "==", "approved")] : []),
      ];
      return query(collection(db, "buses"), ...filters);
    },
    parseBus,
    (a, b) => byNumber(a.unidad, b.unidad)
  );
}

/** Bicis (todas, o solo las de `empresa`). */
export function useMasterBikes(open: boolean, empresa?: string) {
  return useLazySnapshot(
    open,
    `bikes:${empresa ?? "*"}`,
    () => {
      if (!db) return null;
      const ref = collection(db, "bikes");
      return empresa ? query(ref, where("operator", "==", empresa)) : ref;
    },
    parseBike,
    (a, b) => byNumber(a.number, b.number)
  );
}

/** Re-render local cada 30 s (sin lecturas) para que lo viejo deje de contar como activo. */
export function useStaleTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), STALE_CHECK_MS);
    return () => clearInterval(interval);
  }, []);
}

/** Misma lógica que hasActiveRide de use_live_bikes. */
export function hasActiveBikeRide(bike: MasterBike): boolean {
  if (!bike.riderLocation) return false;
  if (!bike.rideUpdatedAt) return true;
  return Date.now() - bike.rideUpdatedAt.getTime() <= STALE_RIDE_MINUTES * 60 * 1000;
}
