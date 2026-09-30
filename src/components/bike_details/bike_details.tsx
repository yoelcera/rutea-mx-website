"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  BIKE_STATUS_LABEL,
  BIKE_TYPE_LABEL,
  BikeStatus,
  BikeType,
  TRIP_TYPE_LABEL,
  TripType,
} from "@/data/bike_types";
import type { LiveBike } from "@/hooks/use_live_bikes";
import { db } from "@/lib/firebase";
import styles from "@/components/admin_gate/admin_gate.module.css";

function formatDate(date: Date | null) {
  return date ? date.toLocaleString("es-MX") : "—";
}

interface Draft {
  brand: string;
  model: string;
  bikeType: BikeType | "";
  status: BikeStatus;
  linkedUserID: string;
  tripType: TripType | "";
}

function toDraft(bike: LiveBike): Draft {
  return {
    brand: bike.brand,
    model: bike.model,
    bikeType: bike.bikeType ?? "",
    status: bike.status,
    linkedUserID: bike.linkedUserID ?? "",
    tripType: bike.tripType ?? "",
  };
}

// Estados que el admin puede elegir (Unknown es solo para valores no reconocidos)
const EDITABLE_STATUSES = Object.values(BikeStatus).filter((s) => s !== BikeStatus.Unknown);

export function BikeDetails({ bike }: { bike: LiveBike }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(bike));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    setDraft(toDraft(bike));
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!db) return;
    setSaving(true);
    setError(null);
    try {
      const linkedUserID = draft.linkedUserID.trim() || null;
      const linkChanged = linkedUserID !== bike.linkedUserID;

      await updateDoc(doc(db, "bikes", bike.id), {
        brand: draft.brand.trim(),
        model: draft.model.trim(),
        bikeType: draft.bikeType || null,
        status: draft.status,
        linkedUserID,
        tripType: draft.tripType || null,
        // Si cambia el vínculo, linkedAt se actualiza solo
        ...(linkChanged && { linkedAt: linkedUserID ? serverTimestamp() : null }),
        updatedAt: serverTimestamp(),
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setSaving(false);
    }
  }

  // En modo normal se ocultan los campos sin dato; al editar se muestran todos
  const row = (label: string, content: React.ReactNode, hasValue: boolean) =>
    !editing && !hasValue ? null : (
      <p className={styles.busDetailRow}>
        <strong>{label}:</strong> {content}
      </p>
    );

  const text = (key: "brand" | "model" | "linkedUserID", shown: string) =>
    editing ? (
      <input
        className={styles.detailInput}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    ) : (
      shown || "—"
    );

  return (
    <div className={styles.busDetailsInfo}>
      {/* Bici */}
      {row("ID", bike.id, true)}
      {row("Número", bike.number || "—", Boolean(bike.number))}
      {row("Operador", bike.operator || "—", Boolean(bike.operator))}
      {row("Marca", text("brand", bike.brand), Boolean(bike.brand))}
      {row("Modelo", text("model", bike.model), Boolean(bike.model))}
      {row(
        "Tipo",
        editing ? (
          <select
            className={styles.detailInput}
            value={draft.bikeType}
            onChange={(event) => update("bikeType", event.target.value as BikeType | "")}
          >
            <option value="">—</option>
            {Object.values(BikeType).map((type) => (
              <option key={type} value={type}>
                {BIKE_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        ) : bike.bikeType ? (
          BIKE_TYPE_LABEL[bike.bikeType]
        ) : (
          "—"
        ),
        bike.bikeType !== null
      )}
      {row(
        "Estado",
        editing ? (
          <select
            className={styles.detailInput}
            value={draft.status}
            onChange={(event) => update("status", event.target.value as BikeStatus)}
          >
            {EDITABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {BIKE_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        ) : (
          BIKE_STATUS_LABEL[bike.status]
        ),
        true
      )}

      {/* Vínculo con usuario */}
      {row("Vinculada a", text("linkedUserID", bike.linkedUserID ?? ""), bike.linkedUserID !== null)}
      {row("Vinculada el", formatDate(bike.linkedAt), bike.linkedAt !== null)}
      {row(
        "Tipo de traslado",
        editing ? (
          <select
            className={styles.detailInput}
            value={draft.tripType}
            onChange={(event) => update("tripType", event.target.value as TripType | "")}
          >
            <option value="">—</option>
            {Object.values(TripType).map((type) => (
              <option key={type} value={type}>
                {TRIP_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        ) : bike.tripType ? (
          TRIP_TYPE_LABEL[bike.tripType]
        ) : (
          "—"
        ),
        bike.tripType !== null
      )}

      {/* Uso */}
      {row("Viajes totales", bike.totalRides, true)}
      {row("Último viaje", formatDate(bike.lastRideAt), bike.lastRideAt !== null)}
      {row(
        "Último mantenimiento",
        formatDate(bike.lastMaintenanceAt),
        bike.lastMaintenanceAt !== null
      )}

      {/* Ubicación */}
      {row("Estación base", bike.homeStationID ?? "—", bike.homeStationID !== null)}
      {row(
        "Última ubicación",
        bike.lat !== null && bike.lng !== null
          ? `${bike.lat.toFixed(5)}, ${bike.lng.toFixed(5)}`
          : "—",
        bike.lat !== null && bike.lng !== null
      )}
      {row(
        "Ubicación actualizada",
        formatDate(bike.lastLocationAt),
        bike.lastLocationAt !== null
      )}

      {/* Auditoría */}
      {row("Creada el", formatDate(bike.createdAt), bike.createdAt !== null)}
      {row("Creada por", bike.createdBy || "—", Boolean(bike.createdBy))}
      {row("Actualizada el", formatDate(bike.updatedAt), bike.updatedAt !== null)}

      {error && <p className={styles.deniedMessage}>{error}</p>}

      <div className={styles.detailActions}>
        {editing ? (
          <>
            <button
              type="button"
              className={styles.detailButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className={styles.detailButton}
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className={styles.detailButton} onClick={startEdit}>
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
