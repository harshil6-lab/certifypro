type AdobeHostInfo = {
  appName: string;
  appVersion: string;
};

type AdobeExpressInitializeOptions = {
  clientId: string;
  hostInfo: AdobeHostInfo;
  // Some SDK builds also accept locale at top-level.
  locale?: string;
  // Back-compat: some builds read appName/appVersion at top-level.
  appName?: string;
  appVersion?: string;
};

type AdobeExpressGlobal = {
  initialize: (options: AdobeExpressInitializeOptions) => Promise<unknown>;
  // Some SDK builds expose editor helpers on the global.
  createDesign?: (options: Record<string, unknown>) => Promise<unknown>;
  openEditor?: (options: Record<string, unknown>) => Promise<unknown>;
};

let cached: AdobeExpressGlobal | null = null;
let initPromise: Promise<AdobeExpressGlobal> | null = null;

async function loadSdkModule(): Promise<AdobeExpressGlobal> {
  // NOTE: The npm package `@adobe/cceverywhere` is not available in this
  // environment (Vite will error while resolving it). We therefore load the
  // official hosted SDK script directly.
  const url = "https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js";
  await import(/* @vite-ignore */ url);
  // The hosted script attaches CCEverywhere on window.
  const global = (window as unknown as { CCEverywhere?: unknown }).CCEverywhere;
  if (!global || typeof global !== "object") {
    throw new Error("Adobe Express SDK did not load (window.CCEverywhere missing).");
  }
  return global as AdobeExpressGlobal;
}

export async function initAdobeSDK(): Promise<AdobeExpressGlobal> {
  if (cached) return cached;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("Adobe Client ID:", import.meta.env.VITE_ADOBE_CLIENT_ID);
    // Expose temporarily for browser debugging
    (window as unknown as { ADOBE_CLIENT_ID?: string }).ADOBE_CLIENT_ID = import.meta.env.VITE_ADOBE_CLIENT_ID;
    console.log("window.ADOBE_CLIENT_ID:", (window as unknown as { ADOBE_CLIENT_ID?: string }).ADOBE_CLIENT_ID);

    const clientId = import.meta.env.VITE_ADOBE_CLIENT_ID as string | undefined;
    if (!clientId) {
      throw new Error("Missing VITE_ADOBE_CLIENT_ID");
    }

    const sdk = await loadSdkModule();
    // Required by Adobe SDK: hostInfo.appName + hostInfo.appVersion
    const initOptions: AdobeExpressInitializeOptions = {
      clientId,
      hostInfo: {
        appName: "CertifyPro",
        appVersion: "1.0",
      },
      locale: "en_US",
      appName: "CertifyPro",
      appVersion: "1.0",
    };
    console.log("[AdobeExpress] initialize options:", initOptions);
    await sdk.initialize(initOptions);
    console.log("[AdobeExpress] SDK initialized successfully.");
    cached = sdk;
    return sdk;
  })();

  return initPromise;
}

function tryExtractImageUrlAndTitle(payload: unknown): { imageUrl: string; title: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const imageUrl =
    (typeof obj.imageUrl === "string" && obj.imageUrl) ||
    (typeof obj.previewUrl === "string" && obj.previewUrl) ||
    (typeof obj.thumbnailUrl === "string" && obj.thumbnailUrl) ||
    "";
  const title = (typeof obj.title === "string" && obj.title) || "My Adobe Certificate";
  if (!imageUrl) return null;
  return { imageUrl, title };
}

export async function openAdobeTemplateEditor(
  onComplete: (imageUrl: string, title: string) => void,
): Promise<void> {
  try {
    const sdk = await initAdobeSDK();

    // Ensure open runs only after initialization completes (await initAdobeSDK above).
    const editorOpen =
      typeof sdk.openEditor === "function"
        ? sdk.openEditor.bind(sdk)
        : typeof sdk.createDesign === "function"
          ? sdk.createDesign.bind(sdk)
          : null;

    if (!editorOpen) {
      console.error("[AdobeExpress] SDK loaded but no editor open method is available (openEditor/createDesign).");
      return;
    }

    const handle = await editorOpen({
      mode: "full",
      templateType: "certificate",
    });

    const attach =
      handle && typeof handle === "object" && typeof (handle as { on?: unknown }).on === "function"
        ? (handle as { on: (event: string, cb: (payload: unknown) => void) => void }).on
        : handle && typeof handle === "object" && typeof (handle as { addEventListener?: unknown }).addEventListener === "function"
          ? (handle as { addEventListener: (event: string, cb: (payload: unknown) => void) => void }).addEventListener
          : null;

    if (!attach) {
      console.warn("[AdobeExpress] Editor opened but no event API available to capture exports.");
      return;
    }

    const onExport = (payload: unknown) => {
      const extracted = tryExtractImageUrlAndTitle(payload);
      if (!extracted) {
        console.warn("[AdobeExpress] Export payload shape unexpected.", payload);
        return;
      }
      onComplete(extracted.imageUrl, extracted.title);
    };

    attach("export", onExport);
    attach("save", onExport);
    attach("onExport", onExport);
  } catch (err: unknown) {
    console.error("[AdobeExpress] Failed to open template editor.", err);
  }
}

