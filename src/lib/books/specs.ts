/**
 * Platform facts used by the publishing tools, with where and when each was checked.
 * Platforms change these; every screen that uses them says so and links the source.
 */
export const CHECKED = "28 Oct 2026";

export const SOURCES = {
  ebookCover: "https://kdp.amazon.com/en_US/help/topic/G6GTK3T3NUHKLEFX",
  paperbackCover: "https://kdp.amazon.com/en_US/help/topic/G201953020",
  margins: "https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6",
  printCost: "https://kdp.amazon.com/en_US/help/topic/G201834340",
  ebookRoyalty: "https://kdp.amazon.com/en_US/help/topic/G200634500",
  paperbackRoyalty: "https://kdp.amazon.com/en_US/help/topic/G201834340",
  keywords: "https://kdp.amazon.com/en_US/help/topic/G201298500",
  description: "https://kdp.amazon.com/en_US/help/topic/G201189630",
} as const;

/** Kindle eBook cover (KDP). */
export const EBOOK_COVER = {
  idealW: 1600, idealH: 2560, // 1.6:1 height:width
  minW: 625, minH: 1000,
  minRatio: 1.6,
  maxMb: 50,
  formats: "JPEG or TIFF (JPEG preferred), RGB",
};

/** Paperback cover (KDP). Inches. */
export const PRINT_COVER = {
  bleed: 0.125,
  textSafe: 0.125, // text at least this far inside the trim on front and back
  spineSafe: 0.0625, // either side of the spine text
  spineTextMinPages: 79,
  dpi: 300,
  paper: { white: 0.002252, cream: 0.0025, "premium-color": 0.002347, "standard-color": 0.002252 } as Record<string, number>,
  minPages: 24,
  color: "KDP asks for CMYK images at 300 DPI in a single PDF. Browser canvases are RGB, so the wrap made here is a layout proof: convert to CMYK in a design tool (or ask us) before uploading.",
};

export const METADATA = {
  descriptionMax: 4000, // characters, HTML tags included
  keywordBoxes: 7,
  descriptionNotAllowed: [
    "phone numbers, email or postal addresses, or website links",
    "reviews, quotes or testimonials",
    "requests for reviews",
    "advertising or promotional material",
    "time-sensitive information (dates of tours or promotions)",
    "price, availability or other ordering information",
    "spoilers",
    "emoji",
    "lists of keywords or tags",
  ],
  keywordAvoid: [
    "words already in your title, subtitle, author name or categories",
    "claims about quality (“best”, “bestselling”, “#1”)",
    "time-sensitive words (“new”, “on sale”)",
    "other authors' names, brands you don't own or Amazon programme names (“Kindle Unlimited”, “KDP Select”)",
    "quotation marks, HTML, spelling variants or plural/capitalisation duplicates",
  ],
};

export const TRIMS: Record<string, { label: string; w: number; h: number }> = {
  "5x8": { label: "5 × 8 in", w: 5, h: 8 },
  "5.25x8": { label: "5.25 × 8 in", w: 5.25, h: 8 },
  "5.5x8.5": { label: "5.5 × 8.5 in", w: 5.5, h: 8.5 },
  "6x9": { label: "6 × 9 in", w: 6, h: 9 },
  a5: { label: "A5 (5.83 × 8.27 in)", w: 5.83, h: 8.27 },
  "8.5x11": { label: "8.5 × 11 in", w: 8.5, h: 11 },
};

export interface WrapSpec { trimW: number; trimH: number; pages: number; paper: string }
export interface WrapDims {
  spine: number; width: number; height: number; // inches incl. bleed
  px: { w: number; h: number; spine: number; bleed: number; trimW: number; trimH: number };
  spineText: boolean;
}
export function wrapDims(s: WrapSpec, dpi = PRINT_COVER.dpi): WrapDims {
  const per = PRINT_COVER.paper[s.paper] ?? PRINT_COVER.paper.white;
  const spine = s.pages * per;
  const b = PRINT_COVER.bleed;
  const width = b + s.trimW + spine + s.trimW + b;
  const height = b + s.trimH + b;
  const r = (n: number) => Math.round(n * dpi);
  return { spine, width, height, px: { w: r(width), h: r(height), spine: r(spine), bleed: r(b), trimW: r(s.trimW), trimH: r(s.trimH) }, spineText: s.pages >= PRINT_COVER.spineTextMinPages };
}
