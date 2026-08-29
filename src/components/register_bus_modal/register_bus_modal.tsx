"use client";

import { useState, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getOperatorSlugByEmpresa, getRoutesByOperator } from "@/data/routes";
import { db } from "@/lib/firebase";
import styles from "./register_bus_modal.module.css";

interface RegisterBusModalProps {
  empresa: string | null;
  onClose: () => void;
}

export function RegisterBusModal({ empresa, onClose }: RegisterBusModalProps) {
  const operatorSlug = empresa ? getOperatorSlugByEmpresa(empresa) : undefined;
  const routes = operatorSlug ? getRoutesByOperator(operatorSlug) : [];

  const [unidad, setUnidad] = useState("");
  const [plate, setPlate] = useState("");
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!db || !empresa) {
      setError("Firebase no está configurado.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "buses"), {
        empresa,
        unidad,
        plate,
        route_id: routeId,
        passengers_count: 0,
        driver_location: null,
        updated_at: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.title}>Registrar unidad</h3>

        {!empresa ? (
          <p className={styles.error}>
            Inicia sesión con una cuenta aprobada para registrar unidades.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="text"
              placeholder="Unidad"
              value={unidad}
              onChange={(event) => setUnidad(event.target.value)}
              required
            />

            <input
              className={styles.input}
              type="text"
              placeholder="Placas"
              value={plate}
              onChange={(event) => setPlate(event.target.value)}
              required
            />

            {routes.length > 0 && (
              <select
                className={styles.input}
                value={routeId}
                onChange={(event) => setRouteId(event.target.value)}
                required
              >
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Espera..." : "Registrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
