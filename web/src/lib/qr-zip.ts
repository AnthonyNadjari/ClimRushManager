import JSZip from "jszip";
import QRCode from "qrcode";
import type { Machine } from "./types";
import { machineQrPayload } from "./qr-payload";

const QR_OPTIONS = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: { dark: "#18181b", light: "#ffffff" },
};

/** PNG par machine dans un ZIP (dossier climrush-qr/). */
export async function downloadQrZipForMachines(
  machines: Machine[],
  zipBaseName: string,
): Promise<void> {
  if (machines.length === 0) return;

  const zip = new JSZip();
  const root = zip.folder("climrush-qr");
  if (!root) throw new Error("ZIP");

  for (const m of machines) {
    const payload = machineQrPayload(m.id);
    const dataUrl = await QRCode.toDataURL(payload, QR_OPTIONS);
    const base64 = dataUrl.split(",")[1];
    if (!base64) continue;
    root.file(
      `lot-${sanitizeFilename(m.lot)}/machine-${m.id}.png`,
      base64,
      { base64: true },
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(zipBaseName)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(s: string): string {
  return s
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 48);
}
