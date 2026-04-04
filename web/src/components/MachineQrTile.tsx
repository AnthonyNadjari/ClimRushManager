"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { machineQrPayload } from "@/lib/qr-payload";

type Props = {
  id: string;
  model: string;
  /** Plus grand sur écran admin ; impression utilise la taille naturelle */
  size?: number;
};

export function MachineQrTile({ id, model, size = 200 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const payload = machineQrPayload(id);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setErr(null);
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setErr("QR indisponible");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payload, size]);

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `climrush-machine-${id}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm print:break-inside-avoid print:border-zinc-300 print:shadow-none">
      <div className="rounded-xl bg-white p-2 ring-1 ring-zinc-100 print:ring-0">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL générée par qrcode
          <img
            src={dataUrl}
            alt={`QR machine ${id}`}
            width={size}
            height={size}
            className="max-h-[min(200px,80vw)] max-w-[min(200px,80vw)] object-contain print:max-h-[160px] print:max-w-[160px]"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-zinc-100 text-sm text-zinc-500"
            style={{ width: size, height: size }}
          >
            {err ?? "…"}
          </div>
        )}
      </div>
      <p className="mt-2 font-mono text-lg font-bold text-zinc-900">#{id}</p>
      <p className="max-w-[220px] text-center text-xs text-zinc-600">{model}</p>
      <p className="mt-1 hidden max-w-[220px] truncate text-center font-mono text-[10px] text-zinc-400 print:block">
        {payload}
      </p>
      <button
        type="button"
        onClick={downloadPng}
        disabled={!dataUrl}
        className="mt-3 min-h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white print:hidden disabled:opacity-40"
      >
        Télécharger PNG
      </button>
    </div>
  );
}
