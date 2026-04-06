"use client";

export function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "green" | "orange" | "red" | "blue";
}) {
  const toneRing =
    tone === "green"
      ? "ring-emerald-200"
      : tone === "orange"
        ? "ring-amber-200"
        : tone === "red"
          ? "ring-red-200"
          : tone === "blue"
            ? "ring-blue-200"
            : "ring-zinc-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition-colors ${
        active
          ? "bg-zinc-900 text-white ring-zinc-900"
          : `bg-white text-zinc-700 ${toneRing} hover:bg-zinc-50`
      }`}
    >
      {label}{" "}
      <span className="opacity-80">({count})</span>
    </button>
  );
}
