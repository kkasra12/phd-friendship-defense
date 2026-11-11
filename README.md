# The Final Defense: From H₂ to PhD 🎓⚡

A one-page, mobile-first celebration site for a friend who just defended a PhD in
Materials Science (hydrogen & hydrogen batteries). The friend scans a QR code on a
postcard and goes through five screens of "one final experiment". The last screen
has a grant certificate and flying money, and tapping the money opens the real gift.

- Plain HTML, CSS and JavaScript (ES modules). No framework, no build step, no backend.
- Fonts are stored in the repo. There are no third-party requests, analytics or trackers.
  A strict Content-Security-Policy is set in `index.html`.
- All paths are relative, so it works from a GitHub Pages project subpath
  (`https://USERNAME.github.io/REPO/`).

---

## How to use this repo

The site never stores the gift itself. It only knows a **link template**, and the
secret part of the link (the **token**) reaches the page through the QR code. In short:

1. **Set the link template in `js/config.js`.** Set `redemptionUrlTemplate` to your
   gift provider's link, with `{token}` where the secret code goes. For example, a
   Revolut payment link looks like `https://revolut.me/p/AbC123xyz`, so use:

   ```js
   redemptionUrlTemplate: 'https://revolut.me/p/{token}',
   ```

   Also set `doctorName` if you like. Never put the real token in this file
   (details in [1. Configure](#1-configure-jsconfigjs)).
2. **Add your photos** to `assets/photos/`. A GitHub Action updates `assets/photos.json`
   for you (see [2. Add photos](#2-add-photos)).
3. **Deploy** the repo to GitHub Pages (see [4. Deploy to GitHub Pages](#4-deploy-to-github-pages)).
4. **Build the secret link** by adding `#token=` and the token to the end of your site URL.
   For the Revolut link `https://revolut.me/p/AbC123xyz` the token is `AbC123xyz`, so
   the link is:

   ```
   https://USERNAME.github.io/REPO/#token=AbC123xyz
   ```

   When your friend taps the money on the last screen, the site puts the token into
   the template and opens `https://revolut.me/p/AbC123xyz`.
5. **Turn that link into a QR code** with the included script, and print it on the postcard:

   ```bash
   pip install "qrcode[pil]"
   python3 tools/make_qr.py https://USERNAME.github.io/REPO/
   ```

   The script asks for the token without showing it, so it doesn't end up in your
   shell history. It saves `qr-postcard.png` (git ignores it). See
   [5. Make the postcard QR code](#5-make-the-postcard-qr-code) for options.

---

## The five screens

| # | Screen | What happens | Battery |
|---|--------|--------------|---------|
| 1 | **Welcome** | Big warning to finish the experiment, a fake lab console, and a "QR verified" badge | 0 % |
| 2 | **Qualification exam** | 3 multiple-choice questions with funny feedback, then a "MAJOR REVISIONS" stamp | 25 → 45 % |
| 3 | **Photo evidence** | Full-width slideshow (arrows, swipe, keyboard, counter) | 50 → 70 % |
| 4 | **Damage assessment** | Animated fictional metrics, a research log, and the conclusion | 75 → 95 % |
| 5 | **Grant approved** | A "committee deliberating…" transition, then confetti, the grant certificate and clickable flying 💸💶💰 | 100 % |

---

## Project structure

```
index.html            All page text for the 5 screens (edit wording here)
css/style.css         All styling and animations
js/config.js          ⚙️  Settings you must edit (redemption URL template, name, …)
js/app.js             Screen flow, battery, dashboard, final transition
js/quiz.js            Quiz questions and feedback (edit here)
js/gallery.js         Photo slideshow
js/gift.js            Token handling, redemption link, flying money, confetti
assets/photos/        Your photos
assets/photos.json    Ordered list of photo filenames (generated)
assets/fonts/         Fonts stored in the repo (SIL Open Font License)
assets/favicon.svg
tools/make_qr.py      Makes the postcard QR code on your own computer
tools/update_photos_json.sh  Rebuilds photos.json from assets/photos/
.github/workflows/    GitHub Action that runs it when photos change
.nojekyll             Tells GitHub Pages to serve files as-is
```

---

## 1. Configure (`js/config.js`)

| Setting | What to put there |
|---------|-------------------|
| `doctorName` | Optional. Your friend's name, e.g. `'Dr. Alex Example'`. Leave `''` to show "Doctor". |
| `redemptionUrlTemplate` | The gift provider's **public** redemption URL with `{token}` where the code goes, e.g. `https://revolut.me/p/{token}` for a Revolut payment link |
| `tokenPattern` | The characters a token may contain. The default is `A–Z a–z 0–9 . _ ~ -`, 4–256 characters. Widen it if your provider's codes use other characters. |
| `removeTokenFromAddressBar` | `true` (default) removes `#token=…` from the address bar right after reading it. See the security notes. |
| `moneyCount` | How many clickable flying bills to show (default 16) |

> ⚠️ **Never put the real token, or a full redemption URL that contains it, in any file
> in this repository.** The token only reaches the page through the QR code.

This site assumes your gift provider supports a redemption URL with the token in it
(for example `https://provider/redeem/<code>`). It does not integrate with any
provider's API.

---

## 2. Add photos

1. Copy your photos into `assets/photos/`, for example `001.jpg`, `002.jpg`, `beach-2023.jpg`.
2. Commit and push. The **Update photos.json** GitHub Action
   (`.github/workflows/update-photos.yml`) lists the folder, rewrites
   `assets/photos.json`, and commits it back to the branch. Photos appear in
   natural filename order (`001`, `002`, … `010`), so number your files to set the order.

   To regenerate it yourself (needs `jq`), run `tools/update_photos_json.sh`. You can
   also start the Action by hand from the repo's **Actions** tab.

   The generated file looks like this:

   ```json
   {
     "photos": [
       "001.jpg",
       "002.jpg",
       "beach-2023.jpg"
     ]
   }
   ```

   If you edit `photos.json` by hand, the next photo push overwrites it.

Tips:

- **Formats:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`. iPhone **HEIC** files
  don't display in most browsers, so export them as JPG first.
- **Size:** photos are shown exactly as they are, never cropped or edited. Phone photos
  can be 4–8 MB each, though. For fast mobile loading you can make *resized copies*
  (about 1600 px on the long edge) and keep the originals in a git-ignored `originals/`
  folder. For example, with ImageMagick: `mogrify -resize 1600x1600\> -quality 85 assets/photos/*.jpg`.
  Run it on copies, never on your only originals.
- Filenames with spaces work, but simple names like `001.jpg` are safest.
- Only the current photo and its neighbours are loaded.
- A photo that fails to load shows a joke placeholder instead of a broken image.
- If the list is empty, the screen shows a "No photographic evidence found" message
  and the experiment continues.
- ⚠️ The repo and site are **public**. Only add photos you are happy to publish.

---

## 3. Test locally

ES modules don't load from `file://`, so use a small local server:

```bash
cd phd-friendship-defense
python3 -m http.server 8000
```

Then open these on your computer, or on your phone on the same Wi-Fi via your
computer's IP address:

| URL | What it tests |
|-----|---------------|
| `http://localhost:8000/#token=FAKE-demo-7Hx2-not-real` | Full flow with a valid fake token |
| `http://localhost:8000/` | No token: screen 1 shows "Not detected" and the money shows a friendly error |
| `http://localhost:8000/#token=bad%20token!` | Invalid token: friendly error, nothing opens |

**Developer shortcut (localhost only):** add `&screen=N` to jump straight to a screen,
for example `http://localhost:8000/#token=FAKE-demo-7Hx2-not-real&screen=5`. This is
switched off on any other host, including GitHub Pages.

With the example config, tapping money opens
`https://gift-provider.example/redeem/FAKE-demo-7Hx2-not-real`. That domain doesn't
exist, but the new tab's address bar shows that the link was built correctly.

To test on a phone in Chrome DevTools, use device mode (e.g. iPhone 12/13, 390 × 844).
To check reduced motion, use DevTools → Rendering → *Emulate prefers-reduced-motion*.

---

## 4. Deploy to GitHub Pages

1. Create a new GitHub repository, for example `phd-defense`. Public is required for
   free GitHub Pages.
2. Push this folder:

   ```bash
   git add .
   git commit -m "The Final Defense"
   git branch -M main
   git remote add origin https://github.com/USERNAME/phd-defense.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages → Build and deployment**:
   *Source:* **Deploy from a branch**, *Branch:* **main**, folder **/ (root)**. Save.
4. After a minute the site is at `https://USERNAME.github.io/phd-defense/`.
5. Open it with a fake token and run through all five screens on your phone:
   `https://USERNAME.github.io/phd-defense/#token=FAKE-demo-7Hx2-not-real`

---

## 5. Make the postcard QR code

The QR code must contain your Pages URL with the real token in the **fragment** (after `#`):

```
https://USERNAME.github.io/REPO/#token=SECRET_VALUE
```

Example with a **fake** token:

```
https://USERNAME.github.io/phd-defense/#token=FAKE-demo-7Hx2-not-real
```

- Make the QR code **on your own computer**, not with an online QR website, so the
  token isn't sent to a third party. Use the included Python script:

  ```bash
  pip install "qrcode[pil]"   # once
  python3 tools/make_qr.py https://USERNAME.github.io/phd-defense/
  ```

  It asks for the token (input hidden), adds `#token=…` to the URL, and saves
  `qr-postcard.png`. Options:

  | Option | What it does |
  |--------|--------------|
  | `-o qr-postcard.svg` | Output file. Use `.svg` for sharp printing at any size. Keep the `qr-` prefix so `.gitignore` excludes it. |
  | `--box-size 30` | Pixels per QR square in the PNG (default 20). Bigger means a larger image. |
  | `--show-url` | Prints the full URL including the token, so you can check it. Careful: it shows on screen. |

  The script percent-encodes the token, rejects non-`https` site URLs, and warns if
  the token doesn't match `tokenPattern` in `js/config.js`.

  Alternatively, with `qrencode`:
  `qrencode -o qr-postcard.png "https://USERNAME.github.io/phd-defense/#token=SECRET_VALUE"`
  (`qr-*.png` is already in `.gitignore`.)
- If the token has characters like `+`, `&`, `#`, `%` or spaces, they must be
  percent-encoded in the URL (`+` → `%2B`). The script does this for you. Also check
  that `tokenPattern` allows them.
- Before printing, scan the code with your phone and run the whole flow once. Then
  start again from a fresh scan, because reloading forgets the token.

---

## Security notes (please read)

- **This is not real authentication.** Anyone who has the QR URL, or sees or
  photographs the postcard, has the token. Treat the postcard like the gift itself.
- **The token never goes to GitHub.** Browsers don't send the URL fragment
  (`#token=…`) to the server, so it isn't in GitHub's request logs. It is also never
  written to the repository.
- **Memory only.** The token is read once on page load with
  `new URLSearchParams(location.hash.slice(1))` and kept in a JavaScript variable in
  `js/gift.js`, so it survives all five screens. It is never written to
  `localStorage`, `sessionStorage` or cookies, never logged, and never sent to any
  API or analytics. The site has no analytics.
- **Removed from the address bar** (when `removeTokenFromAddressBar: true`). This keeps
  it out of browser history and screenshots. The trade-off: **reloading the page
  forgets the token**. The friend just scans the postcard again; the final screen
  explains this if it happens.
- **Validated link.** At click time, `{token}` in the template is replaced with
  `encodeURIComponent(token)`. The result is parsed, and must be `https:`, must stay on
  the template's own host (the token can't change where the link goes), and must have
  no embedded credentials. If anything fails, a friendly error is shown and nothing
  opens. Double-check the template's domain yourself, because a typo there would
  still pass these checks.
- **No referrer.** The link opens in a new tab with `rel="noopener noreferrer"` and
  `referrerpolicy="no-referrer"`, and the page also sets
  `<meta name="referrer" content="no-referrer">`.
- **Public site.** GitHub Pages sites and their repositories are public. The page sets
  `noindex, nofollow`, but that isn't access control.
- **Secrets stay out of git.** `.gitignore` excludes common secret and QR filenames. Run
  `git grep -n "YOUR_REAL_TOKEN"` before pushing to be sure.

---

## Editing content

- **Screen text, metrics, log lines:** `index.html`. Each screen is a clearly commented
  `<section>`. Metric values are the `data-value="99"` attributes.
- **Quiz questions, answers and feedback:** the `QUESTIONS` array at the top of
  `js/quiz.js`. Mark right answers with `correct: true`. Each option has its own
  message. A wrong pick only disables that option and shows its message (the answer
  is never revealed), so keep wrong-answer messages from giving it away.
- **Log timestamps:** `LOG_TIMES` in `js/app.js`.
- **Overlay messages before the finale:** `OVERLAY_STEPS` in `js/app.js`.
- **Colours and fonts:** CSS variables at the top of `css/style.css`.

## Accessibility

- All controls are real `<button>`s with visible focus rings and work with Tab,
  Enter and Space.
- Focus moves to each new screen's heading. Quiz feedback, the research log and the
  photo counter are announced to screen readers.
- Every flying bill is a labelled, focusable button. A bill pauses while it has
  keyboard focus or the mouse is over it. A "Pause the money" toggle and a
  "Collect it here" button are there for anyone who can't catch a moving target.
- `prefers-reduced-motion` turns off confetti and bubbles, shortens transitions, and
  parks the money along the screen edges instead of flying.

## Credits

Fonts: [Space Grotesk](https://github.com/floriankarsten/space-grotesk),
[JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) and
[Anton](https://github.com/googlefonts/AntonFont), all under the SIL Open Font
License 1.1. All graphics are inline SVG/CSS made for this project. No stock or AI
images are used.
