from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from utils.validators import verify_valid_username, verify_valid_email, verify_valid_password

# On l'appelle auth_bp, ce sera notre auth_router
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    # 1. Validation des formats
    try:
        verify_valid_username(username)
        verify_valid_email(email)
        verify_valid_password(password)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # 2. Appel au Service pour la logique métier
    try:
        AuthService.register_user(username, email, password)
        return jsonify({"message": "User registered successfully!"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    # Appel au Service pour vérifier les identifiants et générer le token
    try:
        result = AuthService.login_user(email, password)
        return jsonify({
            "message": "Login successful!",
            "access_token": result["access_token"],
            "user": result["user"]
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401 # 401 pour Unauthorized
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500