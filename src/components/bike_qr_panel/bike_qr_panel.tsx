"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Icon } from "@/components/icon/icon";
import { ImiType } from "@/data/imi_types";
import { MobilityType } from "@/data/route_types";
import { db } from "@/lib/firebase";
import { downloadQrPng } from "@/lib/qr_export";
import { deleteAndReleaseFolio } from "@/lib/folio";
import styles from "@/components/bus_qr_panel/bus_qr_panel.module.css";

const QR_BASE_URL = `https://ruteamx.app/qr/${ImiType.Bike.toLowerCase()}/`;

/** Íconos de la versión compacta: 20% más chicos que el tamaño medium (24px). */
const COMPACT_ICON_SIZE = 19;

interface BikeQrPanelProps {
  bikeId: string;
  qrGenerated: boolean;
  number: string;
  empresa: string;
  empresaName: string;
  /** Versión compacta (panel maestro): QR del alto de la cápsula + botones de símbolo. */
  compact?: boolean;
}

export function BikeQrPanel({
  bikeId,
  qrGenerated,
  number,
  empresa,
  empresaName,
  compact = false,
}: BikeQrPanelProps) {
  // Este panel es solo de bicis: siempre usa el contador de bicis (aunque lo abra la cuenta maestra)
  const mobilityType = MobilityType.Bike;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const qrContent = `${QR_BASE_URL}${bikeId}`;

  useEffect(() => {
    let cancelled = false;

    if (qrGenerated) {
      QRCode.toDataURL(qrContent, { width: 256, margin: 1 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    } else {
      setQrDataUrl(null);
    }

    return () => {
      cancelled = true;
    };
  }, [qrGenerated, qrContent]);

  async function handleGenerate() {
    if (!db) return;
    setGenerating(true);
    try {
      await updateDoc(doc(db, "bikes", bikeId), {
        qr_generated: true,
        updated_at: serverTimestamp(),
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (!db || !empresa) return;
    const confirmed = window.confirm(
      "¿Eliminar esta bici? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      // Si es el último folio, el contador regresa 1; si no, se mantiene.
      await deleteAndReleaseFolio(
        db,
        mobilityType,
        empresa,
        doc(db, "bikes", bikeId),
        parseInt(number, 10) || 0
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadQrPng({
        content: qrContent,
        topText: empresaName,
        bottomText: number,
        fileName: `qr_bici_${number}.png`,
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
            <img src={qrDataUrl} alt={`QR de la bici ${number}`} className={styles.compactQr} />
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
          title="Eliminar bici"
          aria-label="Eliminar bici"
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
        {deleting ? "Eliminando..." : "Eliminar bici"}
      </button>

      {qrGenerated ? (
        qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR de la bici ${number}`} className={styles.qrImage} />
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
