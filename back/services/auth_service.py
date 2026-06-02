import uuid
from schemas.db import db
from schemas.models import User
from utils.auth import hash_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(username, email, password):
        # Vérifier si l'email ou le username existe déjà
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already registered")
        if User.query.filter_by(username=username).first():
            raise ValueError("Username already taken")

        # Hacher le mot de passe et générer l'ID unique
        hashed = hash_password(password)
        generated_user_id = f"usr_{uuid.uuid4().hex[:12]}"

        # Créer le modèle
        new_user = User(
            id=generated_user_id,
            username=username,
            email=email,
            password_hash=hashed
        )

        db.session.add(new_user)
        db.session.commit()
        return new_user

    @staticmethod
    def login_user(email, password):
        # Chercher l'utilisateur
        user = User.query.filter_by(email=email).first()
        if not user:
            raise ValueError("Invalid email or password")

        # Vérifier le mot de passe
        if user.password_hash != hash_password(password):
            raise ValueError("Invalid email or password")

        # Générer le jeton JWT
        token = create_access_token(data={"sub": user.id, "email": user.email})
        
        return {
            "access_token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }