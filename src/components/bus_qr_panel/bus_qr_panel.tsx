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
  unidad: string;
  empresaName: string;
}

export function BusQrPanel({ busDocId, busId, qrGenerated, unidad, empresaName }: BusQrPanelProps) {
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
      const QR_SIZE = 1500; // tamaño del QR en px (sobre el marco de 2150 px de ancho)
      const QR_TOP = 325; // distancia desde el borde superior

      // Cargar el marco
      const frame = new Image();
      frame.src = "/qr_frame.png";
      await frame.decode();

      // Canvas del mismo tamaño que el marco
      const canvas = document.createElement("canvas");
      canvas.width = frame.naturalWidth;
      canvas.height = frame.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(frame, 0, 0);

      // Generar el QR y dibujarlo centrado horizontalmente
      const qrUrl = await QRCode.toDataURL(busId, { width: QR_SIZE, margin: 1 });
      const qrImg = new Image();
      qrImg.src = qrUrl;
      await qrImg.decode();
      const x = Math.round((canvas.width - QR_SIZE) / 2);
      ctx.drawImage(qrImg, x, QR_TOP, QR_SIZE, QR_SIZE);

      // Textos debajo del QR, ajustados al ancho del QR
      const centerX = canvas.width / 2;
      const qrBottom = QR_TOP + QR_SIZE;
      const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', sans-serif";
      const MAX_FONT = 300; // tope para que textos muy cortos no queden gigantes

      // Devuelve el tamaño de fuente con el que el texto ocupa exactamente el ancho del QR
      const fitFontSize = (text: string): number => {
        ctx.font = `800 100px ${FONT_FAMILY}`;
        const widthAt100 = ctx.measureText(text).width;
        return Math.min((QR_SIZE / widthAt100) * 100, MAX_FONT);
      };

      ctx.fillStyle = "#353535";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const unidadText = `Unidad ${unidad}`;
      const unidadSize = fitFontSize(unidadText);
      ctx.font = `800 ${unidadSize}px ${FONT_FAMILY}`;
      ctx.fillText(unidadText, centerX, qrBottom + 100);

      const empresaText = empresaName.toUpperCase();
      const empresaSize = fitFontSize(empresaText);
      ctx.font = `800 ${empresaSize}px ${FONT_FAMILY}`;
      ctx.fillText(empresaText, centerX, qrBottom + 100 + unidadSize + 60);

      // Descargar
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `qr_unidad_${unidad}.png`;
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
