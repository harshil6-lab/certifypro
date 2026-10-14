# CAPTCHA Setup (Cloudflare Turnstile + Supabase Auth)

Supabase enforces CAPTCHA only on `signInWithPassword` and
`resetPasswordForEmail`. The frontend already sends
`options: { captchaToken }` on both calls and degrades gracefully when
`VITE_CAPTCHA_SITE_KEY` is unset. Do the manual steps below **in order**.

## Manual steps

### 1. Cloudflare dashboard > Turnstile: create a widget

1. Sign in to https://dash.cloudflare.com and open Turnstile.
2. Add a site, create a widget (managed / visible widget is fine).
3. Under hostnames add your production domain (e.g. `certifypro-tau.vercel.app`).
   Add `localhost` too if you want to see the real widget locally.
4. Copy the **site key** and the **secret key**. The secret key is never
   committed — it lives only in the Supabase dashboard (step 4).

### 2. Vercel: set `VITE_CAPTCHA_SITE_KEY`

| Environment | Value |
| --- | --- |
| Production | Real site key from step 1 |
| Preview | Test key `1x00000000000000000000AA` (always passes) |
| Development | Test key `1x00000000000000000000AA` |

Vercel > project > Settings > Environment Variables. Redeploy after adding.

### 3. Deploy the frontend, verify widget (enforcement still OFF)

1. Deploy with the site key set.
2. Open `/login`: the Turnstile widget renders under the password field.
3. Sign in normally — login still works because Supabase enforcement is off.
4. Confirm dark mode and mobile layouts show the widget correctly
   (theme `auto`, size `flexible`).
5. With the variable **unset**, confirm the form works with no widget
   (pre-enforcement fallback) and a dev-only console warning appears.

### 4. Supabase > Authentication > Attack Protection: enable CAPTCHA

1. Open the Supabase dashboard for your project:
   Authentication > Attack Protection (Bot and Abuse Protection).
2. Toggle **Enable CAPTCHA protection** on, provider **Turnstile**.
3. Paste the **secret key** from step 1. Save. Enforcement starts here.

### 5. Test production, know the rollback

1. Test login success, login failure + retry (widget must reset and allow
   a fresh attempt), and forgot-password with a real inbox.
2. Test the always-blocks key (`2x00000000000000000000AB`) on Preview to
   see the friendly "Security check failed" error.
3. Rollback: toggle CAPTCHA **off** in Supabase Attack Protection.
   No code deploy needed.

## Test keys (Cloudflare docs)

Site keys: `1x00000000000000000000AA` always passes,
`2x00000000000000000000AB` always blocks,
`3x00000000000000000000FF` forces an interactive challenge.
Source: https://developers.cloudflare.com/turnstile/troubleshooting/testing/

## Manual QA checklist

- [ ] Login success with solved widget
- [ ] Login failure (wrong password) shows auth error, widget resets, retry works
- [ ] Forgot-password sends reset email with solved widget
- [ ] Forgot-password without solving is blocked (button disabled)
- [ ] Expired token: submit disabled again until re-solved (token cleared on expiry)
- [ ] Widget script blocked (offline/devtools): inline fallback message shown, no crash
- [ ] Dark mode renders widget legibly (theme auto)
- [ ] Mobile viewport: widget fits, no horizontal overflow
- [ ] No site key set: no widget, forms usable, dev console warning only
