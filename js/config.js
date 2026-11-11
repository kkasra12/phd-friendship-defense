/**
 * ============================================================
 *  SITE CONFIGURATION — edit this file before deploying.
 * ============================================================
 *
 *  ⚠️  NEVER put the real gift token (or a complete redemption URL
 *      that contains it) in this file or anywhere in the repository.
 *      The token only arrives at runtime via the postcard QR code:
 *
 *        https://USERNAME.github.io/REPO/#token=SECRET_VALUE
 *
 *      The part after "#" is never sent to GitHub's servers.
 */
export const CONFIG = Object.freeze({
  /**
   * Optional: the friend's name, shown in the lab console and the grant
   * certificate. Leave empty ('') to just use "Doctor".
   * Example: 'Dr. Alex Example'
   */
  doctorName: '',

  /**
   * Public redemption URL TEMPLATE from your gift provider.
   * "{token}" is replaced at click time with encodeURIComponent(token).
   * This is a fake example domain — replace it with the provider's real one.
   */
  redemptionUrlTemplate: 'https://gift-provider.example/redeem/{token}',

  /** Name of the fragment parameter that carries the token (#token=...). */
  tokenParam: 'token',

  /**
   * Basic sanity check for the token before building the URL.
   * Adjust if your provider's codes contain other characters.
   */
  tokenPattern: /^[A-Za-z0-9._~-]{4,256}$/,

  /**
   * After reading the token, remove it from the address bar (it stays in
   * memory only). Keeps it out of browser history and accidental screenshots.
   * Trade-off: reloading the page forgets the token → rescan the QR code.
   */
  removeTokenFromAddressBar: true,

  /** Photo slideshow sources (relative paths → work on a GitHub Pages subpath). */
  photosManifest: 'assets/photos.json',
  photosDirectory: 'assets/photos/',

  /** How many clickable flying money emojis to show on the final screen. */
  moneyCount: 2,
});
