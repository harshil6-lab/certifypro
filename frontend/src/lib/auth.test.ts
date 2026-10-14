import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signOut: mocks.signOut,
    },
  },
  clearStoredSupabaseSession: vi.fn(),
}));

import { sendPasswordResetEmail, signInWithEmailPassword } from "@/lib/auth";

const verifiedSession = {
  user: { email_confirmed_at: "2024-01-01T00:00:00Z", user_metadata: {} },
  access_token: "header.payload.signature",
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("signInWithEmailPassword captcha", () => {
  it("passes the token as options.captchaToken", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: verifiedSession }, error: null });

    const result = await signInWithEmailPassword("admin@x.edu", "secret123", "tok-abc");

    expect(result.success).toBe(true);
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@x.edu",
      password: "secret123",
      options: { captchaToken: "tok-abc" },
    });
  });

  it("sends undefined captchaToken when no token is provided", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { session: verifiedSession }, error: null });

    await signInWithEmailPassword("admin@x.edu", "secret123");

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@x.edu",
      password: "secret123",
      options: { captchaToken: undefined },
    });
  });

  it("maps captcha failures to a distinct friendly message", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "captcha verification failed" },
    });

    const result = await signInWithEmailPassword("admin@x.edu", "secret123", "bad-tok");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/security check/i);
  });

  it("keeps non-captcha errors unchanged", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await signInWithEmailPassword("admin@x.edu", "wrong", "tok");

    expect(result.error).toBe("Invalid login credentials");
  });
});

describe("sendPasswordResetEmail captcha", () => {
  it("passes the token and preserves redirectTo", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    const result = await sendPasswordResetEmail("admin@x.edu", "tok-xyz");

    expect(result.success).toBe(true);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledOnce();
    const [email, options] = mocks.resetPasswordForEmail.mock.calls[0];
    expect(email).toBe("admin@x.edu");
    expect(options.captchaToken).toBe("tok-xyz");
    expect(options.redirectTo).toContain("/reset-password");
  });

  it("maps captcha failures to a distinct friendly message", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: "missing captcha token" },
    });

    const result = await sendPasswordResetEmail("admin@x.edu", "bad-tok");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/security check/i);
  });
});
