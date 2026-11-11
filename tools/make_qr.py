#!/usr/bin/env python3
"""
Make the postcard QR code for The Final Defense site.

The QR code holds your site URL with the gift token in the fragment:

    https://USERNAME.github.io/REPO/#token=SECRET_VALUE

The token is asked for interactively (input hidden) so it doesn't end up in
your shell history. Everything runs on your own computer; nothing is sent
anywhere.

Install the dependency once:

    pip install "qrcode[pil]"

Usage:

    python3 tools/make_qr.py https://USERNAME.github.io/REPO/
    python3 tools/make_qr.py https://USERNAME.github.io/REPO/ -o qr-postcard.svg

The output file name should start with "qr-" so .gitignore keeps it out of git.
"""

import argparse
import getpass
import re
import sys
from urllib.parse import quote, urlsplit

try:
    import qrcode
    import qrcode.image.svg
    from qrcode.constants import ERROR_CORRECT_M
except ImportError:
    sys.exit('Missing dependency. Install it with:  pip install "qrcode[pil]"')

# Keep in sync with tokenPattern in js/config.js.
TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9._~-]{4,256}$")


def build_url(site_url: str, token: str, param: str = "token") -> str:
    parts = urlsplit(site_url)
    if parts.scheme != "https" or not parts.netloc:
        raise ValueError("The site URL must start with https://")
    if parts.fragment:
        raise ValueError("The site URL must not already contain a '#...' part")
    base = site_url if site_url.endswith("/") or parts.query else site_url + "/"
    # Percent-encode everything (e.g. '+' -> '%2B'), since the page reads the
    # fragment with URLSearchParams, which would turn a bare '+' into a space.
    return f"{base}#{param}={quote(token, safe='')}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Make the postcard QR code.")
    parser.add_argument("site_url", help="Your GitHub Pages URL, e.g. https://USERNAME.github.io/REPO/")
    parser.add_argument("-o", "--output", default="qr-postcard.png",
                        help="Output file, .png or .svg (default: qr-postcard.png)")
    parser.add_argument("--box-size", type=int, default=20, help="Pixels per QR module for PNG (default: 20)")
    parser.add_argument("--show-url", action="store_true",
                        help="Print the full URL including the token (careful: it shows on screen)")
    args = parser.parse_args()

    token = getpass.getpass("Gift token (input hidden): ").strip()
    if not token:
        sys.exit("No token entered.")
    if not TOKEN_PATTERN.fullmatch(token):
        print("Warning: this token doesn't match tokenPattern in js/config.js, so the site "
              "will reject it. Widen tokenPattern in both places if the token is correct.",
              file=sys.stderr)

    try:
        url = build_url(args.site_url, token)
    except ValueError as err:
        sys.exit(f"Error: {err}")

    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=args.box_size, border=4)
    qr.add_data(url)
    qr.make(fit=True)

    if args.output.lower().endswith(".svg"):
        img =qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    else:
        img = qr.make_image(fill_color="black", back_color="white")
    img.save(args.output)

    if not args.output.split("/")[-1].startswith("qr-"):
        print("Note: the file name doesn't start with 'qr-', so .gitignore won't ignore it. "
              "Don't commit it.", file=sys.stderr)

    print(f"Saved {args.output}  (QR version {qr.version})")
    if args.show_url:
        print(url)
    else:
        print(url.split("#", 1)[0] + "#token=" + "*" * 8 + "  (use --show-url to print the full URL)")


if __name__ == "__main__":
    main()
