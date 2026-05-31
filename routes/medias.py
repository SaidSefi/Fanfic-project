from flask import Blueprint, jsonify, request
from services.medias_service import MediasService

medias_bp = Blueprint('medias', __name__)
service = MediasService()


@medias_bp.route('/<media_id>', methods=['GET'])
def get_media(media_id):
    media = service.get_media(media_id)
    if media is None:
        return jsonify({'error': 'Media not found'}), 404
    return jsonify(media)


@medias_bp.route('/<media_id>/reviews', methods=['GET'])
def get_media_reviews(media_id):
    reviews = service.get_media_reviews(media_id)
    if reviews is None:
        return jsonify({'error': 'Media not found'}), 404
    return jsonify(reviews)


@medias_bp.route('/<media_id>/type', methods=['GET'])
def get_media_type(media_id):
    media_type = service.get_media_type(media_id)
    if media_type is None:
        return jsonify({'error': 'Media not found'}), 404
    return jsonify(media_type)


@medias_bp.route('/<media_id>/related', methods=['GET'])
def get_media_related(media_id):
    related = service.get_media_related(media_id)
    if related is None:
        return jsonify({'error': 'Media not found'}), 404
    return jsonify(related)


@medias_bp.route('/<media_id>/relation-type', methods=['GET'])
def get_media_relation_type(media_id):
    relation_type = service.get_media_relation_type(media_id)
    if relation_type is None:
        return jsonify({'error': 'Media not found'}), 404
    return jsonify(relation_type)


@medias_bp.route('', methods=['GET'])
def get_medias():
    ids = request.args.get('ids')
    genre = request.args.get('genre')
    year = request.args.get('year')
    popularity = request.args.get('popularity')
    rating = request.args.get('rating')

    ids_list = [media_id.strip() for media_id in ids.split(',')] if ids else None
    medias = service.get_medias(ids_list, genre, year, popularity, rating)
    return jsonify(medias)


@medias_bp.route('/search', methods=['GET'])
def search_medias():
    query_text = request.args.get('q')
    if not query_text:
        return jsonify({'error': 'q is required'}), 400

    medias = service.search_medias(query_text)
    return jsonify(medias)


@medias_bp.route('/<media_id>/reviews', methods=['POST'])
def add_media_review(media_id):
    payload = request.get_json(silent=True)
    if not payload or 'username' not in payload or 'review_text' not in payload:
        return jsonify({'error': 'username and review_text are required'}), 400

    result = service.add_media_review(media_id, payload)
    if result == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404

    return jsonify(result), 201


@medias_bp.route('/<media_id>/library', methods=['POST'])
def add_media_to_library(media_id):
    payload = request.get_json(silent=True)
    if not payload or 'username' not in payload:
        return jsonify({'error': 'username is required'}), 400

    result = service.add_media_to_library(media_id, payload)
    if result == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404

    return jsonify(result), 201


@medias_bp.route('/<media_id>/library', methods=['PUT'])
def update_media_library(media_id):
    payload = request.get_json(silent=True)
    if not payload or 'username' not in payload:
        return jsonify({'error': 'username is required'}), 400

    result = service.update_media_library(media_id, payload)
    if result == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404

    return jsonify(result)


@medias_bp.route('/<media_id>/reviews', methods=['DELETE'])
def delete_media_review(media_id):
    payload = request.get_json(silent=True)
    if not payload or 'username' not in payload:
        return jsonify({'error': 'username is required'}), 400

    result = service.delete_media_review(media_id, payload['username'])
    if result == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'review_not_found':
        return jsonify({'error': 'Review not found'}), 404

    return jsonify({'status': 'deleted'})
