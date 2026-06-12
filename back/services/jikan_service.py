"""
JikanPy service for anime and manga via the MyAnimeList API.

Uses the jikanpy-v4 library. Returns normalized dicts consistent with
the other external API services (MovieAPIService, IGDBService).
"""
import time
import logging
from typing import TypedDict, List, Optional, Any, Callable
from jikanpy import Jikan

logger = logging.getLogger(__name__)


class AnimeSearchResultDict(TypedDict):
    original_api_id: str
    title: str | None
    description: str | None
    release_date: str | None
    cover_url: str | None
    banner_url: str | None
    rating: float | None
    popularity: float | None
    media_type: str  # sub-type: "TV", "Movie", "OVA", etc.


class MangaSearchResultDict(TypedDict):
    original_api_id: str
    title: str | None
    description: str | None
    release_date: str | None
    cover_url: str | None
    banner_url: str | None
    rating: float | None
    popularity: float | None
    media_type: str  # sub-type: "Manga", "Light Novel", etc.


class JikanService:
    """
    Synchronous wrapper around the Jikan v4 API for anime and manga.

    Usage:
        jikan = JikanService(max_retries=5)
        results = jikan.search_anime("Attack on Titan")
    """

    def __init__(self, max_retries: int = 3) -> None:
        self._client = Jikan()
        self.max_retries = max_retries

    def _retry(self, func: Callable, base_delay: float = 0.5) -> Any:
        """Call func, retrying on exception with exponential backoff."""
        last_exc = None
        for attempt in range(self.max_retries):
            try:
                return func()
            except Exception as e:
                last_exc = e
                if attempt < self.max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning("Jikan call failed (attempt %d/%d), retrying in %.1fs: %s",
                                   attempt + 1, self.max_retries, delay, e)
                    time.sleep(delay)
        logger.error("Jikan call failed after %d attempts: %s", self.max_retries, last_exc)
        raise last_exc

    # ── Anime ──────────────────────────────────────────────────

    def search_anime(
        self,
        query: str,
        page: int = 1,
        exclude_movies: bool = True,
    ) -> List[AnimeSearchResultDict]:
        """
        Search for anime on MyAnimeList.

        Args:
            query: Search string.
            page: Page number (1-based).
            exclude_movies: If True (default), filter out results with type "Movie"
                            to avoid duplicates with the TMDB movie search.

        Returns:
            List of normalized anime search result dicts.
        """
        try:
            response = self._client.search(
                search_type="anime",
                query=query,
                page=page,
            )
        except Exception:
            return []

        data = response.get("data", []) or []
        formatted: List[AnimeSearchResultDict] = []

        for item in data:
            anime_type = item.get("type")  # e.g. "TV", "Movie", "OVA"

            # Optionally skip movies to avoid duplicates with TMDB
            if exclude_movies and anime_type == "Movie":
                continue

            images = item.get("images", {}) or {}
            jpg = images.get("jpg", {}) or {}

            formatted.append({
                "original_api_id": str(item.get("mal_id")),
                "title": item.get("title"),
                "description": item.get("synopsis"),
                "release_date": str(item.get("year")) if item.get("year") else None,
                "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
                "banner_url": None,  # Jikan v4 doesn't provide banner/backdrop
                "rating": float(item.get("score")) if item.get("score") else None,
                "popularity": float(item.get("popularity")) if item.get("popularity") else None,
                "media_type": anime_type,
            })

        return formatted

    def get_anime_full(self, mal_id: int) -> dict[str, Any] | None:
        """
        Get full anime details by MyAnimeList ID.

        Returns a dict with keys: mal_id, title, title_english, synopsis,
        type, episodes, status, score, year, season, images, genres, etc.
        """
        try:
            response = self._retry(lambda: self._client.anime(mal_id, extension="full"))
            return response.get("data") or None
        except Exception:
            logger.exception("Failed to fetch anime full for mal_id=%s", mal_id)
            return None

    # ── Manga ──────────────────────────────────────────────────

    def search_manga(
        self,
        query: str,
        page: int = 1,
    ) -> List[MangaSearchResultDict]:
        """
        Search for manga on MyAnimeList.

        Args:
            query: Search string.
            page: Page number (1-based).

        Returns:
            List of normalized manga search result dicts.
        """
        try:
            response = self._client.search(
                search_type="manga",
                query=query,
                page=page,
            )
        except Exception:
            return []

        data = response.get("data", []) or []
        formatted: List[MangaSearchResultDict] = []

        for item in data:
            images = item.get("images", {}) or {}
            jpg = images.get("jpg", {}) or {}

            formatted.append({
                "original_api_id": str(item.get("mal_id")),
                "title": item.get("title"),
                "description": item.get("synopsis"),
                "release_date": None,  # manga has published.from date; skip for simplicity
                "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
                "banner_url": None,
                "rating": float(item.get("score")) if item.get("score") else None,
                "popularity": float(item.get("popularity")) if item.get("popularity") else None,
                "media_type": item.get("type"),  # "Manga", "Light Novel", etc.
            })

        return formatted

    def get_manga_full(self, mal_id: int) -> dict[str, Any] | None:
        """
        Get full manga details by MyAnimeList ID.

        Returns a dict with keys: mal_id, title, title_english, synopsis,
        type, chapters, volumes, status, score, images, genres, authors, etc.
        """
        try:
            response = self._retry(lambda: self._client.manga(mal_id, extension="full"))
            return response.get("data") or None
        except Exception:
            logger.exception("Failed to fetch manga full for mal_id=%s", mal_id)
            return None

    # ── Seasons ─────────────────────────────────────────────────

    def get_season(
        self,
        year: int,
        season: str,
        page: int = 1,
    ) -> List[AnimeSearchResultDict]:
        """
        Get anime for a specific season.

        Args:
            year: e.g. 2024.
            season: "winter", "spring", "summer", "fall".
            page: Page number (1-based).

        Returns:
            List of normalized anime search result dicts (TV-type only).
        """
        try:
            response = self._client.seasons(year=year, season=season, page=page)
        except Exception:
            return []

        data = response.get("data", []) or []
        formatted: List[AnimeSearchResultDict] = []

        for item in data:
            # Seasonal anime are always TV-type, but we validate anyway
            images = item.get("images", {}) or {}
            jpg = images.get("jpg", {}) or {}

            formatted.append({
                "original_api_id": str(item.get("mal_id")),
                "title": item.get("title"),
                "description": item.get("synopsis"),
                "release_date": str(item.get("year")) if item.get("year") else None,
                "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
                "banner_url": None,
                "rating": float(item.get("score")) if item.get("score") else None,
                "popularity": float(item.get("popularity")) if item.get("popularity") else None,
                "media_type": item.get("type") or "TV",
            })

        return formatted

    def get_current_season(self, page: int = 1) -> List[AnimeSearchResultDict]:
        """Get anime for the current season."""
        try:
            response = self._client.seasons(extension="now")
        except Exception:
            return []

        data = response.get("data", []) or []
        formatted: List[AnimeSearchResultDict] = []

        for item in data:
            images = item.get("images", {}) or {}
            jpg = images.get("jpg", {}) or {}

            formatted.append({
                "original_api_id": str(item.get("mal_id")),
                "title": item.get("title"),
                "description": item.get("synopsis"),
                "release_date": str(item.get("year")) if item.get("year") else None,
                "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
                "banner_url": None,
                "rating": float(item.get("score")) if item.get("score") else None,
                "popularity": float(item.get("popularity")) if item.get("popularity") else None,
                "media_type": item.get("type") or "TV",
            })

        return formatted

    def get_upcoming_season(self, page: int = 1) -> List[AnimeSearchResultDict]:
        """Get upcoming anime for the next season."""
        try:
            response = self._client.seasons(extension="upcoming")
        except Exception:
            return []

        data = response.get("data", []) or []
        formatted: List[AnimeSearchResultDict] = []

        for item in data:
            images = item.get("images", {}) or {}
            jpg = images.get("jpg", {}) or {}

            formatted.append({
                "original_api_id": str(item.get("mal_id")),
                "title": item.get("title"),
                "description": item.get("synopsis"),
                "release_date": str(item.get("year")) if item.get("year") else None,
                "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
                "banner_url": None,
                "rating": float(item.get("score")) if item.get("score") else None,
                "popularity": float(item.get("popularity")) if item.get("popularity") else None,
                "media_type": item.get("type") or "TV",
            })

        return formatted

    # ── Relations ────────────────────────────────────────────────

    def get_anime_relations(self, mal_id: int) -> list[dict[str, Any]]:
        """
        Get related anime for a given MyAnimeList anime ID.
        """
        try:
            response = self._retry(lambda: self._client.anime(mal_id, extension="relations"))
            return response.get("data", []) or []
        except Exception:
            logger.exception("Failed to fetch anime relations for mal_id=%s", mal_id)
            return []

    def get_manga_relations(self, mal_id: int) -> list[dict[str, Any]]:
        """
        Get related manga for a given MyAnimeList manga ID.
        """
        try:
            response = self._retry(lambda: self._client.manga(mal_id, extension="relations"))
            return response.get("data", []) or []
        except Exception:
            logger.exception("Failed to fetch manga relations for mal_id=%s", mal_id)
            return []

    # ── Top / Rankings ─────────────────────────────────────────

    def get_top_anime(self, page: int = 1) -> list[dict[str, Any]]:
        """Get top-ranked anime (raw Jikan response data list)."""
        try:
            response = self._retry(lambda: self._client.top(type="anime", page=page))
            return response.get("data", []) or []
        except Exception:
            logger.exception("Failed to fetch top anime page=%s", page)
            return []

    def get_top_manga(self, page: int = 1) -> list[dict[str, Any]]:
        """Get top-ranked manga (raw Jikan response data list)."""
        try:
            response = self._retry(lambda: self._client.top(type="manga", page=page))
            return response.get("data", []) or []
        except Exception:
            logger.exception("Failed to fetch top manga page=%s", page)
            return []

    # ── All entries (paginated) ─────────────────────────────────

    def get_all_anime(self, page: int = 1) -> dict[str, Any]:
        """
        Fetch a page of ALL anime (GET /anime?page=N).
        Returns the full Jikan response dict with 'data' and 'pagination' keys.
        """
        try:
            response = self._retry(lambda: self._client._request(
                f"{self._client.base}/anime?page={page}",
                page=page,
            ))
            return response
        except Exception:
            logger.exception("Failed to fetch all anime page=%s", page)
            return {"data": [], "pagination": {"has_next_page": False, "last_visible_page": 0}}

    def get_all_manga(self, page: int = 1) -> dict[str, Any]:
        """
        Fetch a page of ALL manga (GET /manga?page=N).
        Returns the full Jikan response dict with 'data' and 'pagination' keys.
        """
        try:
            response = self._retry(lambda: self._client._request(
                f"{self._client.base}/manga?page={page}",
                page=page,
            ))
            return response
        except Exception:
            logger.exception("Failed to fetch all manga page=%s", page)
            return {"data": [], "pagination": {"has_next_page": False, "last_visible_page": 0}}
