import jwt
import hashlib
import bcrypt
from datetime import datetime, timedelta, timezone

# Tu peux personnaliser ces clés secrètes
SECRET_KEY = "ma_super_cle_secrete_jwt_123!"
ALGORITHM = "HS256"
SALT = "mon_salt_secret_pour_les_mots_de_passe_xyz"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verify a password against a stored hash.
    Supports migration from old SHA256 hashes: if bcrypt verification fails,
    falls back to old SHA256+SALT method, and returns True if it matches.
    (The caller should then re-hash with bcrypt.)
    """
    # Try bcrypt first
    try:
        if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return True
    except ValueError:
        pass  # Not a valid bcrypt hash, try legacy
    
    # Fallback: legacy SHA256 + SALT
    legacy_hash = hashlib.sha256((password + SALT).encode()).hexdigest()
    return legacy_hash == stored_hash

def is_legacy_hash(stored_hash: str) -> bool:
    """Check if a stored hash is a legacy SHA256 hash (not bcrypt)."""
    return not stored_hash.startswith('$2')