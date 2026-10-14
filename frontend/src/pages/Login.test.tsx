import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  resetCaptcha: vi.fn(),
  signInWithPassword: vi.fn(),
  sendResetEmail: vi.fn(),
}));

vi.mock("@/hooks/useCaptchaToken", () => ({
  useCaptchaToken: () => ({
    siteKey: "test-key",
    isConfigured: true,
    token: "tok-login",
    reset: mocks.resetCaptcha,
    Widget: () => null,
  }),
}));

vi.mock("@/lib/supabaseClient", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      resetPasswordForEmail: mocks.sendResetEmail,
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
  clearStoredSupabaseSession: vi.fn(),
}));

import Login from "@/pages/Login";

describe("Login captcha wiring", () => {
  it("passes the token on submit and resets the widget after failure", async () => {
    mocks.resetCaptcha.mockClear();
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("admin@institution.edu"), {
      target: { value: "admin@x.edu" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "admin@x.edu",
        password: "wrong",
        options: { captchaToken: "tok-login" },
      });
    });
    await waitFor(() => {
      expect(mocks.resetCaptcha).toHaveBeenCalled();
    });
    expect(await screen.findByText("Invalid login credentials")).toBeTruthy();
  });
});
