/** localStorage key — user must accept before entering the workspace. */
export const DISCLAIMER_STORAGE_KEY = "medcore_disclaimer_accepted";

export function isDisclaimerAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function acceptDisclaimer(): void {
  try {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
  } catch {
    /* private browsing — gate will reappear next visit */
  }
}

export function clearDisclaimerAcceptance(): void {
  try {
    localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
