import uuid
import urllib.parse
from typing import TypedDict

from schemas.db import db
from schemas.models import User
from utils.auth import hash_password, verify_password, is_legacy_hash, create_access_token


class UserDict(TypedDict):
    id: str
    username: str
    email: str
    bio: str | None
    avatar_url: str | None
    created_at: str | None


class LoginResponseDict(TypedDict):
    access_token: str
    user: UserDict


class AuthService:
    @staticmethod
    def register_user(username: str, email: str, password: str) -> User:
        # Vérifier si l'email ou le username existe déjà
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already registered")
        if User.query.filter_by(username=username).first():
            raise ValueError("Username already taken")

        # Hacher le mot de passe et générer l'ID unique
        hashed = hash_password(password)
        generated_user_id = f"usr_{uuid.uuid4().hex[:12]}"
        avatar_url = f"https://api.dicebear.com/7.x/bottts-neutral/svg?seed={urllib.parse.quote(username)}"

        # Créer le modèle
        new_user = User(
            id=generated_user_id,
            username=username,
            email=email,
            password_hash=hashed,
            avatar_url=avatar_url
        )

        db.session.add(new_user)
        db.session.commit()
        return new_user

    @staticmethod
    def login_user(email: str, password: str) -> LoginResponseDict:
        # Chercher l'utilisateur
        user = User.query.filter_by(email=email).first()
        if not user:
            raise ValueError("Invalid email or password")

        # Vérifier le mot de passe (with legacy SHA256 fallback)
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        # Auto-migrate: if the stored hash is legacy SHA256, re-hash with bcrypt
        if is_legacy_hash(user.password_hash):
            user.password_hash = hash_password(password)
            db.session.commit()

        # Générer le jeton JWT
        token = create_access_token(data={"sub": user.id, "email": user.email})

        return {
            "access_token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }