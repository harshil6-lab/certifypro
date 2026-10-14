import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";

describe("useCaptchaToken without a site key", () => {
  it("is not configured and Widget renders nothing", async () => {
    vi.stubEnv("VITE_CAPTCHA_SITE_KEY", "");
    vi.resetModules();
    const { useCaptchaToken } = await import("@/hooks/useCaptchaToken");

    const { result } = renderHook(() => useCaptchaToken());
    expect(result.current.isConfigured).toBe(false);
    expect(result.current.token).toBeNull();

    const { container } = render(<result.current.Widget />);
    expect(container.innerHTML).toBe("");

    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe("useCaptchaToken with a site key", () => {
  it("stores the verified token and reset() clears it and resets the widget", async () => {
    vi.stubEnv("VITE_CAPTCHA_SITE_KEY", "1x00000000000000000000AA");
    vi.resetModules();

    let capturedCallback: ((token: string) => void) | null = null;
    const resetSpy = vi.fn();
    window.turnstile = {
      render: (_el, opts) => {
        capturedCallback = opts.callback ?? null;
        return "widget-id-1";
      },
      reset: resetSpy,
      remove: vi.fn(),
    };

    const { useCaptchaToken } = await import("@/hooks/useCaptchaToken");
    const { result } = renderHook(() => useCaptchaToken());
    expect(result.current.isConfigured).toBe(true);

    render(<result.current.Widget />);
    await act(async () => {});
    expect(capturedCallback).not.toBeNull();

    act(() => {
      capturedCallback?.("tok-123");
    });
    expect(result.current.token).toBe("tok-123");

    act(() => {
      result.current.reset();
    });
    expect(result.current.token).toBeNull();
    expect(resetSpy).toHaveBeenCalled();

    vi.unstubAllEnvs();
    vi.resetModules();
    delete window.turnstile;
  });

  it("clears the token on expiry", async () => {
    vi.stubEnv("VITE_CAPTCHA_SITE_KEY", "1x00000000000000000000AA");
    vi.resetModules();

    let captured: { verify: ((t: string) => void) | null; expire: (() => void) | null } = {
      verify: null,
      expire: null,
    };
    window.turnstile = {
      render: (_el, opts) => {
        captured = { verify: opts.callback ?? null, expire: opts["expired-callback"] ?? null };
        return "widget-id-2";
      },
      reset: vi.fn(),
      remove: vi.fn(),
    };

    const { useCaptchaToken } = await import("@/hooks/useCaptchaToken");
    const { result } = renderHook(() => useCaptchaToken());
    render(<result.current.Widget />);
    await act(async () => {});

    act(() => {
      captured.verify?.("tok-abc");
    });
    expect(result.current.token).toBe("tok-abc");

    act(() => {
      captured.expire?.();
    });
    expect(result.current.token).toBeNull();

    vi.unstubAllEnvs();
    vi.resetModules();
    delete window.turnstile;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
