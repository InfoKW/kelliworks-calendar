# PRD & Plan — KelliWorks Content Calendar Tool

**Project owner:** Ola Fakomi
**Assigned by:** Charity Moses
**End users:** Charity Moses (content creation) · Kelli Lewis (mobile review + approval)
**Last updated:** April 29, 2026

---

## 0. Product Summary

Charity currently builds 7 weekly content calendars in Google Docs. Problems:
- Kelli can't review smoothly (one-by-one Docs, not mobile-friendly)
- A previous Claude artifact attempt failed — no persistence, Kelli's approvals weren't visible to Charity
- The artifact couldn't be shared as a live URL

The fix: A live, hosted single-page web app built in versions so we ship something working immediately,
then layer in features over time.

---

## 1. Version Overview

| | V1 — Ship Now | V2 — After V1 stable | V3 — After V2 stable |
|---|---|---|---|
| Database | None | Supabase (Postgres) | Same + Storage migration |
| Auth | None — landing page is access control | Email + password login | Same |
| Content upload | Ola uploads a .md file, site updates on deploy | Charity uploads via in-app form | Same + image upload via Supabase Storage |
| "Update Calendar" button | Visible but disabled | Active — Charity's upload form | Same |
| Kelli approval | localStorage on her device | Synced to Supabase | Same |
| Slack notify | Fires on approval (no DB needed) | Same | Same |
| Image/Drive links | Shown as clickable links on post card | Inline Drive embed preview | Inline Supabase Storage preview |
| Realtime sync | None — Slack is the notification | Supabase Realtime | Same |
| Video | Skip | Evaluate after Drive works | Allowed, 1GB cap |

---

## 2. Architecture

### V1 Architecture (current)

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Single-page HTML + vanilla JS | Existing reference HTML is already in this format |
| Data | Static `.md` file parsed at page load | No database needed. Ola updates the file, Vercel redeploys. |
| Approval state | localStorage on Kelli's device | Persists across refreshes on her phone. No server needed. |
| Hosting | Vercel | Free tier, auto-deploys from GitHub on every push |
| Notifications | Vercel serverless (`/api/notify.js`) + Slack webhook | No database needed — just an HTTP call on approval |

### V2+ Architecture (future)

| Layer | Choice |
|---|---|
| Database | Supabase (Postgres + Realtime) |
| Auth | Supabase Auth (email + password) |
| Image storage | Google Drive (V2) → Supabase Storage (V3) |

---

## 3. V1 Content Upload Process (Ola's Workflow)

No in-app upload form in V1. The process is:

```
Charity writes the week's content
  -> Sends Ola a .md document
     -> Ola uploads the .md file to the repo (src/data/week.md)
        -> Vercel detects the push and auto-redeploys (< 1 min)
           -> Kelli opens the URL and sees the new week's content
```

### Markdown format Charity uses

Charity sends a `.md` file structured exactly like this:

```markdown
## PLATFORM: kw

### MONDAY · APRIL 27
date: 2025-04-27
time: 8:00 AM
type: Static Post
priority: HIGH
caption: The firm your business deserves does not just file reports and disappear...
visual: Headline: The Firm Your Business Deserves. Navy background. Gold accent.
drive: https://drive.google.com/file/d/EXAMPLE/view

### TUESDAY · APRIL 28
date: 2025-04-28
time: 8:00 AM
type: Static Post
priority: HIGH
caption: Your business is only as strong as the systems behind it...
visual: Headline: Strong Systems. Stronger Business. Navy and gold.
drive:

---

## PLATFORM: kwa

### MONDAY · APRIL 27
date: 2025-04-27
time: 10:00 AM
type: Trending Reel
priority: TREND
caption: POV: You haven't reconciled your accounts since January...
visual: Trending audio — panicking / chaotic sound. Text overlay: POV reel.
drive:
```

The `date:` field on each post is all that's needed. The week label shown in the app
("April 27 – May 1, 2025") is automatically calculated from the earliest and latest
dates across all posts — no week header required.

### What Ola does on receipt

1. Save the file as `src/data/week.md`
2. `git add src/data/week.md && git commit -m "Load week: [label]" && git push`
3. Vercel deploys in under a minute
4. Send Kelli the live URL

The `.md` file is parsed by the app at page load and rendered as the calendar.

---

## 4. V1 — Detailed Scope

