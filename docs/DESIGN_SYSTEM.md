# CertifyPro Design System

Enterprise-SaaS UI: AWS Cloudscape structure (dense, data-first, bordered panels)
with Salesforce Lightning polish (calm blue, soft elevation). Light mode only —
`.dark` tokens exist but are frozen and out of QA scope. No AWS/Salesforce logos,
icons, trademarks, or proprietary fonts are used.

## 1. Tokens (`frontend/src/index.css`, consumed via `tailwind.config.ts`)

| Token group | Values | Notes |
|---|---|---|
| `--primary` | `210 88% 36%` `#0B5CAD`, fg white | Text on white 6.67:1, white on fill 6.67:1 (AA) |
| `--accent` | `212 68% 34%` `#1C5392`, fg white | Secondary actions, icon washes (`/10`), focus accents; 7.77:1 both directions |
| `--radius` | `0.25rem` | `rounded` = 4px; `rounded-md` = 2px; `rounded-lg` = 4px |
| `--shadow-*` → `elevation-1/2/3` | `0 1px 2px / 0 1px 3px / 0 4px 12px -2px`, neutral, low alpha | Borders carry structure; shadows are whispers |
| `--sidebar-*` | Deep navy bg, light-sky `205 85% 72%` primary/ring | Sky-on-navy 7.69:1+ |
| `--success / --destructive / --info` | Tokenized greens/red/blue, all AA for fg-on-tint and white-on-fill use | `--warning` amber is a **known gap** (3.09:1) — use with `text-foreground` body copy, never amber text |
| Fonts | Inter (UI), Playfair Display + Dancing Script **artifact-only** (`font-heading`, `.font-signature`) | Self-hosted via Fontsource, `font-display: swap` |

Rules: never hardcode hex/slate/emerald/amber in UI code. Exempt: certificate SVG
artifact colors (`#D9A938` etc.), `CertificateTemplate`/`LayoutPreview`/editor internals,
and the Razorpay modal theme (`#1a365d` in `subscriptionService.ts` — sync with brand on request).

## 2. Primitives (`components/ui/*`)

Compact density: buttons `h-9` default, inputs/selects `h-9`, table heads `h-9` /
cells `py-2`, cards `p-5`, badges rectangular `rounded px-2 py-px`. Focus is always
`ring-ring` via `focus-visible`; **no scale transforms on press**. Tables: sticky
`tinted thead`, `scope="col"`, row hover; sorting adds `aria-sort`. Tabs are
underline-style. Dialog overlay is `bg-black/50` with `elevation-3` panels.

## 3. Shared components (use these, don't rebuild)

| Component | Use for | Don't |
|---|---|---|
| `PageContainer` / `PageToolbar` / `PageHeader` / `Section` | Page width (`max-w-7xl`), breadcrumb + title + actions | Don't invent wrappers (`max-w-[1240px]` etc.) |
| `SectionCard` | Titled bordered panels (replaces `rounded-2xl border bg-card p-6` copies) | Don't add new copy-pasted panels |
| `DataTable` | Search + filter slot + sort + pagination + bulk bar | Don't hand-roll tables; don't use for card galleries |
| `StatusBadge` | Status pills (16-key map, unknown → neutral) | Don't duplicate status maps per page |
| `EmptyState` / `ErrorState` / `LoadingState` | Zero rows / failure (+retry) / skeleton loading | Don't use bare text divs |
| `FileDropzone` | File upload: keyboard (Enter/Space), `accept` filter + inline error, drag state | Don't build custom dropzones |
| `Alert` variants | `success/warning/info/destructive` inline notices | Don't hand-roll colored boxes |

## 4. Accessibility contract

- Every form control has an associated `<label htmlFor>` (or is wrapped by one);
  group captions use `<p>` + `role="group"` + `aria-labelledby`.
- Decorative lucide icons carry `aria-hidden="true"` (lucide-react omits it by default);
  icon-only buttons carry `aria-label` on the button.
- Tables: `scope="col"` (primitive default), `aria-sort` on sortable headers,
  `caption` (screen-reader) on `DataTable`.
- Radix Dialog/Sheet/AlertDialog keep default modal focus traps — never pass
  `modal={false}`.
- Dropzones: `role="button"` + `tabIndex` + `aria-label` + `aria-describedby`
  (hint + error); never `aria-invalid` on `role="button"` (unsupported).
- `prefers-reduced-motion` is globally guarded in CSS.

## 5. Do / Don't

Do: extend primitives via `cva` variants; add columns/rows to `DataTable`;
token-first fixes; keep `PageToolbar` crumbs as Dashboard › Page.
Don't: touch `auth.ts`, `supabaseClient.ts`, `CaptchaWidget`, `useCaptchaToken`,
`services/*`, certificate render internals, Razorpay flow, or Supabase/Edge code
for styling; don't add `overflow-hidden` or `transform: scale` ancestors around
the Turnstile widget (keep its `flex justify-center` wrapper); don't reintroduce
deleted deps/wrappers (see PR records for the removal lists).
