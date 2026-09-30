"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Icon } from "@/components/icon/icon";
import { ImiType } from "@/data/imi_types";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { db } from "@/lib/firebase";
import { deleteAndReleaseFolio } from "@/lib/folio";
import styles from "@/components/bus_qr_panel/bus_qr_panel.module.css";

const QR_BASE_URL = `https://ruteamx.app/qr/${ImiType.Bike.toLowerCase()}/`;

interface BikeQrPanelProps {
  bikeId: string;
  qrGenerated: boolean;
  number: string;
  empresa: string;
  empresaName: string;
}

export function BikeQrPanel({ bikeId, qrGenerated, number, empresa, empresaName }: BikeQrPanelProps) {
  const { mobilityType } = useAdminAuth();
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
        qrGenerated: true,
        updatedAt: serverTimestamp(),
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
      const QR_SIZE = 1500; // tamaño del QR en px (sobre el marco de 2150 px de ancho)
      const QR_TOP = 325; // distancia desde el borde superior

      // Cargar el marco
      const frame = new Image();
      frame.src = "/qr_frame.png";
      await frame.decode();

      const canvas = document.createElement("canvas");
      canvas.width = frame.naturalWidth;
      canvas.height = frame.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(frame, 0, 0);

      // QR centrado horizontalmente
      const qrUrl = await QRCode.toDataURL(qrContent, { width: QR_SIZE, margin: 1 });
      const qrImg = new Image();
      qrImg.src = qrUrl;
      await qrImg.decode();
      const x = Math.round((canvas.width - QR_SIZE) / 2);
      ctx.drawImage(qrImg, x, QR_TOP, QR_SIZE, QR_SIZE);

      // Textos debajo del QR, ajustados al ancho del QR
      const centerX = canvas.width / 2;
      const qrBottom = QR_TOP + QR_SIZE;
      const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', sans-serif";
      const MAX_FONT = 300;

      const fitFontSize = (text: string): number => {
        ctx.font = `800 100px ${FONT_FAMILY}`;
        const widthAt100 = ctx.measureText(text).width;
        return Math.min((QR_SIZE / widthAt100) * 100, MAX_FONT);
      };

      ctx.fillStyle = "#353535";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const numberText = `Bici ${number}`;
      const numberSize = fitFontSize(numberText);
      ctx.font = `800 ${numberSize}px ${FONT_FAMILY}`;
      ctx.fillText(numberText, centerX, qrBottom + 100);

      const empresaText = empresaName.toUpperCase();
      const empresaSize = fitFontSize(empresaText);
      ctx.font = `800 ${empresaSize}px ${FONT_FAMILY}`;
      ctx.fillText(empresaText, centerX, qrBottom + 100 + numberSize + 60);

      // Descargar
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `qr_bici_${number}.png`;
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
