"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Icon } from "@/components/icon/icon";
import { db } from "@/lib/firebase";
import { downloadQrPng } from "@/lib/qr_export";
import styles from "./bus_qr_panel.module.css";

/** Íconos de la versión compacta: 20% más chicos que el tamaño medium (24px). */
const COMPACT_ICON_SIZE = 19;

interface BusQrPanelProps {
  busDocId: string;
  busId: string;
  qrGenerated: boolean;
  unidad: string;
  empresaName: string;
  /** Versión compacta (panel maestro): QR del alto de la cápsula + botones de símbolo. */
  compact?: boolean;
}

export function BusQrPanel({
  busDocId,
  busId,
  qrGenerated,
  unidad,
  empresaName,
  compact = false,
}: BusQrPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (qrGenerated) {
      QRCode.toDataURL(busId, { width: 256, margin: 1 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    } else {
      setQrDataUrl(null);
    }

    return () => {
      cancelled = true;
    };
  }, [qrGenerated, busId]);

  async function handleGenerate() {
    if (!db) return;
    setGenerating(true);
    try {
      await updateDoc(doc(db, "buses", busDocId), { qr_generated: true });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (!db) return;
    const confirmed = window.confirm(
      "¿Eliminar esta unidad? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "buses", busDocId));
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadQrPng({
        content: busId,
        topText: empresaName,
        bottomText: unidad,
        fileName: `qr_unidad_${unidad}.png`,
      });
    } finally {
      setDownloading(false);
    }
  }

  if (compact) {
    return (
      <div className={styles.compact}>
        {qrGenerated ? (
          qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR de ${busId}`} className={styles.compactQr} />
          ) : (
            <div className={styles.compactQr} />
          )
        ) : (
          <button
            type="button"
            className={`${styles.compactQr} ${styles.compactQrPlaceholder}`}
            onClick={handleGenerate}
            disabled={generating}
            title="Generar QR"
            aria-label="Generar QR"
          >
            <Icon name="qr_code_2" size={COMPACT_ICON_SIZE} />
          </button>
        )}

        {qrGenerated && (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.iconDownload}`}
            onClick={handleDownload}
            disabled={downloading}
            title="Descargar QR"
            aria-label="Descargar QR"
          >
            <Icon name="download" size={COMPACT_ICON_SIZE} />
          </button>
        )}

        <button
          type="button"
          className={`${styles.iconButton} ${styles.iconDelete}`}
          onClick={handleDelete}
          disabled={deleting}
          title="Eliminar unidad"
          aria-label="Eliminar unidad"
        >
          <Icon name="delete" size={COMPACT_ICON_SIZE} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.side}>
      <button
        type="button"
        className={`${styles.actionButton} ${styles.deleteButton}`}
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Eliminando..." : "Eliminar unidad"}
      </button>

      {qrGenerated ? (
        qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR de ${busId}`} className={styles.qrImage} />
        ) : (
          <div className={styles.qrImage} />
        )
      ) : (
        <button
          type="button"
          className={styles.qrPlaceholder}
          onClick={handleGenerate}
          disabled={generating}
        >
          <Icon name="qr_code_2" />
          <span>{generating ? "Generando..." : "Generar QR"}</span>
        </button>
      )}

      {qrGenerated && (
        <button
          type="button"
          className={`${styles.actionButton} ${styles.downloadButton}`}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? "Descargando..." : "Descargar QR"}
        </button>
      )}
    </div>
  );
}
