from flask import Blueprint, jsonify, request
from services.showcases_service import ShowcasesService

showcases_bp = Blueprint('showcases', __name__)
service = ShowcasesService()


@showcases_bp.route('/<username>/showcases', methods=['POST'])
def create_showcase(username):
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    result = service.create_showcase(username, payload)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'title_required':
        return jsonify({'error': 'title is required'}), 400
    if result == 'invalid_showcase_type':
        return jsonify({'error': 'showcase_type must be "list" or "review"'}), 400

    return jsonify(result), 201


@showcases_bp.route('/<username>/showcases/<showcase_id>', methods=['PUT'])
def update_showcase(username, showcase_id):
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    result = service.update_showcase(username, showcase_id, payload)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'showcase_not_found':
        return jsonify({'error': 'Showcase not found'}), 404

    return jsonify(result)


@showcases_bp.route('/<username>/showcases/<showcase_id>', methods=['DELETE'])
def delete_showcase(username, showcase_id):
    result = service.delete_showcase(username, showcase_id)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404
    if result == 'showcase_not_found':
        return jsonify({'error': 'Showcase not found'}), 404

    return jsonify({'status': 'deleted'})
