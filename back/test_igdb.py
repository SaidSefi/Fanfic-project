"""
IGDB API Test Script — isolated testing layer for the IGDB game API.
Run with: python test_igdb.py
Then visit http://localhost:5001 in your browser.

This script does NOT register the normal API blueprints — it's a standalone
test page so you can debug the IGDB integration in isolation.
"""

import os
import json
import traceback
from datetime import datetime

import requests
from flask import Flask, render_template_string, request, redirect, url_for
from igdb.wrapper import IGDBWrapper

# ── DB setup (minimal, just enough for saving games) ──────────────
from schemas.db import db
from schemas.models import Media, MediaType, RelatedMedia, MediaRelationType

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///fanfic.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# ── IGDB credentials ─────────────────────────────────────────────
CLIENT_ID = os.environ.get("IGDB_CLIENT_ID", "zwcdup9a4vx2kxwrid419vvr9a3wa7")
CLIENT_SECRET = os.environ.get("IGDB_CLIENT_SECRET", "elnk2o013f4tjcov0ag7p1wzweosbn")
TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"

IMAGE_BASE = "https://images.igdb.com/igdb/image/upload"

GAME_TYPE_MAP = {
    0: "Main Game",
    1: "DLC / Addon",
    2: "Expansion",
    3: "Bundle",
    4: "Standalone Expansion",
    5: "Mod",
    6: "Episode",
    7: "Season",
    8: "Remake",
    9: "Remaster",
    10: "Expanded Game",
    11: "Port",
    12: "Fork",
    13: "Pack",
    14: "Update",
}


