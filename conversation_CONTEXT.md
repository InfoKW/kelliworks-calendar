# Context for new chat — KelliWorks Content Calendar Tool

Hand this file to a fresh Claude session before starting work on the calendar tool. It captures everything decided in the previous session so we don't re-litigate it.

---

## Who's involved

- **Ola Fakomi** (me) — engineer, building this for the KelliWorks team.
- **Charity Moses** — assigned the task. She prepares the weekly content calendar across seven platforms and needs a tool to replace her current Google Doc workflow.
- **Kelli Lewis** — owner. She reviews and approves every post before it goes live. Reviews mostly from her phone.

---

## The brief (verbatim from Charity, paraphrased where long)

She currently builds 7 weekly content calendars in Google Docs — one per platform (KW Accounting IG_FB, KW Accounting LinkedIn, Kelli Lewis, Global Woman, EA, Yelp, GMB). The Doc workflow gets cluttered, Kelli can't review smoothly, and a previous Claude artifact attempt failed because (a) the artifact wouldn't go live for Kelli, and (b) the artifact didn't persist data, so Charity couldn't see what Kelli filled in.

### What the tool must do

1. **Display content by platform** — tabs for KelliWorks IG_FB, KW Accounting, KW Taxes, Entrepreneurs Anonymous (EA), Kelli LinkedIn, Global Woman, Website_GMB_Yelp. Each tab shows that week's posts in daily order.
2. **Show full post details on each card** — brand + platform, date + time, post format (static, reel, carousel, quote), full caption, visual placeholder or uploaded image, approval status.
3. **Kelli's approval workflow** — per-post status select (Approved / Needs Edits / Do Not Post), free-text note, **autosaves** so nothing is lost on browser close. Mobile-friendly is non-negotiable — she reviews from her phone.
4. **Charity's workflow** — upload a new week's content each Monday, add/edit captions and visual placeholders, see Kelli's status + notes in real time, mark posts as scheduled once they're live.
5. **Notifications (nice-to-have, not blocking)** — email or Slack ping when Kelli approves/flags content.

### Hard constraints

- **Brand colors:** Navy `#1a1a2e`, Gold `#c9a84c`.
- **Mobile-first** for Kelli's review screens.
- **Lovable is the preferred platform** (KelliWorks and EA sites are already on it). If Lovable can't do it, recommend an alternative with pros/cons.
- **Data must persist** — that's the entire reason the previous Claude artifact failed. Real database, not localStorage-only.
- **Timeline:** Charity asked for a working version "by tomorrow at the latest." I should set a more realistic estimate when I respond — a defensible MVP is the goal, not a polished v1.

### Reference design

`/sessions/kind-relaxed-wright/mnt/uploads/Asana Calendar May 27.html` — 609-line single-file HTML that Charity built. It has the visual design, color scheme, fonts, tab structure, post-card layout, and approve-row UI **already built**. Use it as the design reference verbatim — don't redesign. It uses Arial, navy header, gold underline on the platform tabs, sticky tab bar, day-blocks with a gold day label, post-cards with caption + visual placeholder + approval select + notes input.

---

## Where the project lives

`/sessions/kind-relaxed-wright/mnt/Kelli Lewis/calendar-site/` already contains an early scaffold from a previous session:

```
calendar-site/
├── README.md                       # Setup notes (Supabase + Vercel)
├── vercel.json                     # Vercel config
├── api/
│   └── notify.js                   # Serverless Slack notifier
├── src/
│   ├── index.html                  # Main calendar page (in progress)
│   └── config/
│       └── supabase-config.js      # Supabase URL/anon key (needs filling)
└── html_Updates/                   # Drop zone for HTML snippet edits
```

So the architecture decision was already made in a prior session: **single-page HTML + Supabase for persistence + Vercel for hosting (with `/api/notify` as a serverless function for Slack)**. That's the path of least resistance and matches Charity's "single artifact that actually saves data" requirement. **Lovable was not used** because we wanted full control over Supabase reads/writes and the existing HTML was easier to drop straight in than rebuild in Lovable's component model. When responding to Charity, frame this as: "Lovable couldn't give us the persistence guarantees you need without a custom backend anyway, so I went with HTML + Supabase, hosted on Vercel."

That decision can be revisited if the new session has a strong reason to switch, but inherit it as the default.

---

## Skills already built and available

In the prior session I built and packaged seven Claude skills at `/sessions/kind-relaxed-wright/mnt/AI_Build/skills/`. The relevant ones for this project, in priority order:

