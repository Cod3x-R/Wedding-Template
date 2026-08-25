# Our Wedding — Static Site

A dark/light-mode, emerald-and-charcoal single-page wedding site. Plain HTML / CSS / JS — no build step, ready for **GitHub Pages**.

## Run it
Open `index.html` in a browser, or serve locally: `python -m http.server` → `http://localhost:8000`.

### Deploy to GitHub Pages
1. Create a repo and push these files (with `index.html` at the root).
2. Repo → Settings → Pages → Source: `main` branch, `/ (root)`.
3. Your site goes live at `https://<username>.github.io/<repo>/`.

## Edit everything in one place
Open **`js/config.js`**. Names, date, venues, story timeline, day schedule, FAQ, RSVP date, map address — it's all there. Save, refresh, done.

- **Countdown** — driven by `weddingDateTime` (currently `2026-12-30T15:00:00`).
- **Map** — set `venueMapQuery` to the real venue address; the embedded map + directions buttons update automatically. No API key needed.
- **Dark / light mode** — the moon/sun button in the nav; choice is remembered per visitor.

## 🔒 Hidden couple's dashboard (guest list tracker + RSVP inbox)
Not linked anywhere on the page. Three secret ways in, all PIN-protected:

1. **Type** the word `ourday` anywhere on the page (just type it, not in a text box), or
2. **Tap the monogram in the footer 7 times quickly** (works on your phone), or
3. Visit the site with `#admin` at the end of the URL.

Then enter the PIN. **Default PIN: `3012`** — change it before going live:
open the browser console (F12) and run `WEDDING_HASH("yourNewPin")`, then paste the printed value into `adminPinHash` in `js/config.js`. The keyword can be changed via `adminKeyword`.

The dashboard gives you (in tabs):
- **Guest list tracker** — add guests/families with party size, cycle their status (Invited → Coming → Declined), search, delete.
- **Live stats** — invited, accepted, declined, total confirmed heads, awaiting.
- **RSVP inbox** — responses submitted in this browser; if a name matches your guest list, their status updates automatically.
- **To-do list** — pre-seeded with wedding-planning basics; add, tick off, delete.
- **Vendors & contacts** — names, roles, tap-to-call phone numbers and emails.
- **Notes** — a private notepad that autosaves as you type.
- **Dreamboard** — upload inspiration images (stored privately in your browser, auto-compressed; never shown on the public site).
- **Export CSV** — guests, RSVPs, contacts and to-dos in one download.

All dashboard data lives in your browser's localStorage — private to your device, and it survives refreshes and site updates.

> **Honest note on security:** this is a static site, so the PIN lock is client-side (the PIN itself is never in the code, only its hash). It will keep guests and casual snoopers out, which is right for a wedding site — but don't store anything truly sensitive.

> **Getting guests' RSVPs to you:** GitHub Pages has no server, so RSVPs made on *guests'* devices stay on their devices unless you set `rsvpEndpoint` in `js/config.js` to a (free) [Formspree](https://formspree.io) form endpoint — then every RSVP is also emailed to you.

## Adding your photos
Drop images into `assets/photos/`, then point each `<img src="assets/photos/...">` in `index.html` at them. The gallery includes a built-in lightbox.

Every photo is cropped to a fixed shape, so any size or orientation drops in cleanly — the subject just needs to be roughly centred:

| Where | Shape | Suggested size |
| --- | --- | --- |
| Hero (`.hero__photo`) | fills the screen | 2400 × 1600 landscape |
| Our Story (`.story__media`) | 4:5 portrait | 1200 × 1500 |
| Gallery tiles | 1:1 square | 1200 × 1200 |

## Colours
CSS variables at the top of `css/styles.css` — the dark palette under `:root`, the light palette under `[data-theme="light"]`.
