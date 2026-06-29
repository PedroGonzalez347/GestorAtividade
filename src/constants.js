export const PRIORITY_COLORS = {
  alta: { bg: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5", dot: "#EF4444" },
  "média": { bg: "#FEF9C3", text: "#92400E", border: "#FCD34D", dot: "#F59E0B" },
  baixa: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", dot: "#22C55E" },
};

export const STATUS_LABELS = {
  pendente: "Pendente",
  "em andamento": "Em andamento",
  concluída: "Concluída",
};

export const normalizeDisciplineId = (value) => String(value ?? "");
