"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon/icon";
import mapStyles from "@/components/master_map_mapkit/master_map_mapkit.module.css";
import authStyles from "@/components/auth_modal/auth_modal.module.css";
import type { CreationKind } from "@/lib/route_export";
import styles from "./create_route_modal.module.css";

const KINDS: { value: CreationKind; label: string }[] = [
  { value: "bus", label: "Bus" },
  { value: "bike", label: "Bicicleta" },
  { value: "walk", label: "Caminando" },
];

export function CreateRouteModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (data: { kind: CreationKind | null; motivo: string; comentarios: string }) => void;
}) {
  const [kind, setKind] = useState<CreationKind | null>(null);
  const [motivo, setMotivo] = useState("");
  const [comentarios, setComentarios] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onStart({ kind, motivo, comentarios });
  }

  return (
    <div className={authStyles.backdrop} onClick={onClose}>
      <div className={authStyles.card} onClick={(event) => event.stopPropagation()}>
        <form className={authStyles.form} onSubmit={handleSubmit}>
          <div className={authStyles.empresaGroup}>
            <span className={authStyles.empresaLabel}>Tipo de ruta</span>
            <div className={styles.kinds}>
              {KINDS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={kind === item.value ? `${styles.kind} ${styles.kindActive}` : styles.kind}
                  aria-pressed={kind === item.value}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setKind(item.value)}
                >
                  {item.value === "walk" ? (
                    <Icon name="directions_walk" size={22} />
                  ) : (
                    <span
                      className={`${mapStyles.toggleIcon} ${item.value === "bus" ? mapStyles.busIcon : mapStyles.bikeIcon}`}
                      style={{ backgroundColor: "currentColor" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <input
            className={authStyles.input}
            type="text"
            placeholder="Motivo"
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
          />

          <textarea
            className={authStyles.input}
            rows={4}
            placeholder="Comentarios"
            value={comentarios}
            onChange={(event) => setComentarios(event.target.value)}
          />

          <button type="submit" className={authStyles.submitButton}>
            Empezar a crear
          </button>
        </form>
      </div>
    </div>
  );
}
