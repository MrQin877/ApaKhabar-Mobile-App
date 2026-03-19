// Utility functions for news

interface CatColors {
  background: string;
  text: string;
}

type CatColorMap = Record<string, CatColors>;

const CAT_COLORS_LIGHT: CatColorMap = {
  Lingkungan: { background: "#E8F9EF", text: "#1A6B3C" },
  Pengumuman: { background: "#FFF0E8", text: "#7A3A10" },
  Aktiviti: { background: "#E8F0FF", text: "#1A3A8F" },
  Kesihatan: { background: "#FFF0F0", text: "#8F1A1A" },
  "Aktiviti Komuniti": { background: "#E8F9EF", text: "#1A6B3C" },
};

const CAT_COLORS_DARK: CatColorMap = {
  Lingkungan: { background: "#0D3D22", text: "#6FE0A0" },
  Pengumuman: { background: "#3D2210", text: "#FFAA70" },
  Aktiviti: { background: "#0D1F4D", text: "#7AAEFF" },
  Kesihatan: { background: "#3D0D0D", text: "#FF8080" },
  "Aktiviti Komuniti": { background: "#0D3D22", text: "#6FE0A0" },
};

const FALLBACK_LIGHT: CatColors = { background: "#F0F4F3", text: "#3A4F48" };
const FALLBACK_DARK: CatColors = { background: "#1A2420", text: "#8AADA6" };

export function getCatColors(
  cat: string,
  colorScheme: "light" | "dark" | null | undefined,
): CatColors {
  if (colorScheme === "dark") {
    return CAT_COLORS_DARK[cat] ?? FALLBACK_DARK;
  }
  return CAT_COLORS_LIGHT[cat] ?? FALLBACK_LIGHT;
}
