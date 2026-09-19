/**
 * Datos de rutas de transporte público, agrupados por empresa (operador).
 *
 * Los tipos viven en `route_types.ts`; cada ruta vive en `data/<ciudad>/<empresa>.ts`,
 * con sus `stops` y `path` como constantes aparte. Este archivo solo las junta.
 */

import type { TransitRoute, TransitRouteColor } from "./route_types";
export * from "./route_types";

import { ensVioleta01Route } from "./ensenada/violeta";
import { ensAguilas89Route } from "./ensenada/amarillos";
import {
  ensAmpIndecoRoute,
  ensPopularJuarezRoute,
  ens6toAyuntamientoRoute,
  ensChapultepecRoute,
} from "./ensenada/rojos";
import { ensFloresParaisoRoute } from "./ensenada/nativos";
import { ensEnsSauzalRoute } from "./ensenada/vigia";
import { ensEnsSanMiguelRoute } from "./ensenada/brisa";

/** Tomado directamente del color dominante de cada ícono de parada. */
export const ROUTE_COLOR_HEX: Record<TransitRouteColor, string> = {
  violeta: "#5A00A7",
  amarillo: "#A09B3F",
  rojo: "#80001F",
  azul: "#2A67BE",
  nativos: "#3DA29F",
  brisa: "#D17100",
};

/** Color de texto con buen contraste sobre cada `ROUTE_COLOR_HEX`. */
export const ROUTE_COLOR_TEXT: Record<TransitRouteColor, string> = {
  violeta: "#FFFFFF",
  amarillo: "#FFFFFF",
  rojo: "#FFFFFF",
  azul: "#FFFFFF",
  nativos: "#FFFFFF",
  brisa: "#FFFFFF",
};

/** Ícono de parada por empresa (mismo que la app). */
export const ROUTE_STOP_ICON: Record<TransitRouteColor, string> = {
  violeta: "/bus_stops/violeta_bus_stop.png",
  amarillo: "/bus_stops/amarillos_bus_stop.png",
  rojo: "/bus_stops/rojos_bus_stop.png",
  azul: "/bus_stops/vigia_bus_stop.png",
  nativos: "/bus_stops/nativos_bus_stop.png",
  brisa: "/bus_stops/brisa_bus_stop.png",
};

export type TransitOperator = {
  slug: string;
  name: string;
  city: string;
  /** TODO: no está en el dato de origen. */
  terminalLocation: string | null;
};

export const TRANSIT_OPERATORS: TransitOperator[] = [
  { slug: "violeta", name: "Violeta", city: "ensenada", terminalLocation: null },
  { slug: "rojos", name: "Rojos y Blancos", city: "ensenada", terminalLocation: null },
  { slug: "amarillos", name: "Amarillos y Blancos", city: "ensenada", terminalLocation: null },
  { slug: "vigia", name: "Vigía", city: "ensenada", terminalLocation: null },
  { slug: "nativos", name: "Nativos", city: "ensenada", terminalLocation: null },
  { slug: "brisa", name: "Brisa", city: "ensenada", terminalLocation: null },
];

export const TRANSIT_ROUTES: TransitRoute[] = [
  ensVioleta01Route,
  ensAguilas89Route,
  ensAmpIndecoRoute,
  ensPopularJuarezRoute,
  ens6toAyuntamientoRoute,
  ensChapultepecRoute,
  ensFloresParaisoRoute,
  ensEnsSauzalRoute,
  ensEnsSanMiguelRoute,
];

export function getAllRouteSlugs(): string[] {
  return TRANSIT_ROUTES.map((route) => route.slug);
}

export function getRouteBySlug(slug: string): TransitRoute | undefined {
  return TRANSIT_ROUTES.find((route) => route.slug === slug);
}

export function getOperatorBySlug(slug: string): TransitOperator | undefined {
  return TRANSIT_OPERATORS.find((operator) => operator.slug === slug);
}

/**
 * The "empresa" field used in Firestore (buses/admins collections) doesn't
 * always match our operatorSlug values 1:1 (e.g. "violeta" -> "violetas").
 * This table keeps the single source of truth for that translation.
 */
export const OPERATOR_EMPRESA: Record<string, string> = {
  violeta: "violetas",
  rojos: "rojos",
  amarillos: "amarillos",
  vigia: "vigia",
  nativos: "nativos",
  brisa: "brisa",
};

export function getEmpresaByOperatorSlug(slug: string): string {
  return OPERATOR_EMPRESA[slug] ?? slug;
}

export function getOperatorSlugByEmpresa(empresa: string): string | undefined {
  return Object.entries(OPERATOR_EMPRESA).find(([, value]) => value === empresa)?.[0];
}

export function getRoutesByOperator(operatorSlug: string): TransitRoute[] {
  return TRANSIT_ROUTES.filter((route) => route.operatorSlug === operatorSlug);
}

export function getOperatorsByCity(city: string): TransitOperator[] {
  return TRANSIT_OPERATORS.filter((operator) => operator.city === city);
}

export function getOperatorsWithRoutes(city?: string): Array<{
  operator: TransitOperator;
  routes: TransitRoute[];
}> {
  const operators = city ? getOperatorsByCity(city) : TRANSIT_OPERATORS;

  return operators.map((operator) => ({
    operator,
    routes: getRoutesByOperator(operator.slug),
  }));
}