| Skill | Use it for |
|---|---|
| **agentic-tdd** | The workflow loop. PRD → PLAN → tests → implement → REMEDIATION on red. Do not skip the PLAN step before writing code. |
| **ola-prd-writer** | Drafting the PRD for this tool. Use the `web-app` reference inside it (it has progressive disclosure across web-app / static-website / browser-extension / mobile-app / api-backend templates). |
| **ola-eng-tests** | Test patterns. This project = vanilla JS + HTML, so Playwright for the approval flow + Vitest for any pure helpers (date sorting, status coercion). |
| **ola-design-system** | Has Ola's tokens but **the calendar uses Charity's brand, not Ola's** — so this skill mostly tells you to NOT impose Ola's colors. Use Navy `#1a1a2e` + Gold `#c9a84c` as defined in the reference HTML. |
| **ola-security-audit** | Run before pushing live. Supabase RLS is the critical surface — any user with the anon key can read/write the `posts` table unless RLS policies lock it down. |

---

## Recommended next-session sequence

Don't just start coding. The agentic-tdd skill exists to prevent that. Walk through:

### 1. PRD (1 short pass)
Use `ola-prd-writer` with the `web-app` template. Save to `calendar-site/PRD.md`. Keep it tight — this is a tool for two people, not a SaaS launch. Goals, user stories for Charity and Kelli, data model, auth model, deploy target.

### 2. PLAN.md for the MVP slice
Use `agentic-tdd` Prompt 1. The MVP is: Charity can paste a week's content → Kelli sees it on her phone → Kelli sets status + leaves notes → Charity sees Kelli's input. Anything else (image upload, scheduled-mark, Slack notify, multi-week history) is a follow-up slice. Stop after `PLAN.md` and get my approval before writing code.

### 3. Open questions to resolve in the PLAN
- **Auth model.** Two options: (a) one shared "magic link" URL with a passphrase that gates the page, or (b) Supabase Auth with two seeded users (charity@ and kelli@). Option (b) is the right answer for an audit trail of who changed what — recommend it unless Kelli pushes back on logging in.
- **Data model.** At minimum: `weeks` table (id, week_start_date, status), `posts` table (id, week_id, platform, day, time, format, caption, visual_text, image_url, status, kelli_note, scheduled_at). Status enum: `pending | approved | needs_edits | do_not_post | scheduled`.
- **Realtime.** Charity wants to see Kelli's input "in real time." Supabase Realtime on the `posts` table is one line of subscribe code — include it from day one, don't bolt on later.
- **Image upload.** Supabase Storage bucket. Keep it lazy — visual placeholders are TEXT first; actual image upload is a v1.1 feature.
- **Mobile.** Kelli's review screens must pass a Playwright test at 375×667 (iPhone SE) with the approve-row visible without horizontal scroll. The reference HTML's `flex-wrap: wrap` already handles most of this; just verify.

### 4. Tests first, then code
Per agentic-tdd. Failing Playwright tests for: tab switching, approval status persists across reload, Kelli's note saves on blur, mobile viewport renders the approve-row inline. Commit them red. Then build.

### 5. Security pass before going live
Run `ola-security-audit` before sending Charity the production URL. Specifically check Supabase RLS policies — without them, anyone who view-sources the page gets the anon key and can wipe the table.

### 6. Deploy
Vercel `--prod`. The `api/notify.js` function only works on Vercel (not on cPanel static hosting) — that's already noted in the README. Custom domain optional; a `*.vercel.app` URL is fine for an internal tool.

---

## What to tell Charity in the reply

She asked for a working version "by tomorrow at the latest." A defensible answer:

> Received. Going to build this as a single-page HTML app backed by Supabase (so it actually persists Kelli's input, which was the gap in the Claude artifact attempt) and hosted on Vercel. Lovable would have made the auth+persistence story slower, not faster, since we'd still need a custom backend. Realistic timeline for an MVP that Kelli can use on her phone: **48 hours** for the read/approve/note loop, another 24 hours for image upload and Slack notify if you want them. I'll send a preview URL for you to test before showing Kelli.

Adjust the hours up or down depending on how clean the next session's PRD/PLAN turns out to be.

---

## Anti-patterns to avoid (lessons from the previous Claude artifact)

- **Do not use localStorage as the source of truth.** The previous attempt failed exactly there. Supabase first, localStorage only as a draft buffer for in-progress notes.
- **Do not hardcode the week.** The reference HTML hardcodes April 27 – May 1. The tool needs to fetch the active week from Supabase.
- **Do not lose Kelli's note on tab switch.** Save on `blur`, not on submit. There is no submit button in the design.
- **Do not redesign.** The HTML's look is approved. Match it to the pixel.
