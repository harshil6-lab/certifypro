import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface CaptchaWidgetHandle {
  reset: () => void;
}

interface CaptchaWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
}

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible" | "invisible";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  "timeout-callback"?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window !== "undefined" && window.turnstile) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Turnstile script failed to load")));
    document.head.appendChild(script);
  });

  scriptLoadPromise.catch(() => {
    scriptLoadPromise = null;
  });

  return scriptLoadPromise;
}

/**
 * Cloudflare Turnstile widget using the explicit-render API.
 * No extra dependency: the script is lazy-loaded on first mount only.
 */
export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  function CaptchaWidget({ siteKey, onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);

    const callbacksRef = useRef({ onVerify, onExpire, onError });
    callbacksRef.current = { onVerify, onExpire, onError };

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          try {
            window.turnstile?.reset(widgetIdRef.current ?? undefined);
          } catch {
            // Widget may already be removed; the token state is cleared by the caller.
          }
        },
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;

      void loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) {
            return;
          }

          try {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              theme: "auto",
              size: "flexible",
              callback: (token: string) => callbacksRef.current.onVerify(token),
              "expired-callback": () => {
                try {
                  window.turnstile?.reset(widgetIdRef.current ?? undefined);
                } catch {
                  // Ignore reset errors during expiry handling.
                }
                callbacksRef.current.onExpire();
              },
              "error-callback": () => callbacksRef.current.onError(),
              "timeout-callback": () => callbacksRef.current.onError(),
            });
          } catch {
            if (!cancelled) {
              setLoadFailed(true);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadFailed(true);
          }
        });

      return () => {
        cancelled = true;
        try {
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          }
        } catch {
          // Ignore cleanup errors on unmount.
        }
        widgetIdRef.current = null;
      };
    }, [siteKey]);

    if (loadFailed) {
      return (
        <p className="text-xs text-muted-foreground" role="alert">
          Security check could not load. Check your connection and reload the page.
        </p>
      );
    }

    return <div ref={containerRef} className="flex justify-center" aria-label="Security check" />;
  },
);
