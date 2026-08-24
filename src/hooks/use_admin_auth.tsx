"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

export type AdminStatus = "pending" | "approved" | "revoked" | "none";

interface SignUpInput {
  nombre: string;
  correo: string;
  password: string;
  empresa: string;
}

interface AdminAuthContextValue {
  user: User | null;
  nombre: string | null;
  empresa: string | null;
  status: AdminStatus;
  loading: boolean;
  signIn: (correo: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AdminStatus>("none");
  const [nombre, setNombre] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setStatus("none");
        setNombre(null);
        setEmpresa(null);
        setLoading(false);
        return;
      }

      const snapshot = await getDoc(doc(db, "admins", firebaseUser.uid));
      const data = snapshot.data();
      setStatus((data?.status as AdminStatus) ?? "none");
      setNombre((data?.nombre as string) ?? null);
      setEmpresa((data?.empresa as string) ?? null);
      setLoading(false);
    });
  }, []);

  async function signIn(correo: string, password: string) {
    if (!auth) throw new Error("Firebase no está configurado.");
    await signInWithEmailAndPassword(auth, correo, password);
  }

  async function signUp({ nombre, correo, password, empresa }: SignUpInput) {
    if (!auth || !db) throw new Error("Firebase no está configurado.");
    const credential = await createUserWithEmailAndPassword(auth, correo, password);
    await setDoc(doc(db, "admins", credential.user.uid), {
      nombre,
      correo,
      empresa,
      status: "pending",
      created_at: serverTimestamp(),
    });
  }

  async function signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
  }

  return (
    <AdminAuthContext.Provider
      value={{ user, nombre, empresa, status, loading, signIn, signUp, signOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
