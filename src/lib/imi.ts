import { IMI_TYPE_CATEGORY } from "@/data/imi_types";
import { MOBILITY_IMI_TAG, MobilityType } from "@/data/route_types";

const IMI_PREFIX = "IMI";
const IMI_LOCATION = "MXBCENS"; // México + Baja California + Ensenada

/** Abreviación de cada empresa (clave = campo "empresa"/"operator" de Firestore). */
const IMI_OPERATOR_CODE: Record<string, string> = {
  violetas: "VIO",
  rojos: "RYB",
  amarillos: "AYB",
  vigia: "VIG",
  nativos: "NAT",
  brisa: "BRI",
  uabc: "UABC",
};

function operatorCode(operator: string): string {
  return IMI_OPERATOR_CODE[operator] ?? operator.toUpperCase();
}

interface BuildImiInput {
  mobilityType: MobilityType;
  folio: string | number;
  operator?: string | null; // opcional
}

/** Ej. IMI-MXBCENS-TRN-UABC-BIC-042 / IMI-MXBCENS-TRN-RYB-BUS-045 */
export function buildImi({ mobilityType, folio, operator }: BuildImiInput): string {
  const type = MOBILITY_IMI_TAG[mobilityType];
  const parts = [IMI_PREFIX, IMI_LOCATION, IMI_TYPE_CATEGORY[type]];
  if (operator) parts.push(operatorCode(operator));
  parts.push(type, String(folio).padStart(3, "0"));
  return parts.join("-");
}

/** IMI de un bus: el folio es su número de unidad. */
export function buildBusImi(empresa: string, unidad: string): string {
  return buildImi({ mobilityType: MobilityType.Bus, folio: unidad.trim(), operator: empresa });
}
