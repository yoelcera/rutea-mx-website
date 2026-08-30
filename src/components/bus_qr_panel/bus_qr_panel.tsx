"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Icon } from "@/components/icon/icon";
import { db } from "@/lib/firebase";
import styles from "./bus_qr_panel.module.css";

interface BusQrPanelProps {
  busDocId: string;
  busId: string;
  qrGenerated: boolean;
}

export function BusQrPanel({ busDocId, busId, qrGenerated }: BusQrPanelProps) {
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
      const highResUrl = await QRCode.toDataURL(busId, { width: 1500, margin: 1 });
      const link = document.createElement("a");
      link.href = highResUrl;
      link.download = `qr-${busId}.png`;
      link.click();
    } finally {
      setDownloading(false);
    }
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
