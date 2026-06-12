import json
from typing import Any

import requests
from igdb.wrapper import IGDBWrapper


class IGDBService:
    """Service for querying the IGDB (Internet Game Database) API.

    Handles Twitch OAuth token acquisition automatically.
    Pass your Twitch Client ID and Client Secret (not the access token).
    """

    IMAGE_BASE_URL = "https://images.igdb.com/igdb/image/upload"
    TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"

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

    # Only these game types are returned by search_games
    ALLOWED_GAME_TYPES = {0, 1, 9, 11}  # main_game, dlc_addon, remaster, port

    def __init__(
        self,
        client_id: str = "",
        client_secret: str = "",
        access_token: str = "",
    ) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token = access_token
        self._wrapper: IGDBWrapper | None = None

    def _fetch_access_token(self) -> str:
        """Obtain an App Access Token from Twitch using client credentials."""
        if self._access_token:
            return self._access_token

        if not self.client_id or not self.client_secret:
            raise ValueError(
                "IGDB client_id and client_secret must be set. "
                "Get them from https://dev.twitch.tv/console/apps"
            )

        response = requests.post(
            self.TWITCH_TOKEN_URL,
            params={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "client_credentials",
            },
        )
        response.raise_for_status()
        data = response.json()
        self._access_token = data["access_token"]
        return self._access_token

    def _get_wrapper(self) -> IGDBWrapper:
        if self._wrapper is None:
            token = self._fetch_access_token()
            self._wrapper = IGDBWrapper(self.client_id, token)
        return self._wrapper

    def _build_cover_url(self, image_id: str, size: str = "t_cover_big") -> str | None:
        """Build a full IGDB image URL from an image ID hash."""
        if not image_id:
            return None
        # image_id may already contain the full URL from the API response
        # e.g. "//images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg"
        if image_id.startswith("//"):
            return "https:" + image_id
        return f"{self.IMAGE_BASE_URL}/{size}/{image_id}.jpg"

    def _format_timestamp(self, ts: int | None) -> str | None:
        """Convert a Unix timestamp to an ISO date string."""
        if ts is None:
            return None
        from datetime import datetime, timezone
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")

    def search_games(self, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """Search for games by name. Only returns: main game, dlc, remaster, port."""
        try:
            wrapper = self._get_wrapper()
        except Exception as e:
            print(f"[IGDB] Failed to get wrapper: {e}")
            return []

        apicalypse = (
            f'search "{query}";'
            "fields name,cover.image_id,artworks.image_id,summary,first_release_date,rating,"
            "genres.name,platforms.name,game_type,parent_game,remakes,remasters,dlcs;"
            f"limit {limit};"
        )

        try:
            byte_array = wrapper.api_request("games", apicalypse)
            results = json.loads(byte_array.decode("utf-8"))
        except Exception as e:
            print(f"[IGDB] API request failed: {e}")
            return []

        formatted: list[dict[str, Any]] = []
        for game in results:
            game_type = game.get("game_type")
            # Filter: only keep allowed game types
            if game_type not in self.ALLOWED_GAME_TYPES:
                continue

            # Banner: use the first artwork if available
            artworks = game.get("artworks", [])
            banner_url = self._build_cover_url(artworks[0].get("image_id"), "t_720p") if artworks else None

            # Collect related game IDs
            related_ids: list[int] = []
            parent = game.get("parent_game")
            if parent:
                related_ids.append(parent)
            related_ids.extend(game.get("remakes", []) or [])
            related_ids.extend(game.get("remasters", []) or [])
            related_ids.extend(game.get("dlcs", []) or [])

            formatted.append({
                "original_api_id": str(game.get("id", "")),
                "title": game.get("name"),
                "summary": game.get("summary"),
                "first_release_date": self._format_timestamp(game.get("first_release_date")),
                "cover_url": self._build_cover_url(
                    game.get("cover", {}).get("image_id", "")
                ) if game.get("cover") else None,
                "banner_url": banner_url,
                "rating": game.get("rating"),
                "game_type": self.GAME_TYPE_MAP.get(game_type),
                "genres": [g.get("name") for g in game.get("genres", [])] if game.get("genres") else [],
                "platforms": [p.get("name") for p in game.get("platforms", [])] if game.get("platforms") else [],
                "related_game_ids": [str(rid) for rid in related_ids],
            })

        return formatted

    def get_games_by_ids(self, game_ids: list[int]) -> list[dict[str, Any]]:
        """Fetch basic info for multiple games by their IGDB IDs (batch)."""
        if not game_ids:
            return []

        try:
            wrapper = self._get_wrapper()
        except Exception:
            return []

        ids_str = ",".join(str(gid) for gid in game_ids)
        apicalypse = (
            "fields name,cover.image_id,artworks.image_id,summary,first_release_date,"
            "rating,game_type;"
            f"where id = ({ids_str});"
            f"limit {len(game_ids)};"
        )

        try:
            byte_array = wrapper.api_request("games", apicalypse)
            results = json.loads(byte_array.decode("utf-8"))
        except Exception:
            return []

        formatted: list[dict[str, Any]] = []
        for game in results:
            artworks = game.get("artworks", [])
            banner_url = self._build_cover_url(artworks[0].get("image_id"), "t_720p") if artworks else None
            formatted.append({
                "original_api_id": str(game.get("id", "")),
                "title": game.get("name"),
                "summary": game.get("summary"),
                "first_release_date": self._format_timestamp(game.get("first_release_date")),
                "cover_url": self._build_cover_url(
                    game.get("cover", {}).get("image_id", "")
                ) if game.get("cover") else None,
                "banner_url": banner_url,
                "rating": game.get("rating"),
                "game_type": game.get("game_type"),
            })

        return formatted

    def get_game_details(self, game_id: int) -> dict[str, Any] | None:
        """Fetch detailed game information by IGDB game ID."""
        try:
            wrapper = self._get_wrapper()
        except Exception as e:
            print(f"[IGDB] Failed to get wrapper: {e}")
            return None

        apicalypse = (
            "fields name,cover.image_id,summary,storyline,first_release_date,"
            "rating,rating_count,aggregated_rating,aggregated_rating_count,"
            "total_rating,total_rating_count,"
            "genres.name,platforms.name,game_modes.name,game_engines.name,"
            "involved_companies.company.name,involved_companies.publisher,involved_companies.developer,"
            "screenshots.image_id,artworks.image_id,videos.video_id,videos.name,"
            "websites.url,websites.category,"
            "franchise.name,franchises.name,"
            "similar_games.name,similar_games.cover.image_id,"
            "dlcs.name,expansions.name,"
            "age_ratings.category,age_ratings.rating,"
            "url,slug,status,game_status.name,game_type,"
            "hypes,follows,updated_at,created_at;"
            f"where id = {game_id};"
        )

        try:
            byte_array = wrapper.api_request("games", apicalypse)
            results = json.loads(byte_array.decode("utf-8"))
        except Exception:
            return None

        if not results:
            return None

        game = results[0]

        return {
            "original_api_id": str(game.get("id", "")),
            "title": game.get("name"),
            "slug": game.get("slug"),
            "url": game.get("url"),
            "summary": game.get("summary"),
            "storyline": game.get("storyline"),
            "first_release_date": self._format_timestamp(game.get("first_release_date")),
            "cover_url": self._build_cover_url(
                game.get("cover", {}).get("image_id", "")
            ) if game.get("cover") else None,
            "rating": game.get("rating"),
            "rating_count": game.get("rating_count"),
            "aggregated_rating": game.get("aggregated_rating"),
            "aggregated_rating_count": game.get("aggregated_rating_count"),
            "total_rating": game.get("total_rating"),
            "total_rating_count": game.get("total_rating_count"),
            "hypes": game.get("hypes"),
            "follows": game.get("follows"),
            "game_status": game.get("game_status", {}).get("name") if game.get("game_status") else None,
            "game_type": self.GAME_TYPE_MAP.get(game.get("game_type")) if game.get("game_type") is not None else None,
            "genres": [g.get("name") for g in game.get("genres", [])],
            "platforms": [p.get("name") for p in game.get("platforms", [])],
            "game_modes": [m.get("name") for m in game.get("game_modes", [])],
            "game_engines": [e.get("name") for e in game.get("game_engines", [])],
            "involved_companies": [
                {
                    "name": c.get("company", {}).get("name"),
                    "publisher": c.get("publisher"),
                    "developer": c.get("developer"),
                }
                for c in game.get("involved_companies", [])
            ],
            "screenshots": [
                self._build_cover_url(s.get("image_id"), "t_screenshot_big")
                for s in game.get("screenshots", [])
                if s.get("image_id")
            ],
            "artworks": [
                self._build_cover_url(a.get("image_id"), "t_720p")
                for a in game.get("artworks", [])
                if a.get("image_id")
            ],
            "franchise": game.get("franchise", {}).get("name") if game.get("franchise") else None,
            "franchises": [f.get("name") for f in game.get("franchises", [])],
            "similar_games": [
                {"id": s.get("id"), "name": s.get("name"),
                 "cover_url": self._build_cover_url(s.get("cover", {}).get("image_id", "")) if s.get("cover") else None}
                for s in game.get("similar_games", [])
            ],
            "age_ratings": [
                {"category": a.get("category"), "rating": a.get("rating")}
                for a in game.get("age_ratings", [])
            ],
            "websites": [
                {"url": w.get("url"), "category": w.get("category")}
                for w in game.get("websites", [])
            ],
            "updated_at": self._format_timestamp(game.get("updated_at")),
            "created_at": self._format_timestamp(game.get("created_at")),
        }
