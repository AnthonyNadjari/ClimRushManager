export const MACHINE_MODELS = [
  "12 000 BTU Monobloc",
  "9 000 BTU Monobloc",
  "18 000 BTU Monobloc",
  "12 000 BTU Split",
  "9 000 BTU Split",
  "24 000 BTU Split",
] as const;

export type MachineModelName = (typeof MACHINE_MODELS)[number];

export const DEFAULT_MACHINE_MODEL = MACHINE_MODELS[0];