def fetch_access_token() -> tuple[str | None, str | None]:
    """Fetch an App Access Token from Twitch. Returns (token, error)."""
    if not CLIENT_ID or not CLIENT_SECRET:
        return None, "Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET environment variables."

    try:
        resp = requests.post(
            TWITCH_TOKEN_URL,
            params={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type": "client_credentials",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["access_token"], None
    except Exception as e:
        return None, f"Failed to fetch access token: {e}"


def build_cover_url(image_id: str, size: str = "t_cover_big") -> str | None:
    if not image_id:
        return None
    if image_id.startswith("//"):
        return "https:" + image_id
    return f"{IMAGE_BASE}/{size}/{image_id}.jpg"


def format_ts(ts: int | None) -> str | None:
    if ts is None:
        return None
    from datetime import timezone
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")


def search_igdb(query: str, limit: int = 10) -> tuple[list[dict], str | None]:
    """
    Search IGDB and return (results, error_message).
    error_message is None on success.
    """
    # Fetch a fresh access token
    access_token, token_error = fetch_access_token()
    if token_error:
        return [], token_error

    try:
        wrapper = IGDBWrapper(CLIENT_ID, access_token)
    except Exception as e:
        return [], f"Failed to create IGDBWrapper: {e}"

    apicalypse = (
        f'search "{query}";'
        "fields name,cover.image_id,artworks.image_id,summary,first_release_date,rating,"
        "genres.name,platforms.name,game_type;"
        f"limit {limit};"
    )

    try:
        raw = wrapper.api_request("games", apicalypse)
        # raw is bytes — try to decode and parse
        raw_text = raw.decode("utf-8") if isinstance(raw, bytes) else str(raw)
        parsed = json.loads(raw_text)

        if not isinstance(parsed, list):
            return [], f"Unexpected API response type: {type(parsed).__name__}. Raw: {raw_text[:500]}"

        results = []
        for game in parsed:
            artworks = game.get("artworks", [])
            banner_url = build_cover_url(artworks[0].get("image_id"), "t_720p") if artworks else None

            results.append({
                "original_api_id": str(game.get("id", "")),
                "title": game.get("name"),
                "summary": game.get("summary"),
                "first_release_date": format_ts(game.get("first_release_date")),
                "cover_url": build_cover_url(
                    game.get("cover", {}).get("image_id", "")
                ) if game.get("cover") else None,
                "banner_url": banner_url,
                "rating": game.get("rating"),
                "game_type": GAME_TYPE_MAP.get(game.get("game_type")) if game.get("game_type") is not None else None,
                "genres": [g.get("name") for g in game.get("genres", [])],
                "platforms": [p.get("name") for p in game.get("platforms", [])],
            })
        return results, None

    except json.JSONDecodeError as e:
        raw_preview = raw.decode("utf-8")[:500] if isinstance(raw, bytes) else str(raw)[:500]
        return [], f"JSON decode error: {e}. Raw response: {raw_preview}"
    except Exception as e:
        return [], f"API request failed: {e}\n{traceback.format_exc()}"


# ── HTML template ─────────────────────────────────────────────────
HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>IGDB Game API Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px;
               background-color: #14181c; color: #c8d4e0; }
        h2 { color: #fff; margin-bottom: 5px; }
        .subtitle { color: #667788; margin-bottom: 10px; font-size: 14px; }
        .creds { font-size: 12px; color: #556; margin-bottom: 20px; background: #1c252d;
                 padding: 10px; border-radius: 4px; font-family: monospace; }
        .search-box { display: flex; gap: 10px; margin-bottom: 30px; }
        input[type="text"] { flex: 1; padding: 12px; border-radius: 4px;
                             border: 1px solid #445566; background: #2c3440;
                             color: #fff; font-size: 16px; }
        button { padding: 12px 24px; border: none; border-radius: 4px;
                 background-color: #00b020; color: white; font-weight: bold;
                 cursor: pointer; font-size: 16px; }
        button:hover { background-color: #008f1a; }
        .error-box { background: #3a1a1a; border: 1px solid #cc4444; padding: 15px;
                     margin-bottom: 20px; border-radius: 4px; color: #ff8888;
                     white-space: pre-wrap; font-family: monospace; font-size: 13px; }
        .success-box { background: #1a3a1a; border: 1px solid #44cc44; padding: 15px;
                       margin-bottom: 20px; border-radius: 4px; color: #88ff88; }
        .game-card { display: flex; gap: 20px; background: #1c252d; padding: 15px;
                     margin-bottom: 15px; border-radius: 4px; border: 1px solid #24303c; }
        .game-card img { width: 100px; height: 133px; object-fit: cover;
                         background-color: #2c3440; border-radius: 4px; }
        .game-info { flex: 1; }
        .game-title { font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 5px; }
        .game-meta { font-size: 14px; color: #9ab0c1; margin-bottom: 10px; }
        .add-btn { background-color: #40bc9c; margin-top: 10px; padding: 8px 16px; font-size: 14px; }
        .add-btn:hover { background-color: #33967d; }
        .tag { display: inline-block; background: #2c3440; padding: 2px 8px;
               border-radius: 3px; margin-right: 4px; font-size: 12px; color: #9ab0c1; }
    </style>
</head>
<body>

    <h2>🎮 IGDB Game API Test</h2>
    <div class="subtitle">Isolated test for <code>IGDBService</code>. Delete when done.</div>
    <div class="creds">
        Client ID: {{ client_id_preview }}<br>
        Token: {{ token_preview }}
    </div>

    {% if error %}
        <div class="error-box">{{ error }}</div>
    {% endif %}
    {% if message %}
        <div class="success-box">{{ message }}</div>
    {% endif %}

    <form action="/" method="GET" class="search-box">
        <input type="text" name="query" placeholder="Search a game... (e.g. Zelda)" value="{{ query }}" required>
        <button type="submit">Search</button>
    </form>

    {% if results %}
        <h3>Results ({{ results|length }})</h3>
        {% for game in results %}
            <div class="game-card">
                {% if game.banner_url %}
                <div style="width:100%;height:150px;overflow:hidden;border-radius:4px;margin-bottom:12px;">
                    <img src="{{ game.banner_url }}" style="width:100%;height:100%;object-fit:cover;">
                </div>
                {% endif %}
                <div style="display:flex;gap:20px;">
                <img src="{{ game.cover_url if game.cover_url else 'https://via.placeholder.com/100x133?text=No+Cover' }}" alt="cover">
                <div class="game-info">
                    <div class="game-title">{{ game.title }}</div>
                    <div class="game-meta">
                        Released: {{ game.first_release_date or 'Unknown' }} |
                        Rating: {{ game.rating or 'N/A' }} |
                        Type: {{ game.game_type or 'N/A' }}<br>
                        API ID: {{ game.original_api_id }}
                    </div>
                    <div>
                        {% for genre in game.genres %}<span class="tag">{{ genre }}</span>{% endfor %}
                    </div>
                    <div style="margin-top: 5px;">
                        {% for plat in game.platforms %}<span class="tag">{{ plat }}</span>{% endfor %}
                    </div>
                    <p style="margin-top: 8px; font-size: 14px;">{{ game.summary[:300] if game.summary else 'No description.' }}{% if game.summary and game.summary|length > 300 %}...{% endif %}</p>

                    <form action="/add-game" method="POST">
                        <input type="hidden" name="original_api_id" value="{{ game.original_api_id }}">
                        <input type="hidden" name="title" value="{{ game.title }}">
                        <input type="hidden" name="description" value="{{ game.summary }}">
                        <input type="hidden" name="release_date" value="{{ game.first_release_date }}">
                        <input type="hidden" name="cover_url" value="{{ game.cover_url }}">
                        <input type="hidden" name="banner_url" value="{{ game.banner_url }}">
                        <input type="hidden" name="rating" value="{{ game.rating }}">
                        <button type="submit" class="add-btn">+ Save to Database</button>
                    </form>
                </div>
            </div>
        {% endfor %}
    {% elif query and not error %}
        <p>No games found for "{{ query }}".</p>
    {% endif %}

</body>
</html>
"""


# ── Routes ────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    query = request.args.get("query", "")
    message = request.args.get("message", "")
    results: list[dict] = []
    error: str | None = None

    if query:
        with app.app_context():
            results, error = search_igdb(query)

    client_preview = CLIENT_ID[:20] + "..." if len(CLIENT_ID) > 20 else CLIENT_ID
    token_preview = "auto-fetched via OAuth"

    return render_template_string(
        HTML,
        results=results,
        query=query,
        message=message,
        error=error,
        client_id_preview=client_preview,
        token_preview=token_preview,
    )


@app.route("/add-game", methods=["POST"])
def add_game():
    api_id = request.form.get("original_api_id", "")

    with app.app_context():
        # Ensure types exist
        media_type = MediaType.query.filter_by(name="Game").first()
        if not media_type:
            media_type = MediaType(name="Game")
            db.session.add(media_type)
            db.session.commit()

        rel_type = MediaRelationType.query.filter_by(name="Standard").first()
        if not rel_type:
            rel_type = MediaRelationType(name="Standard")
            db.session.add(rel_type)
            db.session.commit()

        # Dedup
        existing = Media.query.filter_by(original_api_id=api_id).first()
        if existing:
            return redirect(url_for("index", message=f'"{existing.title}" is already in the database.'))

        # Parse date
        release_str = request.form.get("release_date")
        parsed_date = None
        if release_str:
            try:
                parsed_date = datetime.strptime(release_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        # Parse rating
        rating_str = request.form.get("rating")
        rating_val = 0.0
        if rating_str and rating_str != "None":
            try:
                rating_val = float(rating_str)
            except ValueError:
                pass

        # Create RelatedMedia entry
        related = RelatedMedia(
            original_api_id=f"rel_{api_id}",
            media_relation_type_id=rel_type.id,
        )
        db.session.add(related)
        db.session.commit()

        # Create Media
        import uuid
        media = Media(
            id=str(uuid.uuid4()),
            original_api_id=api_id,
            title=request.form.get("title", "Unknown"),
            media_type=media_type.id,
            description=request.form.get("description"),
            release_date=parsed_date,
            cover_url=request.form.get("cover_url"),
            banner_url=request.form.get("banner_url"),
            average_rating=rating_val,
            related_media=related.id,
        )
        db.session.add(media)
        db.session.commit()

        return redirect(
            url_for("index", message=f'✅ "{media.title}" saved to database!')
        )


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    print("🎮 IGDB Test Server running at http://localhost:5001")
    app.run(debug=True, port=5001)
