import {
  doc,
  runTransaction,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from "firebase/firestore";
import type { MobilityType } from "@/data/route_types";

export function counterRef(db: Firestore, mobilityType: MobilityType, empresa: string) {
  return doc(db, "counters", `${mobilityType}_${empresa}`);
}

/**
 * Reserva el siguiente folio dentro de la transacción y ejecuta `create` con él.
 * Si el contador no existe, arranca en 1.
 */
export async function createWithNextFolio(
  db: Firestore,
  mobilityType: MobilityType,
  empresa: string,
  create: (transaction: Transaction, folio: number) => void
): Promise<number> {
  const ref = counterRef(db, mobilityType, empresa);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const folio = ((snap.data()?.lastFolio as number | undefined) ?? 0) + 1;
    transaction.set(ref, { lastFolio: folio }, { merge: true });
    create(transaction, folio);
    return folio;
  });
}

/**
 * Borra `docRef` y, solo si su folio es el último del contador, lo regresa en 1.
 * Si no es el último, el contador se mantiene.
 */
export async function deleteAndReleaseFolio(
  db: Firestore,
  mobilityType: MobilityType,
  empresa: string,
  docRef: DocumentReference,
  folio: number
): Promise<void> {
  const ref = counterRef(db, mobilityType, empresa);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const lastFolio = (snap.data()?.lastFolio as number | undefined) ?? 0;

    if (folio > 0 && folio === lastFolio) {
      transaction.set(ref, { lastFolio: lastFolio - 1 }, { merge: true });
    }
    transaction.delete(docRef);
  });
}
