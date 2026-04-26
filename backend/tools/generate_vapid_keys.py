#!/usr/bin/env python3
"""
Run this script ONCE to generate your VAPID key pair for Web Push.

  cd stock-agent/backend
  python tools/generate_vapid_keys.py

Then copy the output into your .env file.
"""

import base64
import sys


def main():
    try:
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives.asymmetric.ec import SECP256R1, generate_private_key
        from cryptography.hazmat.primitives.serialization import (
            Encoding,
            NoEncryption,
            PrivateFormat,
            PublicFormat,
        )
    except ImportError:
        sys.exit("Install cryptography first:  pip install cryptography")

    private_key = generate_private_key(SECP256R1(), default_backend())

    # PEM private key (used by pywebpush on the server)
    pem = private_key.private_bytes(
        Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()
    ).decode()
    # Strip header/footer and newlines for a single-line .env value
    pem_inline = (
        pem.replace("-----BEGIN EC PRIVATE KEY-----", "")
        .replace("-----END EC PRIVATE KEY-----", "")
        .replace("\n", "")
        .strip()
    )

    # Uncompressed public key point, base64url-encoded (for the browser)
    pub_bytes = private_key.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode()

    print("# ── paste these into backend/.env ──────────────────────────────")
    print(f"VAPID_PRIVATE_KEY={pem_inline}")
    print(f"VAPID_PUBLIC_KEY={pub_b64}")
    print("VAPID_SUBJECT=mailto:ashiqur.tuc@gmail.de")
    print()
    print("# pywebpush decodes the inline base64 key back to PEM internally.")
    print("# Never share VAPID_PRIVATE_KEY — treat it like a password.")


if __name__ == "__main__":
    main()
