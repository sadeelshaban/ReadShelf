export const LEGAL_ENTITY = "ReadShelf";
export const COPYRIGHT_YEAR = 2026;
export const COPYRIGHT_NOTICE = `© ${COPYRIGHT_YEAR} ${LEGAL_ENTITY}. All rights reserved.`;
export const LEGAL_ACCEPTANCE_KEY = "readshelf-legal-accepted-v1";

export const legalLinks = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/copyright", label: "Copyright" },
] as const;
