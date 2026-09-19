export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type RouteStop = {
  /** Número de parada o "Inicio/Fin"; `null` si el dato de origen no traía etiqueta. */
  label: string | null;
  isTerminal: boolean;
  lat: number;
  lng: number;
};

export type TransitRouteColor =
  | "violeta"
  | "amarillo"
  | "rojo"
  | "azul"
  | "nativos"
  | "brisa";

export type ClockTime = { hour: number; minute: number };

export type RouteFare = {
  /** Tarifa normal. */
  general: number;
  /** Tarifa preferente (estudiante). */
  preferente: number;
};

export const FARE_ENSENADA: RouteFare = { general: 15.5, preferente: 15.5 * 0.5 };
export const FARE_GRATIS: RouteFare = { general: 0, preferente: 0 };

export type TransitRoute = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: TransitRouteColor;
  city: string;
  operatorSlug: string;
  fare: RouteFare;
  firstDeparture: ClockTime | null;
  lastDeparture: ClockTime | null;
  /** Frecuencia (min) durante las primeras horas del servicio, si es distinta. */
  initialFrequencyMinutes: number | null;
  frequencyMinutes: number | null;
  stops: RouteStop[];
  path: LatLngLiteral[];
};

/** 4:30 a. m. / 9:00 p. m. */
export function formatClockTime({ hour, minute }: ClockTime): string {
  const suffix = hour < 12 ? "a. m." : "p. m.";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatFare(amount: number): string {
  return amount === 0 ? "Gratis" : `$${amount.toFixed(2)}`;
}