### What's In
- Live Vercel URL (no more static file, no more artifacts)
- Landing page with two buttons: "Update Calendar" (disabled) and "Approve Content"
- Approval Mode: all 7 platform tabs, post cards with approval select + notes
- Approval state saves to localStorage on Kelli's device
- Slack notification fires when Kelli marks any post as approved
- Fully responsive at 375px (Kelli's phone)
- Content loads from `src/data/week.md` — updated by Ola each week

### What's Out (V1)
- No database
- No login
- No real-time sync between devices (Slack is the notification mechanism)
- No image upload — Drive links shown as clickable text links
- "Update Calendar" button is visible but disabled with a "Coming soon" tooltip

### V1 Landing Page

```
+----------------------------------------------+
|       KelliWorks Content Calendar            |
|                                              |
|  [ Update Calendar ]   [ Approve Content ]   |
|    (disabled/grey)       (active/navy)       |
+----------------------------------------------+
```

"Update Calendar" — visible, greyed out, tooltip: "Coming in the next version"
"Approve Content" — active, opens the calendar for Kelli to review

### V1 User Flow

```
Charity writes the week
  -> Sends Ola the .md file

Ola uploads the .md file
  -> git push -> Vercel redeploys automatically
  -> Sends Kelli the live URL

Kelli (mobile)
  -> Opens URL
  -> Clicks "Approve Content"
  -> Scrolls through platform tabs
  -> Sets approval status and leaves notes
  -> Approvals save to her browser (localStorage)
  -> Each approval fires a Slack notification

Ola / Charity
  -> Receives Slack message per approved post
```

---

## 5. Slack Notification (V1)

Fires when Kelli sets any post to "Approved". No database needed — the post data
is already rendered in the DOM when Kelli taps approve.

**Trigger:** Kelli selects "Approved" on a post card
**Destination:** `/api/notify.js` (Vercel serverless) -> Slack webhook URL (env var)

### Message format:
```
Kelli approved a post
Platform: KelliWorks IG_FB
Day: MONDAY - APRIL 27
Time: 8:00 AM
Content type: Static Post
```

`api/notify.js` is already scaffolded. The only thing needed is `SLACK_WEBHOOK_URL`
added to Vercel environment variables.

---

## 6. Approval State (localStorage)

Kelli's approvals and notes are saved to `localStorage` on her device under a key
based on the week and post identifier.

```javascript
// Key format
`kw-approval-${platform}-${dayOrder}-${postIndex}`

// Value stored
{ status: 'approved', note: 'Love this one', savedAt: '2025-04-27T...' }
```

On page reload, the app reads from localStorage and restores all approval states
and notes so Kelli can pick up exactly where she left off.

**Limitation:** Approvals are only visible on Kelli's device. Charity sees them
via Slack notifications. This is resolved in V2 when Supabase is added.

---

## 7. Data Model (V2 — not built in V1)

Defined here so V2 is a clean swap, not a rebuild.

### Table: `weeks`
```sql
create table weeks (
  id         uuid primary key default gen_random_uuid(),
  week_start date not null,
  label      text,
  status     text default 'draft',
  created_at timestamptz default now()
);
```

### Table: `posts`
```sql
create table posts (
  id              uuid primary key default gen_random_uuid(),
  week_id         uuid references weeks(id) on delete cascade,
  platform        text not null,
  day_label       text not null,
  day_order       int not null,
  post_time       text,
  content_type    text,
  priority        text,
  caption         text,
  visual_text     text,
  image_url       text,
  approval_status text default 'pending',
  kelli_note      text,
  scheduled_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

When V2 is built: the app reads from Supabase instead of the `.md` file.
Kelli's approvals write to Supabase instead of localStorage.
Everything else stays the same.

---

## 8. Design Rules (Non-Negotiable)

The reference HTML (Asana_Calendar_May_27.html) is the design bible.

| Element | Value |
|---|---|
| Font | Arial, sans-serif |
| Background | `#f5f5f5` |
| Header background | `#1a1a2e` (navy) |
| Tab bar border | `#c9a84c` (gold) |
| Active tab | navy bg, white text |
| Day label | gold bg `#c9a84c`, navy text, `border-radius: 4px 4px 0 0` |
| Post card | white bg, `border: 1px solid #e8e8e8` |
| Caption block | `border-left: 3px solid #c9a84c`, `background: #fafafa` |
| Visual box | `background: #fff8e1`, dashed gold border |
| Approve — approved | green border + bg |
| Approve — needs edits | gold border + bg |
| Approve — do not post | red border + bg |
| Tab bar | sticky, `top: 0`, `z-index: 100` |

Do not add new components, colors, or fonts.

---

## 9. File Structure

```
calendar-site/
|- PRD&Plan.md                      <- this file
|- README.md                        <- setup notes
|- vercel.json                      <- Vercel config (outputDirectory: src)
|- api/
|   -- notify.js                    <- Slack notifier (serverless function)
|- src/
|   |- index.html                   <- single-page app
|   |- data/
|   |   -- week.md                  <- current week's content (Ola updates this each week)
|   |- config/
|   |   -- supabase-config.js       <- placeholder (used in V2)
|   |   -- firebase-config.js       <- placeholder (not used)
|   -- assets/
|       -- (logo, favicon — future)
-- html_Updates/
    -- (Charity's raw weekly HTML files, kept for reference)
```

---

## 10. V1 Testing Checklist

### Manual smoke test (before sending URL to Kelli)
1. Open live Vercel URL -> landing page shows two buttons
2. "Update Calendar" button is greyed out and not clickable
3. Click "Approve Content" -> calendar loads with current week's posts
4. Click all 7 platform tabs -> correct content renders per tab
5. Set approval on a post -> badge updates colour immediately
6. Leave a note -> reload page -> click "Approve Content" -> note still there (localStorage)
7. Open on phone at 375px -> no horizontal scroll, all taps register
8. Approve a post -> Slack message arrives in the channel

---

## 11. V1 Execution Order

```
Step 1 — Vercel deploy
  [x] GitHub repo already created (kelliworks-calendar)
  [ ] Connect repo to Vercel (vercel.com -> New Project -> Import)
  [ ] Add env var: SLACK_WEBHOOK_URL
  [ ] Confirm live URL works

Step 2 — Markdown parser + calendar render
  [ ] Build parseMd() function to read src/data/week.md and return posts array
  [ ] Render platform tabs and post cards from parsed data
  [ ] Drive links render as "View Image" clickable link

Step 3 — Approval Mode
  [ ] Approval select + note field on each post card
  [ ] On change: save to localStorage
  [ ] On page load: restore from localStorage
  [ ] On approval: call /api/notify -> Slack

Step 4 — Landing page
  [ ] "Update Calendar" button visible, disabled, tooltip "Coming in the next version"
  [ ] "Approve Content" button active -> loads calendar

Step 5 — Responsive
  [ ] Test at 375px, fix any overflow or tap issues

Step 6 — Load first week
  [ ] Ola formats Charity's current week as week.md
  [ ] git push -> Vercel deploys
  [ ] Smoke test all items above
  [ ] Send live URL to Kelli
```

---

## 12. V2 Execution Order

```
Step 1 — Supabase setup
  [ ] Create Supabase project
  [ ] Run schema SQL (weeks + posts tables)
  [ ] Add SUPABASE_URL + SUPABASE_ANON_KEY to Vercel env vars

Step 2 — Swap data source
  [ ] Replace parseMd() reads with Supabase queries
  [ ] Replace localStorage writes with Supabase updates
  [ ] Wire Supabase Realtime for live badge updates

Step 3 — Auth
  [ ] Enable Supabase Auth
  [ ] Create Charity and Kelli accounts
  [ ] Build login screen, role detection
  [ ] Apply RLS policies

Step 4 — Upload form (replaces Ola's .md workflow)
  [ ] Build per-post form (date, time, type, priority, caption, Drive link)
  [ ] "Publish Week" saves to Supabase

Step 5 — Google Drive integration
  [ ] Drive image links -> inline embed preview on post cards
```

---

## 13. V3 Execution Order

```
Step 1 — Supabase Storage setup
  [ ] Create content-media bucket (public read, authenticated write)
  [ ] Images only at launch. Block video at form level.
  [ ] 5MB per-file cap on images

Step 2 — Migrate upload form to Supabase Storage
  [ ] Replace Drive link input with direct file upload
  [ ] Show image preview before submit
  [ ] Display current bucket usage in upload UI

Step 3 — Inline image preview on post cards
  [ ] Render thumbnail in visual box when image_url is a Supabase URL
  [ ] Lightbox on click

Step 4 — Video (after images stable)
  [ ] MP4 only, 50MB per file
  [ ] Pre-upload check: block if projected total > 900MB
  [ ] Total bucket cap: 900MB (10% buffer below free tier limit)
```

---

## 14. Open Questions

| # | Question | Default if not answered |
|---|---|---|
| 1 | What Slack channel should approvals go to? | DM to Ola |
| 2 | Should Kelli get notified when Ola loads a new week? | No for V1 |
| 3 | What are Charity and Kelli's actual email addresses? | Needed for V2 auth setup |
| 4 | Does Charity want to edit a caption after the week is loaded? | No for V1 |
| 5 | Custom domain or vercel.app URL? | vercel.app is fine |
| 6 | Which Google account owns the shared Drive folder? | Charity's account |

---

*V1 ships with no database. V2 adds Supabase as a drop-in swap. Do not build V2 features during V1.*
