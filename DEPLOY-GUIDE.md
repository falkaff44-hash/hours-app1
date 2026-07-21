# Getting "Hours" onto your phone — step by step

You don't need to know any code. This is copy, paste, and click. Set aside ~45 minutes.
By the end you'll have a web address (like `hours-fatima.vercel.app`) that you open on
your phone like any app, and your data saves automatically.

There are two paths. **Path A (GitHub)** is the recommended one — after setup, any future
change re-publishes itself. **Path B (drag-and-drop)** skips GitHub but you'd re-upload
manually for changes. Start with Path A.

---

## What you have

A folder called `hours-app`. Inside it are the app files. You do NOT touch the code —
you just get this folder online.

---

## PATH A — with GitHub (recommended)

### Step 1 — Make a GitHub account (3 min)
1. Go to https://github.com and click **Sign up**.
2. Use your email, pick a username (anything, e.g. `fatima-codes`), set a password.
3. Verify your email when they send the link. Done — you never need to understand Git.

### Step 2 — Put the folder on GitHub (10 min)
The easiest no-terminal way is GitHub's website uploader:
1. On GitHub, click the **+** (top right) → **New repository**.
2. Name it `hours-app`. Leave everything else default. Keep it **Private** if you like.
   Click **Create repository**.
3. On the next page, find the link **"uploading an existing file"** (in the quick-setup text).
4. Open your `hours-app` folder on your computer. Select **all files and folders inside it**
   — including the `src` folder — and drag them into the browser upload area.
   - IMPORTANT: do NOT upload the `node_modules` folder if you see one. It's huge and not needed.
     (If you only have the files I gave you, there's no `node_modules` — you're fine.)
5. Scroll down, click **Commit changes**. Your code is now on GitHub.

### Step 3 — Deploy with Vercel (10 min)
1. Go to https://vercel.com and click **Sign Up**.
2. Choose **Continue with GitHub** — this links the two so Vercel can see your code.
   Approve the permission prompt.
3. On your Vercel dashboard, click **Add New… → Project**.
4. Find `hours-app` in the list and click **Import**.
5. Vercel auto-detects it's a Vite app. You don't need to change any setting.
   Just click **Deploy**.
6. Wait ~1 minute. You'll see confetti and a **Visit** button. Click it — that's your live app.

### Step 4 — Put it on your phone (2 min)
1. Open the Vercel URL on your phone's browser (email it to yourself, or Vercel shows a QR-style link).
2. **iPhone (Safari):** tap the Share icon → **Add to Home Screen**.
   **Android (Chrome):** tap the **⋮** menu → **Add to Home screen** / **Install app**.
3. Now it sits on your home screen with an icon and opens full-screen like a real app.

Done. Log your day; it saves automatically.

---

## PATH B — no GitHub (drag-and-drop)

Use this only if you'd rather skip GitHub. Downside: to update the app later, you repeat this.
1. Go to https://vercel.com, sign up (you can use email).
2. On your computer, the app needs to be *built* first into a `dist` folder.
   If you can run commands: open a terminal in the `hours-app` folder and run
   `npm install` then `npm run build`. That creates a `dist` folder.
   (If that sentence means nothing to you, use Path A instead — it avoids this.)
3. On Vercel, drag the `dist` folder onto the deploy area. It goes live in seconds.

---

## Everyday use

- **Just open the app and tap.** Your data saves automatically in that browser — no export needed.
- **Backup button:** once a week or so, tap **Backup**. It downloads a small file. Keep it somewhere safe.
- **Restore button:** if you ever clear your browser, get a new phone, or the data vanishes,
  tap **Restore** and pick your backup file. Everything comes back.

### One honest limitation
Your data lives in the browser on the device you use. It does NOT sync between your phone and
laptop, and clearing browser data wipes it (that's what Backup protects against). If you later
want true sync across devices with a login, that's the bigger "database" version — tell Claude
and it'll walk you through upgrading. The code you have now carries over.

---

## If something goes wrong

- **Vercel build fails:** make sure you uploaded the files *inside* `hours-app` (so `package.json`
  and `index.html` are at the top level of the repo), not the `hours-app` folder nested inside another folder.
- **Page is blank:** hard-refresh (pull down to refresh on phone). If still blank, re-check that the
  `src` folder with `main.jsx` and `TimeTracker.jsx` uploaded.
- **Still stuck:** copy the error message Vercel shows and paste it to Claude — it'll tell you the fix.
