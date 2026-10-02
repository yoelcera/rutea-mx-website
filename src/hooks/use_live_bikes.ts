"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BikeStatus, type BikeType, type TripType } from "@/data/bike_types";
import { db } from "@/lib/firebase";

/** Sin ubicación nueva en este tiempo, el ride se considera caído (igual que buses). */
const STALE_RIDE_MINUTES = 3;
/** Cada cuánto se vuelve a evaluar, aunque no lleguen snapshots nuevos. */
const STALE_CHECK_MS = 30_000;

type GeoPointLike = { latitude: number; longitude: number } | null | undefined;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LiveBike {
  id: string;
  imi: string;
  number: string;
  operator: string;
  brand: string;
  model: string;
  bike_type: BikeType | null;
  trip_type: TripType | null;
  status: BikeStatus;

  // Vínculo bici–usuario (lo escribe la app)
  rider_id: string | null;
  rider_linked_at: Date | null;

  // Ride activo: existe solo durante el ride (lo escribe la app cada ~10 s)
  rider_location: LatLng | null;
  ride_location_updated_at: Date | null;

  // Uso
  last_ride_at: Date | null;
  total_rides: number;
  last_maintenance_at: Date | null;

  // Ubicación estacionada
  home_station_id: string | null;
  last_location: LatLng | null;
  last_location_at: Date | null;

  // Auditoría
  created_at: Date | null;
  created_by: string;
  updated_at: Date | null;
  qr_generated: boolean;
}

function toDate(raw: unknown): Date | null {
  return (raw as { toDate?: () => Date } | null | undefined)?.toDate?.() ?? null;
}

function toLatLng(raw: unknown): LatLng | null {
  const point = raw as GeoPointLike;
  return point ? { lat: point.latitude, lng: point.longitude } : null;
}

function parseStatus(raw: unknown): BikeStatus {
  return Object.values(BikeStatus).includes(raw as BikeStatus)
    ? (raw as BikeStatus)
    : BikeStatus.Unknown;
}

/** Bicis de la empresa (sin las dadas de baja), ordenadas por número. Tiempo real. */
export function useLiveBikes(empresa: string | null, enabled: boolean) {
  const [bikes, setBikes] = useState<LiveBike[]>([]);

  useEffect(() => {
    if (!db || !empresa || !enabled) {
      setBikes([]);
      return;
    }

    const bikesQuery = query(collection(db, "bikes"), where("operator", "==", empresa));

    const unsubscribe = onSnapshot(bikesQuery, (snapshot) => {
      const allBikes: LiveBike[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = parseStatus(data.status);
        if (status === BikeStatus.Retired) return;

        allBikes.push({
          id: docSnap.id,
          imi: (data.imi as string) ?? "",
          number: (data.number as string) ?? "",
          operator: (data.operator as string) ?? "",
          brand: (data.brand as string) ?? "",
          model: (data.model as string) ?? "",
          bike_type: (data.bike_type as BikeType) ?? null,
          trip_type: (data.trip_type as TripType) ?? null,
          status,
          rider_id: (data.rider_id as string) || null, // "" cuenta como sin rider
          rider_linked_at: toDate(data.rider_linked_at),
          rider_location: toLatLng(data.rider_location),
          ride_location_updated_at: toDate(data.ride_location_updated_at),
          last_ride_at: toDate(data.last_ride_at),
          total_rides: (data.total_rides as number) ?? 0,
          last_maintenance_at: toDate(data.last_maintenance_at),
          home_station_id: (data.home_station_id as string) ?? null,
          last_location: toLatLng(data.last_location),
          last_location_at: toDate(data.last_location_at),
          created_at: toDate(data.created_at),
          created_by: (data.created_by as string) ?? "",
          updated_at: toDate(data.updated_at),
          qr_generated: (data.qr_generated as boolean) ?? false,
        });
      });

      allBikes.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      setBikes(allBikes);
    });

    return () => unsubscribe(); // se desuscribe al salir de la vista
  }, [empresa, enabled]);

  // Re-render local cada 30 s para detectar rides caídos (no hace lecturas a Firestore)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setTick((tick) => tick + 1), STALE_CHECK_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  return bikes;
}

/**
 * Ride activo: existe rider_location y la última ubicación llegó hace ≤ 3 min.
 * Si la app deja de subir ubicaciones (cierre, sin señal), la bici se muestra inactiva.
 */
export function hasActiveRide(bike: LiveBike): boolean {
  if (bike.rider_location === null) return false;
  // Igual que buses: sin timestamp no se puede saber si está viejo (versiones viejas de la app)
  if (!bike.ride_location_updated_at) return true;
  return Date.now() - bike.ride_location_updated_at.getTime() <= STALE_RIDE_MINUTES * 60 * 1000;
}

/** Disponible: status "available" y sin rider_id. */
export function isBikeAvailable(bike: LiveBike): boolean {
  return bike.status === BikeStatus.Available && !bike.rider_id;
}
