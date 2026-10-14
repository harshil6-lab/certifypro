import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaptchaWidget, type CaptchaWidgetHandle } from "@/components/CaptchaWidget";

export const CAPTCHA_SITE_KEY = (import.meta.env.VITE_CAPTCHA_SITE_KEY ?? "").trim();

export const isCaptchaConfigured = CAPTCHA_SITE_KEY.length > 0;

export interface CaptchaController {
  siteKey: string;
  isConfigured: boolean;
  /** Latest verified token, or null when absent/expired. Single-use: reset after every submit. */
  token: string | null;
  /** Clears the token and resets the widget challenge. Never logs the token. */
  reset: () => void;
  /** Renders nothing when the site key is not configured. */
  Widget: () => JSX.Element | null;
}

/**
 * Owns the Turnstile token lifecycle for one form.
 * When VITE_CAPTCHA_SITE_KEY is missing the widget is skipped and the form
 * stays usable, so the frontend remains deployable before Supabase enforcement.
 */
export function useCaptchaToken(): CaptchaController {
  const [token, setToken] = useState<string | null>(null);
  const widgetHandle = useRef<CaptchaWidgetHandle | null>(null);

  useEffect(() => {
    if (!isCaptchaConfigured && import.meta.env.DEV) {
      console.warn(
        "[captcha] VITE_CAPTCHA_SITE_KEY is not set; the security check is skipped. " +
          "Set it before Supabase CAPTCHA enforcement is enabled.",
      );
    }
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    widgetHandle.current?.reset();
  }, []);

  const Widget = useMemo(() => {
    if (!isCaptchaConfigured) {
      return () => null;
    }

    return function BoundCaptchaWidget() {
      return (
        <CaptchaWidget
          ref={widgetHandle}
          siteKey={CAPTCHA_SITE_KEY}
          onVerify={setToken}
          onExpire={() => setToken(null)}
          onError={() => setToken(null)}
        />
      );
    };
  }, []);

  return { siteKey: CAPTCHA_SITE_KEY, isConfigured: isCaptchaConfigured, token, reset, Widget };
}
