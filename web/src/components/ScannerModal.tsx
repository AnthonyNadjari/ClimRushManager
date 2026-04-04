"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
  title?: string;
};

export function ScannerModal({
  open,
  onClose,
  onScan,
  title = "Scanner QR machine",
}: Props) {
  const regionId = "cr-qr-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [useCamera, setUseCamera] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      void (async () => {
        const s = scannerRef.current;
        scannerRef.current = null;
        if (!s) return;
        try {
          await s.stop();
        } catch {
          /* ignore */
        }
        try {
          s.clear();
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    if (!useCamera) return;

    let cancelled = false;

    const start = async () => {
      setError(null);
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled || !document.getElementById(regionId)) return;
      try {
        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            onScanRef.current(decoded);
            onCloseRef.current();
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setError("Caméra indisponible — saisissez l’ID ci-dessous.");
          setUseCamera(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      void (async () => {
        const s = scannerRef.current;
        scannerRef.current = null;
        if (!s) return;
        try {
          await s.stop();
        } catch {
          /* ignore */
        }
        try {
          s.clear();
        } catch {
          /* ignore */
        }
      })();
    };
  }, [open, useCamera]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="scanner-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h2 id="scanner-title" className="font-serif text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Fermer
          </button>
        </div>
        <div className="p-4">
          {useCamera ? (
            <div
              key={open ? "cam-on" : "cam-off"}
              id={regionId}
              className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-zinc-900"
            />
          ) : null}
          {error ? (
            <p className="mt-2 text-center text-sm text-amber-700">{error}</p>
          ) : null}
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-zinc-500">
              ID manuel (ex. 12 ou #12)
            </label>
            <div className="flex gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                className="min-h-12 flex-1 rounded-xl border border-zinc-200 px-3 text-base outline-none focus:border-[var(--cr-blue)]"
                placeholder="#12"
                inputMode="numeric"
              />
              <button
                type="button"
                className="min-h-12 rounded-xl bg-[var(--cr-blue)] px-4 text-sm font-semibold text-white"
                onClick={() => {
                  const t = manual.replace(/^#/, "").trim();
                  if (t) {
                    onScan(t);
                    onClose();
                  }
                }}
              >
                OK
              </button>
            </div>
            {useCamera ? (
              <button
                type="button"
                className="text-sm text-[var(--cr-blue)] underline"
                onClick={() => setUseCamera(false)}
              >
                Saisie manuelle seule
              </button>
            ) : (
              <button
                type="button"
                className="text-sm text-[var(--cr-blue)] underline"
                onClick={() => {
                  setError(null);
                  setUseCamera(true);
                }}
              >
                Réessayer la caméra
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
