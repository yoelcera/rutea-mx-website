import { IMI_TYPE_CATEGORY } from "@/data/imi_types";
import { MOBILITY_IMI_TAG, type MobilityType } from "@/data/route_types";

const IMI_PREFIX = "IMI";
const IMI_LOCATION = "MXBCENS"; // México + Baja California + Ensenada

interface BuildImiInput {
  mobilityType: MobilityType;
  folio: string | number;
  operator?: string | null; // opcional
}

/** Ej. IMI-MXBCENS-TRN-UABC-BIC-042 */
export function buildImi({ mobilityType, folio, operator }: BuildImiInput): string {
  const type = MOBILITY_IMI_TAG[mobilityType];
  const parts = [IMI_PREFIX, IMI_LOCATION, IMI_TYPE_CATEGORY[type]];
  if (operator) parts.push(operator.toUpperCase());
  parts.push(type, String(folio).padStart(3, "0"));
  return parts.join("-");
}
