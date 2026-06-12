import os
from flask import Blueprint, jsonify, request
from services.imdb_service import MovieAPIService
from services.igdb_service import IGDBService
from services.jikan_service import JikanService
from services.medias_service import MediasService

search_bp = Blueprint('search', __name__)

movie_api = MovieAPIService()
game_api = IGDBService(
    client_id=os.environ.get("IGDB_CLIENT_ID", "zwcdup9a4vx2kxwrid419vvr9a3wa7"),
    client_secret=os.environ.get("IGDB_CLIENT_SECRET", "elnk2o013f4tjcov0ag7p1wzweosbn"),
)
anime_api = JikanService()
manga_api = JikanService()
medias_service = MediasService()


@search_bp.route('/', methods=['GET'])
@search_bp.route('/movies', methods=['GET'])
def search_movies():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Missing search query parameter"}), 400

    results = movie_api.search_movies(q)
    return jsonify(results)


@search_bp.route('/games', methods=['GET'])
def search_games():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Missing search query parameter"}), 400

    limit = request.args.get('limit', 10, type=int)
    results = game_api.search_games(q, limit=limit)
    return jsonify(results)


@search_bp.route('/games/<int:game_id>', methods=['GET'])
def get_game_details(game_id):
    details = game_api.get_game_details(game_id)
    if details is None:
        return jsonify({"error": "Game not found"}), 404
    return jsonify(details)


@search_bp.route('/tv', methods=['GET'])
def search_tv_shows():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Missing search query parameter"}), 400

    results = movie_api.search_tv_shows(q)
    return jsonify(results)


@search_bp.route('/tv/<int:tv_id>', methods=['GET'])
def get_tv_show_with_seasons(tv_id):
    results = movie_api.get_tv_show_with_seasons(tv_id)
    if not results:
        return jsonify({"error": "TV show not found"}), 404
    return jsonify(results)


@search_bp.route('/anime', methods=['GET'])
def search_anime():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Missing search query parameter"}), 400

    exclude_movies = request.args.get('exclude_movies', 'true').lower() == 'true'
    results = anime_api.search_anime(q, exclude_movies=exclude_movies)
    return jsonify(results)


@search_bp.route('/anime/<int:anime_id>', methods=['GET'])
def get_anime_details(anime_id):
    details = anime_api.get_anime_full(anime_id)
    if details is None:
        return jsonify({"error": "Anime not found"}), 404
    return jsonify(details)


@search_bp.route('/manga', methods=['GET'])
def search_manga():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Missing search query parameter"}), 400

    results = manga_api.search_manga(q)
    return jsonify(results)


@search_bp.route('/manga/<int:manga_id>', methods=['GET'])
def get_manga_details(manga_id):
    details = manga_api.get_manga_full(manga_id)
    if details is None:
        return jsonify({"error": "Manga not found"}), 404
    return jsonify(details)


@search_bp.route('/anime/season/<int:year>/<string:season>', methods=['GET'])
def get_season_anime(year, season):
    results = anime_api.get_season(year, season)
    return jsonify(results)


@search_bp.route('/anime/season/current', methods=['GET'])
def get_current_season_anime():
    results = anime_api.get_current_season()
    return jsonify(results)


@search_bp.route('/deep', methods=['GET'])
def deep_search():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Missing search query parameter"}), 400

    results = medias_service.deep_search_medias(
        q,
        movie_api=movie_api,
        game_api=game_api,
        anime_api=anime_api,
        manga_api=manga_api,
    )
    return jsonify(results)
