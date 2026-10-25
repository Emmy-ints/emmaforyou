/** One accent per solution area, so each area reads as its own world inside the brand. */
export const SOLUTION_HUES: Record<string, string> = {
  websites: "#3dd6f5", "business-apps": "#4f7bff", "ai-solutions": "#8b7bff", automation: "#3ddc97", "mobile-desktop": "#ff6bb5", industries: "#ff8a4c",
};
export const hueForCategory = (slug: string) => SOLUTION_HUES[slug] ?? "#8b7bff";
