import { ContactForm } from "@/components/contact_form/contact_form";
import styles from "./contact_page.module.css";

export default function ContactPage() {
  return (
    <>
      <h1
        style={{
          margin: "0 0 24px",
          fontSize: "clamp(24px, 3vw, 37.5px)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        Estamos para ayudarte
      </h1>

      <div className={styles.grid}>
        <div
          style={{
            padding: 32,
            borderRadius: 36,
            background: "var(--color-background-secondary)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              color: "var(--color-accent-brand)",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Rutea MX
          </span>

          <p
            style={{
              marginTop: 10,
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Si tienes dudas, sugerencias, quieres reportar algún problema
            o colaborar con el proyecto, estaremos encantados de leerte.
          </p>

          <div style={{ marginTop: "20px", display: "grid", gap: 18 }}>
            <div>
              <strong>Correo</strong>
              <br />
              xera00@icloud.com
            </div>

            <div>
              <strong>Teléfono</strong>
              <br />
              +52 (646) 272-1753
            </div>

            <div>
              <strong>Dirección</strong>
              <br />
              Calle Gardenias #118, Lomas de Valle Verde
              <br />
              Ensenada, Baja California
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </>
  );
}
