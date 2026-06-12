from flask import Blueprint, jsonify, request
from services.users_service import UsersService

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

