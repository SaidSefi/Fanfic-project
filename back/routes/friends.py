from flask import Blueprint, jsonify, request
from schemas.models import User
from services.friends_service import FriendsService

friends_bp = Blueprint('friends', __name__)
service = FriendsService()


@friends_bp.route('/<username>/friends', methods=['GET'])
def get_user_friends(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    friends = service.get_friends(user.id)
    if friends is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(friends)


@friends_bp.route('/<username>/friends', methods=['POST'])
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


@friends_bp.route('/<username>/friends/<friend_username>', methods=['DELETE'])
def remove_friend(username, friend_username):
    result = service.remove_friend(username, friend_username)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'friend_not_found':
        return jsonify({'error': 'Friend not found'}), 404

    return jsonify({'status': 'removed'})


@friends_bp.route('/<username>/friend-requests', methods=['GET'])
def get_friend_requests(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    requests_data = service.get_friend_requests(user.id)
    if requests_data is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(requests_data)


@friends_bp.route('/<username>/friend-requests/<request_id>/accept', methods=['POST'])
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


@friends_bp.route('/<username>/friend-requests/<request_id>/refuse', methods=['POST'])
def refuse_friend_request(username, request_id):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    result = service.refuse_friend_request(user.id, request_id)
    if result == 'request_not_found':
        return jsonify({'error': 'Friend request not found'}), 404

    return jsonify({'status': 'refused'})
