"use client";

import { collection, getDocs, onSnapshot, type QueryDocumentSnapshot } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { useBackfillBusImis } from "@/hooks/use_backfill_bus_imis";
import {
  parseAdmin,
  parseBike,
  parseBus,
  sortAdmins,
  sortBikes,
  sortBuses,
  type MasterAdmin,
  type MasterBike,
  type MasterBus,
} from "@/hooks/use_master_data";
import { db } from "@/lib/firebase";

type CollectionName = "buses" | "bikes" | "admins";

interface MasterStore {
  buses: MasterBus[] | null;
  bikes: MasterBike[] | null;
  admins: MasterAdmin[] | null;
  /** ✓ = escucha todo siempre; ✗ = solo lo que tenga una sección abierta. */
  listenersOn: boolean;
  setListenersOn: Dispatch<SetStateAction<boolean>>;
  /** Registra que alguien necesita escuchar `name`; devuelve la función para soltarlo. */
  demand: (name: CollectionName) => () => void;
}

const MasterStoreContext = createContext<MasterStore | null>(null);

/**
 * - Al iniciar sesión como cuenta maestra (`enabled`) lee la colección UNA vez.
 * - Escucha en tiempo real solo mientras `listen` sea true; al apagarse conserva lo último.
 * - Al cerrar sesión se limpia.
 * `null` = todavía cargando.
 */
function useCollection<T>(
  name: CollectionName,
  enabled: boolean,
  listen: boolean,
  parse: (docSnap: QueryDocumentSnapshot) => T,
  sort: (a: T, b: T) => number
): T[] | null {
  const [data, setData] = useState<T[] | null>(null);

  useEffect(() => {
    if (!enabled || !db) {
      setData(null);
      return;
    }
    let cancelled = false;
    getDocs(collection(db, name))
      .then((snapshot) => {
        // Si un listener ya trajo datos, esos son iguales o más nuevos
        if (!cancelled) setData((prev) => prev ?? snapshot.docs.map(parse).sort(sort));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // parse/sort son funciones de módulo (estables)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, enabled]);

  useEffect(() => {
    if (!enabled || !listen || !db) return;
    return onSnapshot(collection(db, name), (snapshot) => {
      setData(snapshot.docs.map(parse).sort(sort));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, enabled, listen]);

  return data;
}

export function MasterStoreProvider({ children }: { children: ReactNode }) {
  const { isMaster } = useAdminAuth();
  const [listenersOn, setListenersOn] = useState(false);
  const [demands, setDemands] = useState<Record<CollectionName, number>>({
    buses: 0,
    bikes: 0,
    admins: 0,
  });

  // Cada inicio de sesión arranca en ✗
  useEffect(() => {
    if (!isMaster) setListenersOn(false);
  }, [isMaster]);

  const demand = useCallback((name: CollectionName) => {
    setDemands((prev) => ({ ...prev, [name]: prev[name] + 1 }));
    return () => setDemands((prev) => ({ ...prev, [name]: prev[name] - 1 }));
  }, []);

  const buses = useCollection("buses", isMaster, listenersOn || demands.buses > 0, parseBus, sortBuses);
  const bikes = useCollection("bikes", isMaster, listenersOn || demands.bikes > 0, parseBike, sortBikes);
  const admins = useCollection(
    "admins",
    isMaster,
    listenersOn || demands.admins > 0,
    parseAdmin,
    sortAdmins
  );

  // Buses sin IMI: se les genera y guarda automático
  useBackfillBusImis(buses);

  return (
    <MasterStoreContext.Provider
      value={{ buses, bikes, admins, listenersOn, setListenersOn, demand }}
    >
      {children}
    </MasterStoreContext.Provider>
  );
}

export function useMasterStore(): MasterStore {
  const store = useContext(MasterStoreContext);
  if (!store) throw new Error("useMasterStore debe usarse dentro de MasterStoreProvider");
  return store;
}

/** Mientras `active` sea true, pide que `name` se escuche en tiempo real. */
function useDemand(name: CollectionName, active: boolean) {
  const { demand } = useMasterStore();
  useEffect(() => (active ? demand(name) : undefined), [active, name, demand]);
}

/** Todos los buses. `listen` = esta sección necesita tiempo real. */
export function useMasterBuses(listen: boolean) {
  useDemand("buses", listen);
  return useMasterStore().buses;
}

/** Todas las bicis. `listen` = esta sección necesita tiempo real. */
export function useMasterBikes(listen: boolean) {
  useDemand("bikes", listen);
  return useMasterStore().bikes;
}

/** Todos los admins. `listen` = esta sección necesita tiempo real. */
export function useMasterAdmins(listen: boolean) {
  useDemand("admins", listen);
  return useMasterStore().admins;
}
