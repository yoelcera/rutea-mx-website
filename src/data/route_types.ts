import { ImiType } from "./imi_types";

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

export type StreetType =
  | "calle" | "avenida" | "boulevard" | "calzada" | "carretera" | "autopista"
  | "privada" | "callejon" | "andador" | "circuito" | "prolongacion" | "libramiento";

export type ColoniaType =
  | "colonia" | "fraccionamiento" | "barrio" | "ejido"
  | "unidadHabitacional" | "residencial" | "zonaCentro";

export type PoiCategory =
  | "pharmacy" | "movieTheater" | "restaurant" | "store" | "foodMarket" | "park"
  | "school" | "university" | "hospital" | "cafe" | "bank" | "place";

export type StreetRelation =
  | "principal" | "cruza" | "paralelo" | "segundoParalelo" | "lugar";

export type PlaceType =
  | { kind: "road"; type: StreetType }
  | { kind: "neighborhood"; type: ColoniaType }
  | { kind: "poi"; category: PoiCategory };

export type StreetOrPlace = {
  name: string;
  type: PlaceType | null;
  relation: StreetRelation | null;
};

export const STREET_TYPE_LABEL: Record<StreetType, string> = {
  calle: "Calle", avenida: "Avenida", boulevard: "Boulevard", calzada: "Calzada",
  carretera: "Carretera", autopista: "Autopista", privada: "Privada",
  callejon: "Callejón", andador: "Andador", circuito: "Circuito",
  prolongacion: "Prolongación", libramiento: "Libramiento",
};

export const COLONIA_TYPE_LABEL: Record<ColoniaType, string> = {
  colonia: "Colonia", fraccionamiento: "Fraccionamiento", barrio: "Barrio",
  ejido: "Ejido", unidadHabitacional: "Unidad habitacional",
  residencial: "Residencial", zonaCentro: "Zona centro",
};

export const POI_CATEGORY_LABEL: Record<PoiCategory, string> = {
  pharmacy: "Farmacia", movieTheater: "Cine", restaurant: "Restaurante",
  store: "Tienda", foodMarket: "Mercado", park: "Parque", school: "Escuela",
  university: "Universidad", hospital: "Hospital", cafe: "Café",
  bank: "Banco", place: "Lugar",
};

export const STREET_RELATION_LABEL: Record<StreetRelation, string> = {
  principal: "Principal", cruza: "Cruza", paralelo: "Paralelo",
  segundoParalelo: "Segundo paralelo", lugar: "Lugar",
};

export type TransitRoute = {
  id: string;
  slug: string;
  shortTitle: string;
  longTitle: string | null;
  subtitle: string | null;
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
  streetsAndPlaces: StreetOrPlace[];
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

export enum MobilityType {
  Bus = "bus",
  Bike = "bike",
}

/** imi_tag de cada modo de movilidad (bike → BIC, bus → BUS). */
export const MOBILITY_IMI_TAG: Record<MobilityType, ImiType> = {
  [MobilityType.Bus]: ImiType.Bus,
  [MobilityType.Bike]: ImiType.Bike,
};

/** Etiqueta de la lista del panel admin según el tipo de movilidad. */
export const MOBILITY_ROSTER_LABEL: Record<MobilityType, string> = {
  [MobilityType.Bus]: "Buses:",
  [MobilityType.Bike]: "Ciclistas:",
};
