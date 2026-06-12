from typing import TypedDict, List, Optional
import uuid
import logging
from datetime import datetime

from sqlalchemy import or_, and_, func, case

from schemas.db import db
from schemas.models import Media, MediaType, UserMedia, RelatedMedia, MediaRelationType

logger = logging.getLogger(__name__)


class MediaSummaryDict(TypedDict):
    id: str
    titre: str
    image: str | None
    score: float
    type: str
    year: str | None


class MediaDetailDict(TypedDict):
    titre: str
    cover: str | None
    banner: str | None
    synopsis: str | None
    release_date: str | None
    average_rating: float
    total_reviews: int
    type: str | None
    stats: dict[str, int]
    rating_distribution: dict[str, int]


class MediaReviewDict(TypedDict):
    user: str
    review: str | None
    rating: float | None
    created_at: str | None


class MediaTypeDict(TypedDict):
    type: str


class RelatedMediaDict(TypedDict):
    id: str
    cover: str | None
    nom: str
    type: str | None
    year: str | None
    relation_type: str | None


class MediasService:
    def get_medias(
        self,
        ids: List[str] | None = None,
        genre: str | None = None,
        year: str | None = None,
        popularity: str | None = None,
        rating: str | None = None,
    ) -> List[MediaSummaryDict]:
        query = db.session.query(Media, MediaType).join(MediaType, Media.media_type == MediaType.id)

        if ids:
            query = query.filter(Media.id.in_(ids))

        if genre:
            query = query.filter(Media.description.ilike(f'%{genre}%'))

        if year:
            try:
                year_int = int(year)
            except ValueError:
                year_int = None
            if year_int:
                query = query.filter(func.strftime('%Y', Media.release_date) == str(year_int))

        if rating:
            try:
                rating_float = float(rating)
            except ValueError:
                rating_float = None
            if rating_float is not None:
                query = query.filter(Media.average_rating >= rating_float)

        if popularity:
            try:
                popularity_int = int(popularity)
            except ValueError:
                popularity_int = None
            if popularity_int is not None:
                subquery = db.session.query(UserMedia.media_id, func.count(UserMedia.id).label('pop_count'))
                subquery = subquery.group_by(UserMedia.media_id).subquery()
                query = query.join(subquery, Media.id == subquery.c.media_id).filter(subquery.c.pop_count >= popularity_int)

        items = query.all()

        return [
            {
                'id': media.id,
                'titre': media.title,
                'image': media.cover_url,
                'score': media.average_rating,
                'type': media_type.name,
                'year': str(media.release_date.year) if media.release_date else None,
            }
            for media, media_type in items
        ]

    def search_medias(self, query_text: str, media_type: str | None = None, limit: int | None = 8) -> List[MediaSummaryDict]:
        # Relevance scoring: lower number = better match
        relevance = case(
            (Media.title.ilike(query_text), 1),           # exact match
            (Media.title.ilike(f'{query_text}%'), 2),     # starts with
            (Media.title.ilike(f'%{query_text}%'), 3),    # contains in title
            (Media.description.ilike(f'%{query_text}%'), 4),  # contains in description
            else_=5,
        )

        query = (
            db.session.query(Media, MediaType)
            .join(MediaType, Media.media_type == MediaType.id)
            .filter(
                or_(
                    Media.title.ilike(f'%{query_text}%'),
                    Media.description.ilike(f'%{query_text}%')
                )
            )
        )

        # Filter by media type if specified
        if media_type and media_type != 'All':
            if media_type == 'TV Show':
                query = query.filter(MediaType.name.in_(['TV Show', 'TV Season']))
            else:
                query = query.filter(MediaType.name == media_type)

        query = query.order_by(relevance)
        if limit is not None:
            query = query.limit(limit)
        medias = query.all()

        return [
            {
                'id': media.id,
                'titre': media.title,
                'image': media.cover_url,
                'score': media.average_rating,
                'type': media_type.name,
                'year': str(media.release_date.year) if media.release_date else None,
            }
            for media, media_type in medias
        ]

    def get_media(self, media_id: str) -> MediaDetailDict | None:
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        # Stats from UserMedia
        all_um = UserMedia.query.filter_by(media_id=media.id).all()

        stats = {
            "wishlist": 0,
            "consuming": 0,
            "completed": 0,
            "dropped": 0,
            "likes": 0,
            "reviews": 0,
        }
        rating_dist: dict[str, int] = {
            "0": 0, "0.5": 0, "1": 0, "1.5": 0, "2": 0,
            "2.5": 0, "3": 0, "3.5": 0, "4": 0, "4.5": 0, "5": 0,
        }
        total_reviews = 0

        for um in all_um:
            status = um.status or ""
            if status in stats:
                stats[status] += 1
            if um.liked:
                stats["likes"] += 1
            if um.review_text or um.rating is not None:
                stats["reviews"] += 1
                total_reviews += 1
            if um.rating is not None:
                key = str(um.rating)
                if key in rating_dist:
                    rating_dist[key] += 1

        media_type = MediaType.query.filter_by(id=media.media_type).first()

        return {
            'titre': media.title,
            'cover': media.cover_url,
            'banner': media.banner_url or media.cover_url,
            'synopsis': media.description,
            'release_date': media.release_date.isoformat() if media.release_date else None,
            'average_rating': media.average_rating,
            'total_reviews': total_reviews,
            'type': media_type.name if media_type else None,
            'stats': stats,
            'rating_distribution': rating_dist,
        }

    def get_media_reviews(self, media_id: str) -> List[MediaReviewDict] | None:
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        reviews = (
            UserMedia.query.filter_by(media_id=media.id)
            .filter(
                or_(UserMedia.review_text.isnot(None), UserMedia.rating.isnot(None))
            )
            .all()
        )

        return [
            {
                'user': review.user.username,
                'review': review.review_text,
                'rating': review.rating,
                'created_at': review.review_created_at.isoformat() if review.review_created_at else None,
            }
            for review in reviews
        ]

    def get_media_type(self, media_id: str) -> MediaTypeDict | None:
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        media_type = MediaType.query.filter_by(id=media.media_type).first()
        if not media_type:
            return None

        return {'type': media_type.name}

    def get_media_related(self, media_id: str) -> List[RelatedMediaDict] | None:
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        api_id = media.original_api_id

        # Find relations where this media is the SOURCE (original_api_id_1)
        relations = RelatedMedia.query.filter(
            RelatedMedia.original_api_id_1 == api_id
        ).all()

        if not relations:
            return []

        # Build map: target_api_id → relation_type_name
        id_to_relation: dict[str, str] = {}
        for rel in relations:
            rt = MediaRelationType.query.filter_by(id=rel.media_relation_type_id).first()
            id_to_relation[rel.original_api_id_2] = rt.name if rt else "Related"

        # Look up those Media by original_api_id
        related_medias = Media.query.filter(Media.original_api_id.in_(list(id_to_relation.keys()))).all()

        results = []
        for rm in related_medias:
            mt = MediaType.query.filter_by(id=rm.media_type).first()
            results.append({
                'id': rm.id,
                'cover': rm.cover_url,
                'nom': rm.title,
                'type': mt.name if mt else None,
                'year': str(rm.release_date.year) if rm.release_date else None,
                'relation_type': id_to_relation.get(rm.original_api_id, "Related"),
            })

        return results

    def get_media_relation_type(self, media_id):
        """Return the relation type for the first related media found."""
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        api_id = media.original_api_id
        rel = RelatedMedia.query.filter(
            RelatedMedia.original_api_id_1 == api_id
        ).first()

        if not rel:
            return {'type': None}

        relation_type = MediaRelationType.query.filter_by(id=rel.media_relation_type_id).first()
        return {'type': relation_type.name if relation_type else None}

    # ── Deep Search ───────────────────────────────────────────────

    def _ensure_media_type(self, name: str) -> int:
        """Get or create a MediaType and return its id."""
        media_type = MediaType.query.filter_by(name=name).first()
        if not media_type:
            media_type = MediaType(name=name)
            db.session.add(media_type)
            db.session.flush()
        return media_type.id

    def _create_media_relation(
        self,
        original_api_id_1: str,
        original_api_id_2: str,
        relation_type_name: str = "Related",
    ) -> int | None:
        """
        Create a directed relation: media id_1 has relation_type_name to media id_2.
        Order matters — duplicates checked by exact (id_1, id_2) pair only.
        """
        if original_api_id_1 == original_api_id_2:
            return None

        existing = RelatedMedia.query.filter(
            and_(
                RelatedMedia.original_api_id_1 == original_api_id_1,
                RelatedMedia.original_api_id_2 == original_api_id_2,
            )
        ).first()
        if existing:
            return existing.id

        rel_type = MediaRelationType.query.filter_by(name=relation_type_name).first()
        if not rel_type:
            rel_type = MediaRelationType(name=relation_type_name)
            db.session.add(rel_type)
            db.session.flush()

        rel = RelatedMedia(
            original_api_id_1=original_api_id_1,
            original_api_id_2=original_api_id_2,
            media_relation_type_id=rel_type.id,
        )
        db.session.add(rel)
        db.session.flush()
        return rel.id

    def _normalize_jikan_entry(self, data: dict, is_anime: bool) -> dict:
        """Normalize a Jikan full entry dict into the format expected by _cache_media."""
        images = data.get("images", {}) or {}
        jpg = images.get("jpg", {}) or {}

        # Jikan returns year as an integer (e.g. 2019) — convert to a full date
        year = data.get("year")
        if year:
            try:
                release_date = f"{int(year)}-01-01"
            except (ValueError, TypeError):
                release_date = None
        else:
            release_date = None

        return {
            "original_api_id": str(data.get("mal_id", "")),
            "title": data.get("title") or "Unknown",
            "description": data.get("synopsis"),
            "media_type_name": "Anime" if is_anime else "Manga",
            "release_date": release_date,
            "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
            "banner_url": None,
            "rating": float(data.get("score")) if data.get("score") else None,
        }

    def _fetch_and_cache_related_jikan(
        self,
        parent_api_id: str,
        mal_id: int,
        api,  # JikanService instance
        is_anime: bool,
    ) -> None:
        """
        Fetch relations from Jikan for an anime/manga, then fetch full details
        for each related entry, cache them, and create pairwise relations.
        Non-recursive — only the direct relations of the parent are processed.
        """
        relations = api.get_anime_relations(mal_id) if is_anime else api.get_manga_relations(mal_id)
        if not relations:
            logger.warning("No relations returned for mal_id=%s (is_anime=%s)", mal_id, is_anime)
            return

        logger.info("Processing %d relation groups for mal_id=%s", len(relations), mal_id)

        for group in relations:
            relation_name = group.get("relation", "Related")
            for entry in group.get("entry", []) or []:
                rel_mal_id = entry.get("mal_id")
                if not rel_mal_id:
                    continue

                rel_api_id = str(rel_mal_id)

                # Skip if already in DB
                existing_media = Media.query.filter_by(original_api_id=rel_api_id).first()
                if existing_media:
                    # Create relation even if media already exists
                    self._create_media_relation(parent_api_id, rel_api_id, relation_name)
                    logger.info("Created relation: %s <-[%s]-> %s (existing media)", parent_api_id, relation_name, rel_api_id)
                    continue

                # Fetch full details (retries built into get_anime_full/get_manga_full)
                rel_type = entry.get("type", "")
                if rel_type == "manga":
                    full = api.get_manga_full(rel_mal_id)
                else:
                    full = api.get_anime_full(rel_mal_id)

                if not full:
                    logger.warning("Could not fetch full details for related mal_id=%s", rel_mal_id)
                    continue

                try:
                    norm = self._normalize_jikan_entry(full, rel_type != "manga")
                    self._cache_media(
                        original_api_id=norm["original_api_id"],
                        title=norm["title"],
                        media_type_name=norm["media_type_name"],
                        description=norm["description"],
                        release_date_str=norm["release_date"],
                        cover_url=norm["cover_url"],
                        banner_url=norm["banner_url"],
                        rating=norm["rating"],
                    )
                    db.session.commit()
                    # Create pairwise relation
                    self._create_media_relation(parent_api_id, norm["original_api_id"], relation_name)
                    db.session.commit()
                    logger.info("Cached related media %s and created relation: %s <-[%s]-> %s",
                                norm["original_api_id"], parent_api_id, relation_name, norm["original_api_id"])
                except Exception:
                    db.session.rollback()
                    logger.exception("Failed to cache related media for mal_id=%s", rel_mal_id)

    def _cache_media(
        self,
        original_api_id: str,
        title: str,
        media_type_name: str,
        description: str | None = None,
        release_date_str: str | None = None,
        cover_url: str | None = None,
        banner_url: str | None = None,
        rating: float | None = None,
    ) -> Media:
        """Create and persist a Media entry, returning the Media object."""
        media_type_id = self._ensure_media_type(media_type_name)

        parsed_date = None
        if release_date_str:
            try:
                parsed_date = datetime.strptime(release_date_str, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                # Try year-only format
                try:
                    parsed_date = datetime.strptime(release_date_str, "%Y").date()
                except (ValueError, TypeError):
                    parsed_date = None

        media = Media(
            id=str(uuid.uuid4()),
            original_api_id=original_api_id,
            title=title,
            media_type=media_type_id,
            description=description,
            release_date=parsed_date,
            cover_url=cover_url,
            banner_url=banner_url,
            average_rating=rating or 0.0,
        )
        db.session.add(media)
        db.session.flush()
        return media

    def deep_search_medias(
        self,
        query: str,
        movie_api,
        game_api,
        anime_api=None,
        manga_api=None,
    ) -> list[dict]:
        """
        Search across all external media APIs in parallel, cache results in DB,
        and return combined results.

        Args:
            query: Search query string.
            movie_api: Instance of MovieAPIService (required).
            game_api: Instance of IGDBService (required).
            anime_api: Instance of JikanService (optional).
            manga_api: Instance of JikanService (optional).

        Returns:
            List of media dicts with keys: id, titre, image, score, type, source.
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed

        results: list[dict] = []

        # ═══════════════════════════════════════════════════════════
        # Phase 1 — Fire all API searches in parallel
        # ═══════════════════════════════════════════════════════════
        movie_results: list[dict] = []
        tv_results: list[dict] = []
        game_results: list[dict] = []
        anime_results: list[dict] = []
        manga_results: list[dict] = []

        def _search_movies():
            try:
                return movie_api.search_movies(query) if movie_api else []
            except Exception:
                return []

        def _search_tv():
            try:
                return movie_api.search_tv_shows(query, exclude_anime=True) if movie_api else []
            except Exception:
                return []

        def _search_games():
            try:
                return game_api.search_games(query) if game_api else []
            except Exception:
                return []

        def _search_anime():
            try:
                return anime_api.search_anime(query) if anime_api else []
            except Exception:
                return []

        def _search_manga():
            try:
                return manga_api.search_manga(query) if manga_api else []
            except Exception:
                return []

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(_search_movies): "movies",
                executor.submit(_search_tv): "tv",
                executor.submit(_search_games): "games",
                executor.submit(_search_anime): "anime",
                executor.submit(_search_manga): "manga",
            }
            for future in as_completed(futures):
                kind = futures[future]
                try:
                    data = future.result()
                except Exception:
                    data = []
                if kind == "movies":
                    movie_results = data
                elif kind == "tv":
                    tv_results = data
                elif kind == "games":
                    game_results = data
                elif kind == "anime":
                    anime_results = data
                else:
                    manga_results = data

        # ═══════════════════════════════════════════════════════════
        # Phase 2 — Check DB for existing, collect what needs fetching
        # ═══════════════════════════════════════════════════════════

        # Movies: collect new movies for collection fetching
        movies_to_fetch: list[str] = []  # list of movie API IDs
        for movie in movie_results:
            api_id = movie.get("original_api_id", "")
            existing = Media.query.filter_by(original_api_id=api_id).first()
            if existing:
                mt = MediaType.query.filter_by(id=existing.media_type).first()
                results.append({
                    "id": existing.id, "titre": existing.title,
                    "image": existing.cover_url, "score": existing.average_rating,
                    "type": mt.name if mt else "Movie", "source": "cache",
                })
            else:
                movies_to_fetch.append(api_id)

        # TV: for each new show, we'll need to fetch seasons
        tv_to_fetch: list[str] = []  # list of show_api_ids
        for show in tv_results:
            show_api_id = show.get("original_api_id", "")
            existing = Media.query.filter_by(original_api_id=show_api_id).first()
            if existing:
                mt = MediaType.query.filter_by(id=existing.media_type).first()
                results.append({
                    "id": existing.id, "titre": existing.title,
                    "image": existing.cover_url, "score": existing.average_rating,
                    "type": mt.name if mt else "TV Show", "source": "cache",
                })
            else:
                tv_to_fetch.append(show_api_id)

        # Games: cache if new, collect related IDs for batch fetch
        games_to_cache: list[dict] = []
        all_related_ids: set[int] = set()
        for game in game_results:
            api_id = game.get("original_api_id", "")
            existing = Media.query.filter_by(original_api_id=api_id).first()
            if existing:
                mt = MediaType.query.filter_by(id=existing.media_type).first()
                results.append({
                    "id": existing.id, "titre": existing.title,
                    "image": existing.cover_url, "score": existing.average_rating,
                    "type": mt.name if mt else "Game", "source": "cache",
                })
            else:
                games_to_cache.append(game)
                for rid in game.get("related_game_ids", []):
                    rid_int = int(rid)
                    if not Media.query.filter_by(original_api_id=str(rid_int)).first():
                        all_related_ids.add(rid_int)

        # Anime: simple — cache if new (anime from Jikan are already split by season,
        # so no need to fetch seasons separately)
        anime_to_cache: list[dict] = []
        for anime in anime_results:
            api_id = anime.get("original_api_id", "")
            existing = Media.query.filter_by(original_api_id=api_id).first()
            if existing:
                mt = MediaType.query.filter_by(id=existing.media_type).first()
                results.append({
                    "id": existing.id, "titre": existing.title,
                    "image": existing.cover_url, "score": existing.average_rating,
                    "type": mt.name if mt else "Anime", "source": "cache",
                })
            else:
                anime_to_cache.append(anime)

        # Manga: simple — cache if new
        manga_to_cache: list[dict] = []
        for manga in manga_results:
            api_id = manga.get("original_api_id", "")
            existing = Media.query.filter_by(original_api_id=api_id).first()
            if existing:
                mt = MediaType.query.filter_by(id=existing.media_type).first()
                results.append({
                    "id": existing.id, "titre": existing.title,
                    "image": existing.cover_url, "score": existing.average_rating,
                    "type": mt.name if mt else "Manga", "source": "cache",
                })
            else:
                manga_to_cache.append(manga)

        # ═══════════════════════════════════════════════════════════
        # Phase 3 — Fetch all details in parallel
        # ═══════════════════════════════════════════════════════════

        # Movies: fetch movie + collection siblings for all new movies in parallel
        movie_entries: list[list[dict]] = []  # list of [parent_movie, sibling_movie, ...]
        if movies_to_fetch and movie_api:
            def _fetch_movie_collection(mid_str):
                try:
                    return movie_api.get_movie_with_collection(int(mid_str))
                except Exception:
                    return []

            with ThreadPoolExecutor(max_workers=min(len(movies_to_fetch), 5)) as executor:
                mfutures = {executor.submit(_fetch_movie_collection, mid): mid for mid in movies_to_fetch}
                for future in as_completed(mfutures):
                    try:
                        movie_entries.append(future.result())
                    except Exception:
                        pass

        # TV: fetch show+seasons for all new shows in parallel
        tv_entries: list[list[dict]] = []  # list of [show_entry, season_entry, ...]
        if tv_to_fetch and movie_api:
            def _fetch_tv(show_id_str):
                try:
                    return movie_api.get_tv_show_with_seasons(int(show_id_str))
                except Exception:
                    return []

            with ThreadPoolExecutor(max_workers=min(len(tv_to_fetch), 5)) as executor:
                tv_futures = {executor.submit(_fetch_tv, sid): sid for sid in tv_to_fetch}
                for future in as_completed(tv_futures):
                    try:
                        tv_entries.append(future.result())
                    except Exception:
                        pass

        # Games: batch-fetch all related game IDs in one call
        related_games_map: dict[str, dict] = {}  # original_api_id -> game dict
        if all_related_ids and game_api:
            try:
                batch = game_api.get_games_by_ids(list(all_related_ids))
                for rg in batch:
                    related_games_map[rg["original_api_id"]] = rg
            except Exception:
                pass

        # ═══════════════════════════════════════════════════════════
        # Phase 4 — Cache everything sequentially (DB is not thread-safe)
        # ═══════════════════════════════════════════════════════════

        seen_ids: set[str] = {r["id"] for r in results}

        # Movies (with collection siblings → pairwise relations)
        for entries in movie_entries:
            parent_api_id: str | None = None
            for entry in entries:
                api_id = entry.get("original_api_id", "")
                existing = Media.query.filter_by(original_api_id=api_id).first()
                if existing:
                    if parent_api_id is None:
                        parent_api_id = api_id
                    elif parent_api_id != api_id:
                        self._create_media_relation(parent_api_id, api_id, "Related")
                    continue
                try:
                    media = self._cache_media(
                        original_api_id=api_id,
                        title=entry.get("title") or "Unknown",
                        media_type_name=entry.get("media_type", "Movie"),
                        description=entry.get("description"),
                        release_date_str=entry.get("release_date"),
                        cover_url=entry.get("cover_url"),
                        banner_url=entry.get("banner_url"),
                        rating=entry.get("rating"),
                    )
                    db.session.commit()
                    if parent_api_id is None:
                        parent_api_id = api_id
                    else:
                        self._create_media_relation(parent_api_id, api_id, "Related")
                        db.session.commit()
                    results.append({
                        "id": media.id, "titre": media.title,
                        "image": media.cover_url, "score": media.average_rating,
                        "type": "Movie", "source": "fresh",
                    })
                except Exception:
                    db.session.rollback()

        # TV shows + seasons → pairwise relations
        for entries in tv_entries:
            parent_api_id: str | None = None
            for entry in entries:
                api_id = entry.get("original_api_id", "")
                existing = Media.query.filter_by(original_api_id=api_id).first()
                if existing:
                    if entry.get("media_type") == "TV Show":
                        parent_api_id = api_id
                    elif parent_api_id and parent_api_id != api_id:
                        self._create_media_relation(parent_api_id, api_id, "Related")
                    continue
                try:
                    media = self._cache_media(
                        original_api_id=api_id,
                        title=entry.get("title") or "Unknown",
                        media_type_name=entry.get("media_type", "TV Show"),
                        description=entry.get("description"),
                        release_date_str=entry.get("release_date"),
                        cover_url=entry.get("cover_url"),
                        banner_url=entry.get("banner_url"),
                        rating=entry.get("rating"),
                    )
                    db.session.commit()
                    if entry.get("media_type") == "TV Show":
                        parent_api_id = api_id
                    elif parent_api_id:
                        self._create_media_relation(parent_api_id, api_id, "Related")
                        db.session.commit()
                    results.append({
                        "id": media.id, "titre": media.title,
                        "image": media.cover_url, "score": media.average_rating,
                        "type": entry.get("media_type", "TV Show"), "source": "fresh",
                    })
                except Exception:
                    db.session.rollback()

        # Games → pairwise relations
        for game in games_to_cache:
            api_id = game.get("original_api_id", "")
            try:
                media = self._cache_media(
                    original_api_id=api_id,
                    title=game.get("title") or "Unknown",
                    media_type_name="Game",
                    description=game.get("summary"),
                    release_date_str=game.get("first_release_date"),
                    cover_url=game.get("cover_url"),
                    banner_url=game.get("banner_url"),
                    rating=game.get("rating"),
                )
                db.session.commit()
                results.append({
                    "id": media.id, "titre": media.title,
                    "image": media.cover_url, "score": media.average_rating,
                    "type": "Game", "source": "fresh",
                })

                # Cache related games and create pairwise relations
                related_ids = game.get("related_game_ids", [])
                for rid in related_ids:
                    rel_game = related_games_map.get(rid)
                    if not rel_game:
                        continue
                    rel_api_id = str(rid)
                    if not Media.query.filter_by(original_api_id=rel_api_id).first():
                        try:
                            self._cache_media(
                                original_api_id=rel_api_id,
                                title=rel_game.get("title") or "Unknown",
                                media_type_name="Game",
                                description=rel_game.get("summary"),
                                release_date_str=rel_game.get("first_release_date"),
                                cover_url=rel_game.get("cover_url"),
                                banner_url=rel_game.get("banner_url"),
                                rating=rel_game.get("rating"),
                            )
                            db.session.commit()
                        except Exception:
                            db.session.rollback()
                    self._create_media_relation(api_id, rel_api_id, "Related")
                    db.session.commit()
            except Exception:
                db.session.rollback()

        # Anime — cache if new, then fetch relations
        for anime in anime_to_cache:
            try:
                api_id = anime.get("original_api_id", "")
                media = self._cache_media(
                    original_api_id=api_id,
                    title=anime.get("title") or "Unknown",
                    media_type_name="Anime",
                    description=anime.get("description"),
                    release_date_str=anime.get("release_date"),
                    cover_url=anime.get("cover_url"),
                    banner_url=anime.get("banner_url"),
                    rating=anime.get("rating"),
                )
                db.session.commit()
                results.append({
                    "id": media.id, "titre": media.title,
                    "image": media.cover_url, "score": media.average_rating,
                    "type": "Anime", "source": "fresh",
                })

                # Fetch and cache related anime (non-recursive)
                if anime_api:
                    mal_id = int(anime.get("original_api_id", "0"))
                    if mal_id:
                        self._fetch_and_cache_related_jikan(
                            parent_api_id=api_id,
                            mal_id=mal_id,
                            api=anime_api,
                            is_anime=True,
                        )
            except Exception:
                db.session.rollback()
                logger.exception("Failed to process anime original_api_id=%s", anime.get("original_api_id", "?"))

        # Manga — cache if new, then fetch relations
        for manga in manga_to_cache:
            try:
                api_id = manga.get("original_api_id", "")
                media = self._cache_media(
                    original_api_id=api_id,
                    title=manga.get("title") or "Unknown",
                    media_type_name="Manga",
                    description=manga.get("description"),
                    release_date_str=manga.get("release_date"),
                    cover_url=manga.get("cover_url"),
                    banner_url=manga.get("banner_url"),
                    rating=manga.get("rating"),
                )
                db.session.commit()
                results.append({
                    "id": media.id, "titre": media.title,
                    "image": media.cover_url, "score": media.average_rating,
                    "type": "Manga", "source": "fresh",
                })

                # Fetch and cache related manga (non-recursive)
                if manga_api:
                    mal_id = int(manga.get("original_api_id", "0"))
                    if mal_id:
                        self._fetch_and_cache_related_jikan(
                            parent_api_id=api_id,
                            mal_id=mal_id,
                            api=manga_api,
                            is_anime=False,
                        )
            except Exception:
                db.session.rollback()
                logger.exception("Failed to process manga original_api_id=%s", manga.get("original_api_id", "?"))

        # ═══════════════════════════════════════════════════════════
        # Phase 5 — Local DB search (no limit — get all cached matches)
        # ═══════════════════════════════════════════════════════════
        try:
            local_results = self.search_medias(query, limit=None)
        except Exception:
            local_results = []

        for local in local_results:
            if local.get("id") and local["id"] not in seen_ids:
                seen_ids.add(local["id"])
                results.append({
                    "id": local["id"], "titre": local["titre"],
                    "image": local["image"], "score": local["score"],
                    "type": local["type"], "source": "local",
                })

        return results
