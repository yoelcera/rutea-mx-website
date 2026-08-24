"use client";

import { useState, type FormEvent } from "react";
import { getEmpresaByOperatorSlug, TRANSIT_OPERATORS } from "@/data/routes";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import styles from "./auth_modal.module.css";

type Mode = "signIn" | "signUp";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAdminAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "signUp") {
      if (!empresa) {
        setError("Selecciona una empresa.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signIn") {
        await signIn(correo, password);
        onClose();
      } else {
        await signUp({ nombre, correo, password, empresa: empresa! });
        setSignedUp(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        {signedUp ? (
          <div className={styles.pendingMessage}>
            <p>Tu cuenta fue creada y está pendiente de aprobación.</p>
            <button type="button" className={styles.submitButton} onClick={onClose}>
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tabs}>
              <button
                type="button"
                className={mode === "signIn" ? styles.tabActive : styles.tab}
                onClick={() => switchMode("signIn")}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className={mode === "signUp" ? styles.tabActive : styles.tab}
                onClick={() => switchMode("signUp")}
              >
                Crear cuenta
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {mode === "signUp" && (
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  required
                />
              )}

              <input
                className={styles.input}
                type="email"
                placeholder="Correo"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />

              <input
                className={styles.input}
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {mode === "signUp" && (
                <>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />

                  <div className={styles.empresaGroup}>
                    <span className={styles.empresaLabel}>Empresa</span>
                    <div className={styles.empresaOptions}>
                      {TRANSIT_OPERATORS.map((operator) => (
                        <button
                          key={operator.slug}
                          type="button"
                          className={
                            empresa === getEmpresaByOperatorSlug(operator.slug)
                              ? styles.empresaButtonActive
                              : styles.empresaButton
                          }
                          onClick={() => setEmpresa(getEmpresaByOperatorSlug(operator.slug))}
                        >
                          {operator.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "Espera..." : mode === "signIn" ? "Entrar" : "Crear cuenta"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
