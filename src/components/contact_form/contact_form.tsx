"use client";

import { useState } from "react";
import styles from "./contact_form.module.css";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const subject = `${reason} - ${name}`;

    const body = `Nombre: ${name}
Correo: ${email}

Mensaje:
${message}`;

    window.location.href =
      `mailto:xera00@icloud.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <input
        className={styles.input}
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        className={styles.input}
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        className={styles.input}
        placeholder="Motivo"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />

      <textarea
        className={styles.textarea}
        placeholder="Mensaje"
        rows={7}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />

      <button
        className={styles.button}
        type="submit"
      >
        Enviar
      </button>
    </form>
  );
}