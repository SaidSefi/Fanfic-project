from flask import Blueprint, jsonify, request
from services.lists_service import ListsService

lists_bp = Blueprint('lists', __name__)
service = ListsService()


@lists_bp.route('/users/<user_id>/lists', methods=['GET'])
def get_user_lists(user_id):
    lists = service.get_user_lists(user_id)
    if lists is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(lists)


@lists_bp.route('/users/<user_id>/lists', methods=['POST'])
def create_list(user_id):
    payload = request.get_json(silent=True)
    if not payload or 'title' not in payload:
        return jsonify({'error': 'title is required'}), 400

    result = service.create_list(user_id, payload)
    if result == 'user_not_found':
        return jsonify({'error': 'User not found'}), 404

    return jsonify(result), 201


@lists_bp.route('/lists/<list_id>', methods=['GET'])
def get_list(list_id):
    result = service.get_list(list_id)
    if result is None:
        return jsonify({'error': 'List not found'}), 404
    return jsonify(result)


@lists_bp.route('/lists/<list_id>/items', methods=['GET'])
def get_list_items(list_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    result = service.get_list_items(list_id, page=page, per_page=per_page)
    if result is None:
        return jsonify({'error': 'List not found'}), 404
    return jsonify(result)


@lists_bp.route('/lists/<list_id>', methods=['PUT'])
def update_list(list_id):
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    result = service.update_list(list_id, payload)
    if result == 'list_not_found':
        return jsonify({'error': 'List not found'}), 404

    return jsonify(result)


@lists_bp.route('/lists/<list_id>', methods=['DELETE'])
def delete_list(list_id):
    result = service.delete_list(list_id)
    if result == 'list_not_found':
        return jsonify({'error': 'List not found'}), 404

    return jsonify({'status': 'deleted'})


@lists_bp.route('/lists/<list_id>/items', methods=['POST'])
def add_list_item(list_id):
    payload = request.get_json(silent=True)
    if not payload or 'media_id' not in payload:
        return jsonify({'error': 'media_id is required'}), 400

    result = service.add_list_item(list_id, payload)
    if result == 'list_not_found':
        return jsonify({'error': 'List not found'}), 404
    if result == 'media_not_found':
        return jsonify({'error': 'Media not found'}), 404
    if result == 'missing_media_id':
        return jsonify({'error': 'media_id is required'}), 400

    return jsonify(result), 201


@lists_bp.route('/lists/<list_id>/items/<item_id>', methods=['PUT'])
def update_list_item_position(list_id, item_id):
    payload = request.get_json(silent=True)
    if not payload or 'position' not in payload:
        return jsonify({'error': 'position is required'}), 400

    result = service.update_list_item_position(list_id, item_id, payload['position'])
    if result == 'list_not_found':
        return jsonify({'error': 'List not found'}), 404
    if result == 'item_not_found':
        return jsonify({'error': 'List item not found'}), 404

    return jsonify(result)


@lists_bp.route('/lists/<list_id>/items/<item_id>', methods=['DELETE'])
def remove_list_item(list_id, item_id):
    result = service.remove_list_item(list_id, item_id)
    if result == 'list_not_found':
        return jsonify({'error': 'List not found'}), 404
    if result == 'item_not_found':
        return jsonify({'error': 'List item not found'}), 404

    return jsonify({'status': 'removed'})

