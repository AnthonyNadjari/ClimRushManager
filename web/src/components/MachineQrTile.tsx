"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { machineQrPayload } from "@/lib/qr-payload";

type Props = {
  id: string;
  model: string;
  lot?: string;
};

/** Génération haute résolution, affichage contenu dans une boîte fixe (évite les chevauchements en grille). */
const RENDER_SIZE = 240;
const DISPLAY_CLASS =
  "aspect-square w-full max-w-[148px] sm:max-w-[160px] lg:max-w-[168px]";

export function MachineQrTile({ id, model, lot }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const payload = machineQrPayload(id);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: RENDER_SIZE,
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
  }, [payload]);

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `climrush-machine-${id}.png`;
    a.click();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col items-center rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 print:break-inside-avoid print:border-zinc-300 print:shadow-none">
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-zinc-100 print:ring-0 ${DISPLAY_CLASS}`}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL générée par qrcode
          <img
            src={dataUrl}
            alt={`QR machine ${id}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div
            className={`flex items-center justify-center bg-zinc-50 text-center text-xs text-zinc-500 ${DISPLAY_CLASS}`}
          >
            {err ?? "…"}
          </div>
        )}
      </div>

      <p className="mt-3 w-full truncate text-center font-mono text-base font-bold text-zinc-900">
        #{id}
      </p>
      <p className="mt-0.5 line-clamp-2 w-full max-w-[200px] text-center text-xs leading-snug text-zinc-600">
        {model}
      </p>
      {lot ? (
        <p className="mt-1 line-clamp-2 max-w-[200px] text-center text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {lot}
        </p>
      ) : null}
      <p className="mt-1 hidden w-full max-w-[200px] truncate text-center font-mono text-[10px] text-zinc-400 print:block">
        {payload}
      </p>
      <button
        type="button"
        onClick={downloadPng}
        disabled={!dataUrl}
        className="mt-3 w-full min-w-0 max-w-[200px] rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white print:hidden disabled:opacity-40"
      >
        Télécharger PNG
      </button>
    </div>
  );
}
