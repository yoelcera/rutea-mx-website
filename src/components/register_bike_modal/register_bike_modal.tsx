"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { BIKE_TYPE_LABEL, BikeType } from "@/data/bike_types";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { db } from "@/lib/firebase";
import { counterRef, createWithNextFolio } from "@/lib/folio";
import { buildImi } from "@/lib/imi";
import styles from "@/components/register_bus_modal/register_bus_modal.module.css";

interface RegisterBikeModalProps {
  empresa: string | null;
  onClose: () => void;
}

export function RegisterBikeModal({ empresa, onClose }: RegisterBikeModalProps) {
  const { user, mobilityType } = useAdminAuth();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [bikeType, setBikeType] = useState<BikeType>(BikeType.Street);
  const [homeStationID, setHomeStationID] = useState("");
  const [nextFolio, setNextFolio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Vista previa del siguiente IMI (el definitivo se asigna al registrar)
  useEffect(() => {
    if (!db || !empresa) return;
    getDoc(counterRef(db, mobilityType, empresa)).then((snap) => {
      setNextFolio(((snap.data()?.lastFolio as number | undefined) ?? 0) + 1);
    });
  }, [empresa, mobilityType]);

  const previewImi =
    nextFolio && empresa ? buildImi({ mobilityType, folio: nextFolio, operator: empresa }) : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!db || !empresa || !user) {
      setError("Firebase no está configurado.");
      return;
    }

    const firestore = db;
    setLoading(true);
    try {
      await createWithNextFolio(firestore, mobilityType, empresa, (transaction, folio) => {
        // Igual que BikeModel.init en la app: UUID en minúsculas
        const id = crypto.randomUUID().toLowerCase();
        const number = String(folio).padStart(3, "0");

        transaction.set(doc(firestore, "bikes", id), {
          id,
          imi: buildImi({ mobilityType, folio, operator: empresa }),
          number,
          operator: empresa,
          status: "available",

          // Bici
          brand: brand.trim(),
          model: model.trim(),
          bikeType,

          // Vínculo con usuario
          linkedUserID: null,
          linkedAt: null,
          tripType: null, // TripType, se asigna al vincular

          // Uso
          lastRideAt: null,
          totalRides: 0,
          lastMaintenanceAt: null,

          // Ubicación
          homeStationID: homeStationID.trim() || null,
          lastLocation: null,
          lastLocationAt: null,

          // Auditoría
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          updatedAt: serverTimestamp(),
        });
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
        <h3 className={styles.title}>Registrar bici</h3>

        {!empresa ? (
          <p className={styles.error}>
            Inicia sesión con una cuenta aprobada para registrar unidades.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {previewImi && <p className={styles.imiPreview}>IMI: {previewImi}</p>}

            <input
              className={styles.input}
              type="text"
              placeholder="Marca"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              required
            />

            <input
              className={styles.input}
              type="text"
              placeholder="Modelo"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              required
            />

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Tipo de bici</span>
              <select
                className={styles.input}
                value={bikeType}
                onChange={(event) => setBikeType(event.target.value as BikeType)}
                required
              >
                {Object.values(BikeType).map((type) => (
                  <option key={type} value={type}>
                    {BIKE_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>

            <input
              className={styles.input}
              type="text"
              placeholder="Estación base (opcional)"
              value={homeStationID}
              onChange={(event) => setHomeStationID(event.target.value)}
            />

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
