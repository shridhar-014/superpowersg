# Making jaypeesports.in live — step-by-step (no tech knowledge needed)

The website lives in the `website/` folder of this repository. It is a
static site (plain HTML/CSS/JS) — no servers, no monthly hosting bill.
It is hosted for **free** on GitHub Pages, and your GoDaddy domain
`jaypeesports.in` points to it.

There are only two one-time setups: **(A)** turn on GitHub Pages,
**(B)** point the domain from GoDaddy. About 10 minutes total.

---

## A. Turn on GitHub Pages (one time, ~2 minutes)

1. Open your repository on github.com.
2. Click **Settings** (top bar of the repo) → **Pages** (left sidebar).
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. That's it. Every time the `website/` folder changes, the site
   redeploys automatically (the workflow file is
   `.github/workflows/deploy-website.yml`).
5. After the first deploy finishes (check the **Actions** tab — green
   tick), your site is live at:
   `https://shridhar-014.github.io/superpowersg/`

> If the Actions tab shows a failed "Deploy website" run from before you
> did step 3, just open the run and press **Re-run all jobs**.

## B. Connect jaypeesports.in from GoDaddy (one time, ~8 minutes)

### Step 1 — Tell GitHub about your domain

1. Repo **Settings → Pages → Custom domain**: type `jaypeesports.in`
   and click **Save**.
2. GitHub will say "DNS check in progress" — that's expected; finish
   Step 2 below and it will resolve.

### Step 2 — Add DNS records in GoDaddy

1. Log in at godaddy.com → **My Products** → next to
   **jaypeesports.in** click **DNS** (or **Manage DNS**).
2. Delete any existing **A** record with name `@` (often a "Parked"
   record).
3. Add these **four A records** (Type: `A`, Name: `@`, TTL: default):

   | Type | Name | Value             |
   |------|------|-------------------|
   | A    | @    | 185.199.108.153   |
   | A    | @    | 185.199.109.153   |
   | A    | @    | 185.199.110.153   |
   | A    | @    | 185.199.111.153   |

4. Add one **CNAME** record so `www.jaypeesports.in` also works:

   | Type  | Name | Value                      |
   |-------|------|----------------------------|
   | CNAME | www  | shridhar-014.github.io     |

   (If a CNAME named `www` already exists, edit it to this value.)

### Step 3 — Switch on HTTPS

1. Wait 15–60 minutes for DNS to spread across the internet.
2. Back in repo **Settings → Pages**, when the DNS check shows a green
   tick, tick **Enforce HTTPS**.
3. Done — `https://jaypeesports.in` is live, secure, and free.

---

## The enquiry forms (one time, ~1 minute)

The "custom teamwear" form and the store-launch "Notify me" form send
submissions to **shridhar.govind14.sg@gmail.com** via FormSubmit (a free
form service — nothing to install).

**Important:** the *first* time someone submits the form, FormSubmit
emails you an **activation link**. Click it once, and all future
submissions arrive straight to your inbox.

To change the receiving email later, edit `website/index.html` and
replace `shridhar.govind14.sg@gmail.com` in the two
`action="https://formsubmit.co/..."` lines.

---

## Things waiting for your content (placeholders)

Search `index.html` for the word `PLACEHOLDER` — each spot is marked:

| Section            | What's needed                                                            |
|--------------------|--------------------------------------------------------------------------|
| About us           | Real story from `jaypee-sports-about-us.pdf`                              |
| Our works          | Client logos from `OUR CLIENTS.ps` — export each as **SVG or PNG** first (browsers cannot read `.ps` files) |
| World stage        | Photos from Commonwealth / National / international games                |
| Teamwear showcase  | The 8K kit photos (upload compressed ~2000px WebP copies for fast mobile loading; keep 8K originals offline) |
| Store locations    | Addresses + phone numbers for Ranchi ×2, Kolkata ×1                       |
| Contact            | Real phone, WhatsApp number and email                                     |

Put images in `website/assets/` (create the folder) and follow the HTML
comments in `index.html` — each one shows the exact line to use.

---

## Later: moving to a dedicated repository (recommended, optional)

This repo originally holds other code. When convenient, create a fresh
repository (e.g. `jaypeesports.in`), copy the `website/` folder and the
workflow into it, and repeat sections A & B. Nothing else changes.
