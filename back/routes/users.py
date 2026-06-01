from flask import Blueprint, jsonify, request
from schemas.models import User
from services.users_service import UsersService
import uuid
from schemas.db import db

from utils.validators import (
    verify_valid_username,
    verify_valid_email,
    verify_valid_password
)

from utils.auth import (
    hash_password,
    create_access_token
)

users_bp = Blueprint('users', __name__)
service = UsersService()


@users_bp.route('/<username>', methods=['GET'])
def get_user_profile(username):
    profile = service.get_user_profile(username)
    if not profile:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(profile)


@users_bp.route('/<username>', methods=['PUT'])
def update_user_profile(username):
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    updated = service.update_user_profile(username, payload)
    if updated is None:
        return jsonify({'error': 'User not found'}), 404
    if updated == 'username_taken':
        return jsonify({'error': 'Username already in use'}), 409

    return jsonify(updated)


@users_bp.route('/<username>/top-medias', methods=['GET'])
def get_user_top_medias(username):
    top_medias = service.get_user_top_medias(username)
    if top_medias is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(top_medias)


@users_bp.route('/<username>/friends', methods=['GET'])
def get_user_friends(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    friends = service.get_friends(user.id)
    if friends is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(friends)


@users_bp.route('/<username>/friends', methods=['POST'])
def add_friend(username):
    payload = request.get_json(silent=True)
    if not payload or 'friend_username' not in payload:
        return jsonify({'error': 'friend_username is required'}), 400

    result = service.add_friend(username, payload['friend_username'])
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'self_friend':
        return jsonify({'error': 'Cannot add yourself as a friend'}), 400
    if result == 'already_requested':
        return jsonify({'error': 'Friend request already sent'}), 409
    if result == 'already_friends':
        return jsonify({'error': 'Users are already friends'}), 409
    if isinstance(result, dict) and result.get('status') == 'incoming_request_exists':
        return jsonify(result), 409

    return jsonify(result), 201


@users_bp.route('/<username>/friends/<friend_username>', methods=['DELETE'])
def remove_friend(username, friend_username):
    result = service.remove_friend(username, friend_username)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'friend_not_found':
        return jsonify({'error': 'Friend not found'}), 404

    return jsonify({'status': 'removed'})


@users_bp.route('/<username>/friend-requests', methods=['GET'])
def get_friend_requests(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    requests_data = service.get_friend_requests(user.id)
    if requests_data is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(requests_data)


@users_bp.route('/<username>/friend-requests/<request_id>/accept', methods=['POST'])
def accept_friend_request(username, request_id):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    result = service.accept_friend_request(user.id, request_id)
    if result == 'request_not_found':
        return jsonify({'error': 'Friend request not found'}), 404
    if result == 'not_allowed':
        return jsonify({'error': 'Not allowed'}), 403

    return jsonify(result)


@users_bp.route('/<username>/friend-requests/<request_id>/refuse', methods=['POST'])
def refuse_friend_request(username, request_id):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    result = service.refuse_friend_request(user.id, request_id)
    if result == 'request_not_found':
        return jsonify({'error': 'Friend request not found'}), 404

    return jsonify({'status': 'refused'})



# auth setup

@users_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON data"}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    # Validation via tes fonctions dans utils/validators.py
    try:
        verify_valid_username(username)
        verify_valid_email(email)
        verify_valid_password(password)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # Vérification des doublons
    existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        return jsonify({"error": "Username or Email already registered"}), 400

    # Hachage et ID unique
    hashed_pwd = hash_password(password)
    generated_user_id = f"usr_{uuid.uuid4().hex[:12]}"

    new_user = User(
        id=generated_user_id,
        username=username,
        email=email,
        password_hash=hashed_pwd,
        bio="Hello! J'utilise le tracker de médias.",
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "message": "User registered successfully!",
            "user": {"id": new_user.id, "username": new_user.username, "email": new_user.email}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500


# ROUTE : LA CONNEXION (LOGIN)
@users_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON data"}), 400
    
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Please provide both email and password"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user.password_hash != hash_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token_payload = {"user_id": user.id, "username": user.username}
    token = create_access_token(data=token_payload)

    return jsonify({
        "message": "Login successful!",
        "access_token": token,
        "user": {"id": user.id, "username": user.username}
    }), 200