from typing import TypedDict, List, Any

import tmdbsimple as tmdb


class MovieSearchResultDict(TypedDict):
    original_api_id: str
    title: str | None
    description: str | None
    release_date: str | None
    cover_url: str | None
    banner_url: str | None
    rating: float | None
    popularity: float | None


class MovieAPIService:
    def __init__(self) -> None:
        self.api_key = "16576abc186e6a952a34804c16e36f5d"
        tmdb.API_KEY = self.api_key
        self.image_base = "https://image.tmdb.org/t/p"

    # ── Movies ──────────────────────────────────────────────────

    def search_movies(self, query: str) -> List[MovieSearchResultDict]:
        """Search for movies by title using tmdbsimple and format results."""
        search = tmdb.Search()
        try:
            search.movie(query=query, language="en-US")
            results = search.results or []
        except Exception:
            return []

        formatted_results: List[MovieSearchResultDict] = []
        for movie in results:
            formatted_results.append({
                "original_api_id": str(movie.get('id')),
                "title": movie.get('title'),
                "description": movie.get('overview'),
                "release_date": movie.get('release_date'),
                "cover_url": f"{self.image_base}/w500{movie.get('poster_path')}" if movie.get('poster_path') else None,
                "banner_url": f"{self.image_base}/original{movie.get('backdrop_path')}" if movie.get('backdrop_path') else None,
                "rating": movie.get('vote_average'),
                "popularity": movie.get('popularity'),
            })

        return formatted_results

    def get_movie_details(self, movie_id: int) -> dict[str, Any] | None:
        """Fetch detailed movie information using tmdbsimple."""
        movie = tmdb.Movies(movie_id)
        try:
            data = movie.info(language="en-US")
            return data
        except Exception:
            return None

    def get_movie_with_collection(self, movie_id: int) -> list[dict[str, Any]]:
        """
        Fetch a movie and all sibling movies in its collection (franchise).
        Returns a list where the first element is the parent movie
        and subsequent elements are other movies in the same collection.

        Relations between movies are stored as pairwise entries in RelatedMedia.
        """
        details = self.get_movie_details(movie_id)
        if not details:
            return []

        results: list[dict[str, Any]] = []

        def _normalize(movie_data: dict) -> dict[str, Any]:
            return {
                "original_api_id": str(movie_data.get("id", "")),
                "title": movie_data.get("title"),
                "description": movie_data.get("overview"),
                "release_date": movie_data.get("release_date"),
                "cover_url": f"{self.image_base}/w500{movie_data.get('poster_path')}" if movie_data.get("poster_path") else None,
                "banner_url": f"{self.image_base}/original{movie_data.get('backdrop_path')}" if movie_data.get("backdrop_path") else None,
                "rating": movie_data.get("vote_average"),
                "popularity": movie_data.get("popularity"),
                "media_type": "Movie",
            }

        # Parent movie first
        results.append(_normalize(details))

        # Check for collection
        collection = details.get("belongs_to_collection")
        if collection and collection.get("id"):
            collection_id = collection["id"]
            try:
                coll = tmdb.Collections(collection_id)
                coll_data = coll.info(language="en-US")
                parts = coll_data.get("parts", []) or []
                for part in parts:
                    part_id = str(part.get("id", ""))
                    # Skip the parent movie itself (already in results)
                    if part_id == str(movie_id):
                        continue
                    results.append(_normalize(part))
            except Exception:
                pass

        return results

    # ── TV Shows ────────────────────────────────────────────────

    def search_tv_shows(self, query: str, exclude_anime: bool = False) -> list[dict[str, Any]]:
        """
        Search for TV shows. Returns list of show summaries.

        Args:
            query: Search string.
            exclude_anime: If True, filters out results where original_language
                           is Japanese AND genre_ids includes 16 (Animation).
                           This keeps Japanese live-action dramas while removing anime.
        """
        search = tmdb.Search()
        try:
            search.tv(query=query, language="en-US")
            results = search.results or []
        except Exception:
            return []

        formatted: list[dict[str, Any]] = []
        for show in results:
            # Optionally skip anime (Japanese + Animation genre)
            if exclude_anime:
                original_lang = show.get('original_language', '')
                genre_ids = show.get('genre_ids', []) or []
                if original_lang == 'ja' and 16 in genre_ids:
                    continue

            formatted.append({
                "original_api_id": str(show.get('id')),
                "title": show.get('name'),
                "description": show.get('overview'),
                "release_date": show.get('first_air_date'),
                "cover_url": f"{self.image_base}/w500{show.get('poster_path')}" if show.get('poster_path') else None,
                "banner_url": f"{self.image_base}/original{show.get('backdrop_path')}" if show.get('backdrop_path') else None,
                "rating": show.get('vote_average'),
                "popularity": show.get('popularity'),
            })

        return formatted

    def get_tv_show_with_seasons(self, tv_id: int) -> list[dict[str, Any]]:
        """
        Fetch a TV show and all its seasons with details.
        Returns a list where the first element is the parent show
        and subsequent elements are individual seasons.

        Relations between show and seasons are stored as pairwise entries in RelatedMedia.
        """
        tv = tmdb.TV(tv_id)
        try:
            show_data = tv.info(language="en-US")
        except Exception:
            return []

        results: list[dict[str, Any]] = []

        # Parent show
        show_entry = {
            "original_api_id": str(tv_id),
            "title": show_data.get('name'),
            "description": show_data.get('overview'),
            "release_date": show_data.get('first_air_date'),
            "cover_url": f"{self.image_base}/w500{show_data.get('poster_path')}" if show_data.get('poster_path') else None,
            "banner_url": f"{self.image_base}/original{show_data.get('backdrop_path')}" if show_data.get('backdrop_path') else None,
            "rating": show_data.get('vote_average'),
            "popularity": show_data.get('popularity'),
            "media_type": "TV Show",
            "number_of_seasons": show_data.get('number_of_seasons'),
            "number_of_episodes": show_data.get('number_of_episodes'),
            "status": show_data.get('status'),
        }
        results.append(show_entry)

        # Individual seasons
        seasons = show_data.get('seasons', [])
        for season in seasons:
            season_number = season.get('season_number', 0)
            # Skip season 0 (specials, extras) and seasons without air date
            if season_number == 0:
                continue
            if not season.get('air_date'):
                continue

            # Fetch season details for rating and the season's real TMDB ID
            season_rating = None
            season_tmdb_id = season.get('id')  # TMDB gives each season its own ID
            try:
                season_obj = tmdb.TV_Seasons(tv_id, season_number)
                season_info = season_obj.info(language="en-US")
                season_rating = season_info.get('vote_average')
                season_tmdb_id = season_info.get('id', season_tmdb_id)
            except Exception:
                pass

            season_entry = {
                "original_api_id": str(season_tmdb_id) if season_tmdb_id else f"{tv_id}_{season_number}",
                "title": f"{show_data.get('name')} - {season.get('name', f'Season {season_number}')}",
                "description": season.get('overview') or show_data.get('overview'),
                "release_date": season.get('air_date'),
                "cover_url": f"{self.image_base}/w500{season.get('poster_path')}" if season.get('poster_path') else None,
                "banner_url": None,
                "rating": season_rating,
                "popularity": None,
                "media_type": "TV Season",
                "season_number": season_number,
                "episode_count": season.get('episode_count'),
            }
            results.append(season_entry)

        return results