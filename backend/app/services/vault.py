"""
Encrypted document vault.

Every file is encrypted at rest with AES-256-GCM (envelope: a per-file random
data key encrypts the bytes; the data key is wrapped with the master key derived
from SECRET_KEY). The SHA-256 of the *plaintext* is what enters the custody chain.
"""
import hashlib
import os
import secrets
from pathlib import Path
from typing import Dict, Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from ..core.config import settings


class DocumentVault:
    def __init__(self, root: str):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        # 256-bit master key derived from the configured secret
        self._master = hashlib.sha256(f"CHRONICLE-VAULT:{settings.SECRET_KEY}".encode()).digest()

    @staticmethod
    def sha256(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    def _case_dir(self, case_id: str) -> Path:
        d = self.root / case_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def store(self, case_id: str, document_id: str, data: bytes) -> Dict[str, Any]:
        """Encrypts and writes the file. Returns path + plaintext sha256."""
        data_key = AESGCM.generate_key(bit_length=256)
        nonce = secrets.token_bytes(12)
        ciphertext = AESGCM(data_key).encrypt(nonce, data, document_id.encode())

        wrap_nonce = secrets.token_bytes(12)
        wrapped_key = AESGCM(self._master).encrypt(wrap_nonce, data_key, b"CHRONICLE-DEK")

        # layout: [12 wrap_nonce][60 wrapped_key (32+16 tag... = 48)][12 nonce][ciphertext]
        blob = wrap_nonce + wrapped_key + nonce + ciphertext
        path = self._case_dir(case_id) / f"{document_id}.enc"
        path.write_bytes(blob)
        return {"path": str(path.relative_to(self.root)), "sha256": self.sha256(data), "size": len(data)}

    def load(self, rel_path: str, document_id: str) -> bytes:
        blob = (self.root / rel_path).read_bytes()
        wrap_nonce, wrapped_key = blob[:12], blob[12:60]
        nonce, ciphertext = blob[60:72], blob[72:]
        data_key = AESGCM(self._master).decrypt(wrap_nonce, wrapped_key, b"CHRONICLE-DEK")
        return AESGCM(data_key).decrypt(nonce, ciphertext, document_id.encode())

    def exists(self, rel_path: str) -> bool:
        return (self.root / rel_path).exists()


vault = DocumentVault(settings.VAULT_DIR)
