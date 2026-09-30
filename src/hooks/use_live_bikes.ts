"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BikeStatus, type BikeType, type TripType } from "@/data/bike_types";
import type { LiveBus } from "@/hooks/use_live_buses";
import { db } from "@/lib/firebase";

export interface LiveBike {
  id: string;
  imi: string;
  number: string;
  operator: string;
  brand: string;
  model: string;
  bikeType: BikeType | null;
  tripType: TripType | null;
  status: BikeStatus;

  // Vínculo con usuario
  linkedUserID: string | null;
  linkedAt: Date | null;

  // Uso
  lastRideAt: Date | null;
  totalRides: number;
  lastMaintenanceAt: Date | null;

  // Ubicación
  homeStationID: string | null;
  lat: number | null;
  lng: number | null;
  lastLocationAt: Date | null;

  // Auditoría
  createdAt: Date | null;
  createdBy: string;
  updatedAt: Date | null;
  qrGenerated: boolean;
}

function toDate(raw: unknown): Date | null {
  return (raw as { toDate?: () => Date } | null | undefined)?.toDate?.() ?? null;
}

function parseStatus(raw: unknown): BikeStatus {
  return Object.values(BikeStatus).includes(raw as BikeStatus)
    ? (raw as BikeStatus)
    : BikeStatus.Unknown;
}

/** Bicis de la empresa (sin las dadas de baja), ordenadas por número. */
export function useLiveBikes(empresa: string | null, enabled: boolean) {
  const [bikes, setBikes] = useState<LiveBike[]>([]);

  useEffect(() => {
    if (!db || !empresa || !enabled) {
      setBikes([]);
      return;
    }

    const bikesQuery = query(collection(db, "bikes"), where("operator", "==", empresa));

    return onSnapshot(bikesQuery, (snapshot) => {
      const allBikes: LiveBike[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = parseStatus(data.status);
        if (status === BikeStatus.Retired) return;

        const location = data.lastLocation as
          | { latitude: number; longitude: number }
          | null
          | undefined;

        allBikes.push({
          id: docSnap.id,
          imi: (data.imi as string) ?? "",
          number: (data.number as string) ?? "",
          operator: (data.operator as string) ?? "",
          brand: (data.brand as string) ?? "",
          model: (data.model as string) ?? "",
          bikeType: (data.bikeType as BikeType) ?? null,
          tripType: (data.tripType as TripType) ?? null,
          status,
          linkedUserID: (data.linkedUserID as string) ?? null,
          linkedAt: toDate(data.linkedAt),
          lastRideAt: toDate(data.lastRideAt),
          totalRides: (data.totalRides as number) ?? 0,
          lastMaintenanceAt: toDate(data.lastMaintenanceAt),
          homeStationID: (data.homeStationID as string) ?? null,
          lat: location?.latitude ?? null,
          lng: location?.longitude ?? null,
          lastLocationAt: toDate(data.lastLocationAt),
          createdAt: toDate(data.createdAt),
          createdBy: (data.createdBy as string) ?? "",
          updatedAt: toDate(data.updatedAt),
          qrGenerated: (data.qrGenerated as boolean) ?? false,
        });
      });

      allBikes.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      setBikes(allBikes);
    });
  }, [empresa, enabled]);

  return bikes;
}

/** Adapta una bici al formato del mapa: aparece solo si está vinculada y tiene ubicación. */
export function bikeToMapUnit(bike: LiveBike): LiveBus {
  return {
    id: bike.id,
    busId: bike.imi,
    routeId: "",
    lat: bike.lat,
    lng: bike.lng,
    driverId: bike.status === BikeStatus.Linked ? bike.linkedUserID : null,
    driverName: "",
    unidad: bike.number,
    plate: "",
    passengersCount: 0,
    updatedAt: bike.lastLocationAt,
    qrGenerated: false,
  };
}
