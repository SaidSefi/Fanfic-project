import os
from datetime import datetime
from flask import Flask, render_template_string, request, redirect, url_for

# Import your core app elements
from app import app
from schemas.db import db
from schemas.models import Media, MediaType, RelatedMedia, MediaRelationType

# IMPORT YOUR OWN SERVICE HERE
from services.imdb_service import MovieAPIService

# Instantiate the service layer
movie_api = MovieAPIService()

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Isolated Media API Test Layer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background-color: #14181c; color: #c8d4e0; }
        h2 { color: #fff; margin-bottom: 5px; }
        .subtitle { color: #667788; margin-bottom: 30px; font-size: 14px; }
        .search-box { display: flex; gap: 10px; margin-bottom: 30px; }
        input[type="text"] { flex: 1; padding: 12px; border-radius: 4px; border: 1px solid #445566; background: #2c3440; color: #fff; font-size: 16px; }
        button { padding: 12px 24px; border: none; border-radius: 4px; background-color: #00b020; color: white; font-weight: bold; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #008f1a; }
        .movie-card { display: flex; gap: 20px; background: #1c252d; padding: 15px; margin-bottom: 15px; border-radius: 4px; border: 1px solid #24303c; }
        .movie-card img { width: 100px; height: 150px; object-fit: cover; background-color: #2c3440; border-radius: 4px; }
        .movie-info { flex: 1; }
        .movie-title { font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 5px; }
        .movie-meta { font-size: 14px; color: #9ab0c1; margin-bottom: 10px; }
        .add-btn { background-color: #40bc9c; margin-top: 10px; padding: 8px 16px; font-size: 14px; }
        .add-btn:hover { background-color: #33967d; }
        .alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; background-color: #24303c; color: #40bc9c; border: 1px solid #40bc9c; }
    </style>
</head>
<body>

    <h2>Backloggd Media System Search Test</h2>
    <div class="subtitle">Using your custom <code>MovieAPIService</code> layer. Delete this file when done.</div>
    
    {% if message %}
        <div class="alert">{{ message }}</div>
    {% endif %}

    <form action="/" method="GET" class="search-box">
        <input type="text" name="query" placeholder="Search a movie name..." value="{{ query }}" required>
        <button type="submit">Search</button>
    </form>

    {% if results %}
        <h3>Search Results</h3>
        {% for movie in results %}
            <div class="movie-card">
                <img src="{{ movie.cover_url if movie.cover_url else 'https://via.placeholder.com/100x150' }}" alt="poster">
                <div class="movie-info">
                    <div class="movie-title">{{ movie.title }}</div>
                    <div class="movie-meta">Release Date: {{ movie.release_date }} | API ID: {{ movie.original_api_id }}</div>
                    <p>{{ movie.description if movie.description else 'No description available.' }}</p>
                    
                    <form action="/add-media" method="POST">
                        <input type="hidden" name="original_api_id" value="{{ movie.original_api_id }}">
                        <input type="hidden" name="title" value="{{ movie.title }}">
                        <input type="hidden" name="description" value="{{ movie.description }}">
                        <input type="hidden" name="release_date" value="{{ movie.release_date }}">
                        <input type="hidden" name="cover_url" value="{{ movie.cover_url }}">
                        <input type="hidden" name="banner_url" value="{{ movie.banner_url }}">
                        <button type="submit" class="add-btn">+ Save to SQLite Database</button>
                    </form>
                </div>
            </div>
        {% endfor %}
    {% elif query %}
        <p>No titles found for "{{ query }}".</p>
    {% endif %}

</body>
</html>
"""

@app.route('/', methods=['GET'])
def index():
    query = request.args.get('query', '')
    message = request.args.get('message', '')
    results = []

    if query:
        try:
            # Running your custom service class function!
            results = movie_api.search_movies(query)
        except Exception as e:
            message = f"Service Error: {str(e)}"

    return render_template_string(HTML_TEMPLATE, results=results, query=query, message=message)


@app.route('/add-media', methods=['POST'])
def add_media():
    api_id = request.form.get('original_api_id')
    
    with app.app_context():
        # Setup system baseline types
        media_type = MediaType.query.filter_by(name="Movie").first()
        if not media_type:
            media_type = MediaType(name="Movie")
            db.session.add(media_type)
            db.session.commit()

        rel_type = MediaRelationType.query.filter_by(name="Standard").first()
        if not rel_type:
            rel_type = MediaRelationType(name="Standard")
            db.session.add(rel_type)
            db.session.commit()

        # Deduplication check
        existing_media = Media.query.filter_by(original_api_id=api_id).first()
        if existing_media:
            return redirect(url_for('index', message=f'"{existing_media.title}" is already in your database.'))

        # Build relation records to satisfy your strict model constraints
        related_group = RelatedMedia(original_api_id=f"rel_{api_id}", media_relation_type_id=rel_type.id)
        db.session.add(related_group)
        db.session.commit()

        # Date string formatting safely
        release_date_str = request.form.get('release_date')
        parsed_date = None
        if release_date_str:
            try:
                parsed_date = datetime.strptime(release_date_str, "%Y-%m-%d").date()
            except ValueError:
                parsed_date = None

        # Build structural model data record row
        new_media = Media(
            id=f"med_{api_id}",
            original_api_id=api_id,
            title=request.form.get('title'),
            media_type=media_type.id,
            description=request.form.get('description'),
            release_date=parsed_date,
            cover_url=request.form.get('cover_url'),
            banner_url=request.form.get('banner_url'),
            average_rating=0.0,
            related_media=related_group.id
        )

        # (Your code where you build new_media and add it goes here...)
        
        db.session.add(new_media)
        
        # 1. SAVE THE TITLE TO A VARIABLE BEFORE COMMITTING
        saved_title = new_media.title
        
        # 2. Commit the database records securely
        db.session.commit()

    # 3. Use the safe variable in your redirect message string
    return redirect(url_for('index', message=f'Successfully inserted "{saved_title}" into your media table!'))

if __name__ == '__main__':
    app.run(port=5001, debug=True)