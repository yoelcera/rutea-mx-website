export type CreationKind = "bus" | "bike" | "walk";
export interface Coord {
  lat: number;
  lng: number;
}

export interface RouteDraft {
  kind: CreationKind | null;
  motivo: string;
  comentarios: string;
  stops: Coord[];
  polyline: Coord[];
}

const KIND_LABEL: Record<CreationKind, string> = {
  bus: "Bus",
  bike: "Bicicleta",
  walk: "Caminando",
};

const fmt = (n: number) => n.toFixed(10);

/** Texto del .txt: datos del formulario + `stops` / `polyline` en formato Swift (solo si hay). */
export function buildRouteTxt(draft: RouteDraft): string {
  const parts = [
    `Tipo de ruta: ${draft.kind ? KIND_LABEL[draft.kind] : ""}`,
    `Motivo: ${draft.motivo}`,
    `Comentarios: ${draft.comentarios}`,
  ];

  if (draft.stops.length > 0) {
    const lines = draft.stops.map((stop, i) => {
      const number = String(i + 1).padStart(2, "0");
      const title = i === 0 ? `title: String(localized: "stopStartEndPin"), ` : "";
      return `    .init(${title}stopNumber: "${number}", latitude: ${fmt(stop.lat)}, longitude: ${fmt(stop.lng)}),`;
    });
    parts.push(`private let stops: [StopModel] = [\n${lines.join("\n")}\n]`);
  }

  if (draft.polyline.length > 0) {
    const lines = draft.polyline.map(
      (point) => `    .init(latitude: ${fmt(point.lat)}, longitude: ${fmt(point.lng)}),`
    );
    parts.push(`private let polyline: [CLLocationCoordinate2D] = [\n${lines.join("\n")}\n]`);
  }

  return parts.join("\n\n") + "\n";
}

function fileName(draft: RouteDraft): string {
  const date = new Date().toISOString().slice(0, 10);
  return `ruta_${draft.kind ?? "sin_tipo"}_${date}.txt`;
}

export function downloadRouteTxt(draft: RouteDraft) {
  const url = URL.createObjectURL(new Blob([buildRouteTxt(draft)], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(draft);
  link.click();
  URL.revokeObjectURL(url);
}

/** Menú de compartir con el .txt adjunto; si el navegador no comparte archivos, lo descarga. */
export async function shareRouteTxt(draft: RouteDraft) {
  const file = new File([buildRouteTxt(draft)], fileName(draft), { type: "text/plain" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      // el usuario cerró el menú de compartir
    }
    return;
  }
  downloadRouteTxt(draft);
}
