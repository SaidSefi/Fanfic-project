from flask import Blueprint, jsonify
from routes.users import users_bp
from routes.user_medias import user_medias_bp
from routes.lists import lists_bp
from routes.medias import medias_bp

api_bp = Blueprint('api', __name__)


@api_bp.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'ok',
        'message': 'Fanfic API is ready'
    })


# Register sub-blueprints with URL prefixes
api_bp.register_blueprint(users_bp, url_prefix='/users')
api_bp.register_blueprint(user_medias_bp, url_prefix='/users')
api_bp.register_blueprint(lists_bp, url_prefix='')
api_bp.register_blueprint(medias_bp, url_prefix='/medias')
