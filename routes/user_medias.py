from flask import Blueprint, jsonify, request
from services.user_medias_service import UserMediasService

user_medias_bp = Blueprint('user_medias', __name__)
service = UserMediasService()


@user_medias_bp.route('/<user_id>/medias', methods=['GET'])
def get_user_medias(user_id):
    status_filter = request.args.get('status')
    medias = service.get_user_medias(user_id, status_filter)
    if medias is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(medias)


@user_medias_bp.route('/<user_id>/medias/<media_id>', methods=['GET'])
def get_user_media_detail(user_id, media_id):
    user_media = service.get_user_media(user_id, media_id)
    if user_media is None:
        return jsonify({'error': 'User media not found'}), 404
    return jsonify(user_media)


@user_medias_bp.route('/<user_id>/medias/<media_id>/review', methods=['GET'])
def get_user_media_review(user_id, media_id):
    review = service.get_user_media_review(user_id, media_id)
    if review == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if review == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if review is None:
        return jsonify({'error': 'No review found'}), 404
    return jsonify(review)


@user_medias_bp.route('/<user_id>/medias/<media_id>', methods=['PUT'])
def update_user_media(user_id, media_id):
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    result = service.update_user_media(user_id, media_id, payload)
    if result == 'user_media_not_found':
        return jsonify({'error': 'User media not found'}), 404

    return jsonify(result)


@user_medias_bp.route('/<user_id>/medias/<media_id>', methods=['DELETE'])
def delete_user_media(user_id, media_id):
    result = service.delete_user_media(user_id, media_id)
    if result == 'user_media_not_found':
        return jsonify({'error': 'User media not found'}), 404

    return jsonify({'status': 'deleted'})
