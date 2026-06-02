import jwt
import hashlib
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
    password = password + SALT
    return hashlib.sha256(password.encode()).hexdigest()