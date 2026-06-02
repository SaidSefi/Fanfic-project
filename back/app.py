from flask import Flask
from flask_migrate import Migrate
from schemas.db import db

from schemas.models import User, Friend, MediaRelationType, RelatedMedia, MediaType, Media, UserMedia, UserMediaLike, CustomList, ListItem, UserTopItem
from routes import api_bp
from flask import jsonify, request
from services.imdb_service import MovieAPIService
from routes.auth import auth_bp


movie_api = MovieAPIService()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fanfic.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    Migrate(app, db)
    app.register_blueprint(api_bp, url_prefix='/api')

    app.register_blueprint(auth_bp)

    return app


app = create_app()


@app.route('/api/search', methods=['GET'])
def search_media():
    search_query = request.args.get('q', '')
    if not search_query:
        return jsonify({"error": "Missing search query parameter"}), 400
        
    
    search_results = movie_api.search_movies(search_query)
    return jsonify(search_results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)