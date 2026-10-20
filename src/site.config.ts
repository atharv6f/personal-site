// Single source of truth for identity and links. "TODO" values fail
// `npm run check -- --strict` (and CI) until they are filled in.
export const site = {
  name: "Atharv Yeolekar",
  bio: "AI Engineer, Bay Area", // no trailing period
  email: "atharv@getbrink.io",
  github: "https://github.com/atharv6f",
  x: "https://x.com/yolo6f",
  linkedin: "https://www.linkedin.com/in/atharv-yeolekar-0226a1152/",
  url: "https://atharv.getbrink.io",
  booking: "https://calendar.app.google/dYxpMm5gM2bPAuUG8", // https://… URL; empty hides the button everywhere
};

export const isTodo = (v: string | null | undefined): boolean => !v || v === "TODO";

// S4, his words. Placeholder fails `check-dist --strict` until replaced.
export const disclaimer = "Everything here is my own view.";
