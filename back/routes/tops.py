from flask import Blueprint, jsonify, request
from services.tops_service import TopsService

tops_bp = Blueprint('tops', __name__)
service = TopsService()


@tops_bp.route('/<username>/top-medias', methods=['GET'])
def get_user_top_medias(username):
    top_medias = service.get_user_top_medias(username)
    if top_medias is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(top_medias)


@tops_bp.route('/<username>/top-medias', methods=['POST'])
def add_top_item(username):
    payload = request.get_json(silent=True)
    if not payload or 'media_id' not in payload:
        return jsonify({'error': 'media_id is required'}), 400

    result = service.add_top_item(username, payload)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if result == 'missing_media_id':
        return jsonify({'error': 'media_id is required'}), 400

    return jsonify(result), 201


@tops_bp.route('/<username>/top-medias/<item_id>', methods=['PUT'])
def update_top_item_position(username, item_id):
    payload = request.get_json(silent=True)
    if not payload or 'position' not in payload:
        return jsonify({'error': 'position is required'}), 400

    result = service.update_top_item_position(username, item_id, payload['position'])
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'item_not_found':
        return jsonify({'error': 'Top item not found'}), 404

    return jsonify(result)


@tops_bp.route('/<username>/top-medias/<item_id>', methods=['DELETE'])
def remove_top_item(username, item_id):
    result = service.remove_top_item(username, item_id)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'item_not_found':
        return jsonify({'error': 'Top item not found'}), 404

    return jsonify({'status': 'removed'})
