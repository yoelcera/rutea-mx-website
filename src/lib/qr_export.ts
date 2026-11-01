import QRCode from "qrcode";

const TEMPLATE_SRC = "/qr_template.png";

// Medidas tomadas de qr_template.png (5512 x 5512 px)
const EDGE_MARGIN = 220; // distancia del texto "RUTEA MX" al borde
const CAP_HEIGHT = 390; // alto de las letras de "RUTEA MX"
const QR_SIZE = 3600; // QR centrado entre los textos laterales

const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const FONT_WEIGHT = 900;

interface QrExportOptions {
  content: string; // contenido del QR
  topText: string; // empresa
  bottomText: string; // número
  fileName: string;
}

/**
 * Genera y descarga el PNG del QR sobre qr_template.png.
 * Lo usan tanto el panel de empresa como la cuenta maestra.
 */
export async function downloadQrPng({
  content,
  topText,
  bottomText,
  fileName,
}: QrExportOptions) {
  // Cargar la plantilla
  const template = new Image();
  template.src = TEMPLATE_SRC;
  await template.decode();

  const canvas = document.createElement("canvas");
  canvas.width = template.naturalWidth;
  canvas.height = template.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(template, 0, 0);

  // QR centrado
  const qrUrl = await QRCode.toDataURL(content, { width: QR_SIZE, margin: 1 });
  const qrImg = new Image();
  qrImg.src = qrUrl;
  await qrImg.decode();
  const qrX = Math.round((canvas.width - QR_SIZE) / 2);
  const qrY = Math.round((canvas.height - QR_SIZE) / 2);
  ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

  // Tamaño de fuente para que las mayúsculas midan lo mismo que "RUTEA MX",
  // sin pasarse del ancho del QR
  const fontSizeFor = (text: string): number => {
    ctx.font = `${FONT_WEIGHT} 100px ${FONT_FAMILY}`;
    const capAt100 = ctx.measureText("H").actualBoundingBoxAscent;
    const widthAt100 = ctx.measureText(text).width;
    const byHeight = (CAP_HEIGHT / capAt100) * 100;
    const byWidth = (QR_SIZE / widthAt100) * 100;
    return Math.min(byHeight, byWidth);
  };

  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const centerX = canvas.width / 2;

  // Arriba: empresa (la línea base queda a EDGE_MARGIN + CAP_HEIGHT del borde)
  const top = topText.toUpperCase();
  ctx.font = `${FONT_WEIGHT} ${fontSizeFor(top)}px ${FONT_FAMILY}`;
  ctx.fillText(top, centerX, EDGE_MARGIN + CAP_HEIGHT);

  // Abajo: número (la línea base queda a EDGE_MARGIN del borde inferior)
  ctx.font = `${FONT_WEIGHT} ${fontSizeFor(bottomText)}px ${FONT_FAMILY}`;
  ctx.fillText(bottomText, centerX, canvas.height - EDGE_MARGIN);

  // Descargar
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
}
