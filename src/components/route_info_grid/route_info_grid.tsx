"use client";

import { formatClockTime, formatFare } from "@/data/route_types";
import { useRemoteRouteSchedule, type RouteSchedule } from "@/hooks/use_remote_route_schedule";
import styles from "./route_info_grid.module.css";

interface RouteInfoGridProps {
  routeId: string;
  stopCount: number;
  /** Datos locales: se muestran mientras carga Firestore o si no hay dato remoto. */
  fallback: RouteSchedule;
}

export function RouteInfoGrid({ routeId, stopCount, fallback }: RouteInfoGridProps) {
  const schedule = useRemoteRouteSchedule(routeId) ?? fallback;

  const items: Array<{ label: string; value: string; note?: string }> = [];
  if (schedule.firstDeparture)
    items.push({ label: "Primera salida", value: formatClockTime(schedule.firstDeparture) });
  if (schedule.lastDeparture)
    items.push({ label: "Última salida", value: formatClockTime(schedule.lastDeparture) });
  if (schedule.frequencyMinutes)
    items.push({ label: "Frecuencia", value: `Cada ${schedule.frequencyMinutes} min` });
  if (schedule.initialFrequencyMinutes)
    items.push({
      label: "Frecuencia inicial",
      value: `Cada ${schedule.initialFrequencyMinutes} min`,
    });
  items.push(
    schedule.fare.general === 0
      ? { label: "Tarifa", value: "Gratis" }
      : {
          label: "Tarifa",
          value: formatFare(schedule.fare.general),
          note: `Estudiante ${formatFare(schedule.fare.preferente)}`,
        }
  );
  items.push({ label: "Paradas", value: String(stopCount) });

  return (
    <dl className={styles.infoGrid}>
      {items.map((item) => (
        <div key={item.label} className={styles.infoItem}>
          <dt className={styles.infoLabel}>{item.label}</dt>
          <dd className={styles.infoValue}>{item.value}</dd>
          {item.note && <dd className={styles.infoNote}>{item.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
