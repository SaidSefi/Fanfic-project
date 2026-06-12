from flask import Blueprint, jsonify
from routes.users import users_bp
from routes.user_medias import user_medias_bp
from routes.lists import lists_bp
from routes.medias import medias_bp
from routes.friends import friends_bp
from routes.tops import tops_bp
from routes.search import search_bp
from routes.showcases import showcases_bp

api_bp = Blueprint('api', __name__)


@api_bp.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'ok',
        'message': 'Fanfic API is ready'
    })


# Register sub-blueprints with URL prefixes
api_bp.register_blueprint(users_bp, url_prefix='/users')
api_bp.register_blueprint(friends_bp, url_prefix='/users')
api_bp.register_blueprint(tops_bp, url_prefix='/users')
api_bp.register_blueprint(user_medias_bp, url_prefix='/users')
api_bp.register_blueprint(lists_bp, url_prefix='')
api_bp.register_blueprint(medias_bp, url_prefix='/medias')
api_bp.register_blueprint(search_bp, url_prefix='/search')
api_bp.register_blueprint(showcases_bp, url_prefix='/users')
