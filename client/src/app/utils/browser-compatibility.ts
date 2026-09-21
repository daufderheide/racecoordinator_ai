export interface BrowserUnsupportedTranslations {
  title: string;
  desc: string;
  reqs: string;
}

export const BROWSER_UNSUPPORTED_TRANSLATIONS: Record<
  string,
  BrowserUnsupportedTranslations
> = {
  en: {
    title: "Browser Not Supported",
    desc: "Race Coordinator AI requires a modern web browser to run. Your browser or operating system version is out of date and cannot load this application.",
    reqs: "Supported: Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari on Android 9+, iOS 14+, Windows 10+, macOS, or Linux.",
  },
  de: {
    title: "Browser nicht unterstützt",
    desc: "Race Coordinator AI erfordert einen modernen Webbrowser. Ihr Browser oder Betriebssystem ist veraltet und kann diese Anwendung nicht laden.",
    reqs: "Unterstützt: Google Chrome, Microsoft Edge, Mozilla Firefox oder Safari unter Android 9+, iOS 14+, Windows 10+, macOS oder Linux.",
  },
  es: {
    title: "Navegador no compatible",
    desc: "Race Coordinator AI requiere un navegador web moderno para funcionar. La versión de su navegador o sistema operativo está desactualizada y no puede cargar esta aplicación.",
    reqs: "Compatible con: Google Chrome, Microsoft Edge, Mozilla Firefox o Safari en Android 9+, iOS 14+, Windows 10+, macOS o Linux.",
  },
  fr: {
    title: "Navigateur non pris en charge",
    desc: "Race Coordinator AI nécessite un navigateur Web moderne pour fonctionner. La version de votre navigateur ou de votre système d'exploitation est obsolète et ne peut pas charger cette application.",
    reqs: "Pris en charge : Google Chrome, Microsoft Edge, Mozilla Firefox ou Safari sous Android 9+, iOS 14+, Windows 10+, macOS ou Linux.",
  },
  it: {
    title: "Browser non supportato",
    desc: "Race Coordinator AI richiede un browser Web moderno per funzionare. La versione del browser o del sistema operativo è obsoleta e non può caricare questa applicazione.",
    reqs: "Supportati: Google Chrome, Microsoft Edge, Mozilla Firefox o Safari su Android 9+, iOS 14+, Windows 10+, macOS o Linux.",
  },
  nl: {
    title: "Browser niet ondersteund",
    desc: "Race Coordinator AI vereist een moderne webbrowser. De versie van uw browser of besturingssysteem is verouderd en kan deze toepassing niet laden.",
    reqs: "Ondersteund: Google Chrome, Microsoft Edge, Mozilla Firefox of Safari op Android 9+, iOS 14+, Windows 10+, macOS of Linux.",
  },
  pt: {
    title: "Navegador não suportado",
    desc: "O Race Coordinator AI requer um navegador web moderno para funcionar. A versão do seu navegador ou sistema operacional está desatualizada e não pode carregar este aplicativo.",
    reqs: "Suportados: Google Chrome, Microsoft Edge, Mozilla Firefox ou Safari no Android 9+, iOS 14+, Windows 10+, macOS ou Linux.",
  },
};

export function getBrowserUnsupportedTranslations(
  lang?: string,
): BrowserUnsupportedTranslations {
  const normalized = (lang || "en").substring(0, 2).toLowerCase();
  return (
    BROWSER_UNSUPPORTED_TRANSLATIONS[normalized] ||
    BROWSER_UNSUPPORTED_TRANSLATIONS["en"]
  );
}

export function isBrowserSupported(win?: any): boolean {
  const targetWin =
    arguments.length > 0
      ? win
      : typeof window !== "undefined"
        ? window
        : undefined;
  if (!targetWin) {
    return false;
  }
  try {
    if (
      typeof Promise === "undefined" ||
      typeof Symbol === "undefined" ||
      typeof Map === "undefined" ||
      typeof Set === "undefined" ||
      typeof BigInt === "undefined" ||
      typeof queueMicrotask === "undefined" ||
      typeof globalThis === "undefined" ||
      !targetWin.CSS ||
      !targetWin.CSS.supports ||
      !targetWin.CSS.supports("color", "var(--rc-test)")
    ) {
      return false;
    }
    new Function(
      "var a = window?.location?.href; var b = null ?? 1; class C { #x = 1; }",
    );
    return true;
  } catch (_e) {
    return false;
  }
}

export function renderUnsupportedBrowserBanner(
  doc?: Document,
  lang?: string,
): HTMLElement | null {
  const targetDoc =
    arguments.length > 0
      ? doc
      : typeof document !== "undefined"
        ? document
        : undefined;
  if (!targetDoc) {
    return null;
  }
  const existing = targetDoc.getElementById("rc-unsupported-browser-overlay");
  if (existing) {
    return existing;
  }

  const effectiveLang =
    lang || targetDoc.defaultView?.navigator?.language || "en";
  const t = getBrowserUnsupportedTranslations(effectiveLang);

  const overlay = targetDoc.createElement("div");
  overlay.id = "rc-unsupported-browser-overlay";
  overlay.setAttribute("role", "alert");
  overlay.setAttribute("aria-live", "assertive");
  overlay.innerHTML =
    '<div class="rc-unsupported-card">' +
    '<div class="rc-unsupported-icon">&#9888;&#65039;</div>' +
    '<h1 class="rc-unsupported-title">' +
    t.title +
    "</h1>" +
    '<p class="rc-unsupported-desc">' +
    t.desc +
    "</p>" +
    '<div class="rc-unsupported-reqs">' +
    t.reqs +
    "</div>" +
    "</div>";

  if (targetDoc.body) {
    targetDoc.body.appendChild(overlay);
  }
  return overlay;
}
