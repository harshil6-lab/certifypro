const AUTH_KEY = "certifypro_auth";

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function setAuthenticated(value: boolean): void {
  if (value) {
    localStorage.setItem(AUTH_KEY, "true");
    return;
  }

  localStorage.removeItem(AUTH_KEY);
}

export { AUTH_KEY };
