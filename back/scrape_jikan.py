"""
Bulk scraper for anime and manga via Jikan v4 API — FULLY SELF-CONTAINED.

Uses GET /anime?page=N and GET /manga?page=N to fetch ALL entries
with pagination. Every API call is sequential and rate-limited.
No dependencies on JikanService or MediasService — all logic is inline.

Rate limits (with safe margin):
  - 1 request every 2.0 seconds = 30/min (limit is 60/min)
  - Configurable retries with exponential backoff

Usage:
    python scrape_jikan.py                  # full scrape (anime + manga)
    python scrape_jikan.py --anime-only      # only anime
    python scrape_jikan.py --manga-only      # only manga
    python scrape_jikan.py --reset           # restart from page 1
    python scrape_jikan.py --retries 10      # 10 retries per call
    python scrape_jikan.py --delay 1.5       # 1.5s between requests
"""
import sys
import os
import time
import json
import uuid
import argparse
import logging
from datetime import datetime, timedelta
from pathlib import Path

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from schemas.db import db
from schemas.models import Media, MediaType, RelatedMedia, MediaRelationType
from sqlalchemy import and_

# ═══════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════

BASE_URL = "https://api.jikan.moe/v4"
PROGRESS_FILE = Path(__file__).parent / "scrape_progress.json"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("scrape.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("scrape")


# ═══════════════════════════════════════════════════════════════════
# Progress persistence
# ═══════════════════════════════════════════════════════════════════

def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass
    return {"anime_page": 0, "manga_page": 0,
            "total_cached": 0, "total_relations": 0, "total_errors": 0}


def save_progress(state: dict):
    PROGRESS_FILE.write_text(json.dumps(state, indent=2))


# ═══════════════════════════════════════════════════════════════════
# Scraper class — all HTTP + DB logic self-contained
# ═══════════════════════════════════════════════════════════════════

class Scraper:
    """Self-contained Jikan scraper with rate limiting, retries, and DB caching."""

    def __init__(self, max_retries: int = 3, delay: float = 2.0):
        self.max_retries = max_retries
        self.delay = delay
        self.last_request = 0.0
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

    # ── Rate-limited HTTP GET ──────────────────────────────────

    def _wait(self):
        """Block until the rate limit interval has passed."""
        elapsed = time.time() - self.last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)

    def _api_get(self, url: str) -> dict:
        """
        Perform a single GET request with retries and rate limiting.
        EVERY call goes through the rate limiter first — no exceptions.
        Returns the parsed JSON dict, or {"data": []} on total failure.
        """
        self._wait()

        last_exc = None
        for attempt in range(self.max_retries):
            try:
                resp = self.session.get(url, timeout=30)
                self.last_request = time.time()
                if resp.status_code == 429:
                    wait = 2.0 * (2 ** attempt)
                    logger.warning("  429 rate limited, waiting %.1fs (attempt %d/%d)",
                                   wait, attempt + 1, self.max_retries)
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                last_exc = e
                if attempt < self.max_retries - 1:
                    delay = 0.5 * (2 ** attempt)
                    logger.warning("  Request failed (attempt %d/%d), retrying in %.1fs: %s",
                                   attempt + 1, self.max_retries, delay, e)
                    time.sleep(delay)
                self.last_request = time.time()

        logger.error("  Request failed after %d attempts: %s — %s",
                     self.max_retries, url, last_exc)
        return {"data": []}

    # ── Jikan API methods ──────────────────────────────────────

    def get_anime_page(self, page: int) -> dict:
        return self._api_get(f"{BASE_URL}/anime?page={page}")

    def get_manga_page(self, page: int) -> dict:
        return self._api_get(f"{BASE_URL}/manga?page={page}")

    def get_anime_relations(self, mal_id: int) -> list[dict]:
        data = self._api_get(f"{BASE_URL}/anime/{mal_id}/relations")
        return data.get("data", []) or []

    def get_manga_relations(self, mal_id: int) -> list[dict]:
        data = self._api_get(f"{BASE_URL}/manga/{mal_id}/relations")
        return data.get("data", []) or []

    def get_anime_full(self, mal_id: int) -> dict | None:
        data = self._api_get(f"{BASE_URL}/anime/{mal_id}/full")
        return data.get("data")

    def get_manga_full(self, mal_id: int) -> dict | None:
        data = self._api_get(f"{BASE_URL}/manga/{mal_id}/full")
        return data.get("data")

    # ── DB helpers ─────────────────────────────────────────────

    @staticmethod
    def _ensure_media_type(name: str) -> int:
        mt = MediaType.query.filter_by(name=name).first()
        if not mt:
            mt = MediaType(name=name)
            db.session.add(mt)
            db.session.flush()
        return mt.id

    @staticmethod
    def _ensure_relation_type(name: str) -> int:
        rt = MediaRelationType.query.filter_by(name=name).first()
        if not rt:
            rt = MediaRelationType(name=name)
            db.session.add(rt)
            db.session.flush()
        return rt.id

    def cache_media(self, original_api_id: str, title: str,
                    media_type_name: str, description: str | None = None,
                    release_date_str: str | None = None,
                    cover_url: str | None = None,
                    rating: float | None = None) -> Media:
        """Insert a Media row (skip if already exists by original_api_id)."""
        existing = Media.query.filter_by(original_api_id=original_api_id).first()
        if existing:
            return existing

        media_type_id = self._ensure_media_type(media_type_name)

        parsed_date = None
        if release_date_str:
            for fmt in ("%Y-%m-%d", "%Y"):
                try:
                    parsed_date = datetime.strptime(release_date_str, fmt).date()
                    break
                except (ValueError, TypeError):
                    continue

        media = Media(
            id=uuid.uuid4().hex,
            original_api_id=original_api_id,
            title=title,
            media_type=media_type_id,
            description=description,
            release_date=parsed_date,
            cover_url=cover_url,
            banner_url=None,
            average_rating=rating or 0.0,
        )
        db.session.add(media)
        db.session.flush()
        return media

    def create_relation(self, api_id_1: str, api_id_2: str,
                        relation_type_name: str = "Related") -> int | None:
        """
        Create a directed relation: media api_id_1 has relation_type_name
        to media api_id_2. Order matters — duplicates are checked by exact pair only.
        """
        if api_id_1 == api_id_2:
            return None

        existing = RelatedMedia.query.filter(
            and_(RelatedMedia.original_api_id_1 == api_id_1,
                 RelatedMedia.original_api_id_2 == api_id_2)
        ).first()
        if existing:
            return existing.id

        rt_id = self._ensure_relation_type(relation_type_name)
        rel = RelatedMedia(
            original_api_id_1=api_id_1,
            original_api_id_2=api_id_2,
            media_relation_type_id=rt_id,
        )
        db.session.add(rel)
        db.session.flush()
        return rel.id

    # ── Normalization helpers ──────────────────────────────────

    @staticmethod
    def _normalize_full_entry(data: dict, is_anime: bool) -> dict:
        """Convert a Jikan full entry to cache-ready fields."""
        images = data.get("images", {}) or {}
        jpg = images.get("jpg", {}) or {}
        year = data.get("year")
        release_date = f"{int(year)}-01-01" if year else None
        return {
            "original_api_id": str(data.get("mal_id", "")),
            "title": data.get("title") or "Unknown",
            "media_type_name": "Anime" if is_anime else "Manga",
            "description": data.get("synopsis"),
            "release_date_str": release_date,
            "cover_url": jpg.get("large_image_url") or jpg.get("image_url"),
            "rating": float(data["score"]) if data.get("score") else None,
        }

    @staticmethod
    def _normalize_page_entry(item: dict, is_anime: bool) -> dict:
        """Convert a page-list entry to cache-ready fields."""
        images = item.get("images", {}) or {}
        jpg = images.get("jpg", {}) or {}
        cover = jpg.get("large_image_url") or jpg.get("image_url")

        year = item.get("year")
        if year:
            release_date = f"{year}-01-01"
        else:
            date_field = "aired" if is_anime else "published"
            container = item.get(date_field, {}) or {}
            prop = container.get("prop", {}) or {}
            fr = prop.get("from", {}) or {}
            if fr.get("year"):
                release_date = f"{fr['year']}-{fr.get('month', 1):02d}-{fr.get('day', 1):02d}"
            else:
                release_date = None

        return {
            "original_api_id": str(item.get("mal_id", "")),
            "title": item.get("title") or "Unknown",
            "media_type_name": "Anime" if is_anime else "Manga",
            "description": item.get("synopsis"),
            "release_date_str": release_date,
            "cover_url": cover,
            "rating": float(item["score"]) if item.get("score") else None,
        }

    # ── Relation fetching (sequential — every call rate-limited) ──

    def fetch_relations_and_cache(self, parent_api_id: str, mal_id: int,
                                  is_anime: bool) -> int:
        """
        Fetch relations for one anime/manga, cache related entries,
        and create pairwise relations. EVERY API call goes through
        _api_get (rate-limited + retries). Returns relation count.
        """
        relations = (self.get_anime_relations(mal_id) if is_anime
                     else self.get_manga_relations(mal_id))
        if not relations:
            return 0

        count = 0
        for group in relations:
            relation_name = group.get("relation", "Related")
            for entry in group.get("entry", []) or []:
                rel_mal_id = entry.get("mal_id")
                if not rel_mal_id:
                    continue

                rel_api_id = str(rel_mal_id)

                # Already cached?
                existing = Media.query.filter_by(original_api_id=rel_api_id).first()
                if existing:
                    self.create_relation(parent_api_id, rel_api_id, relation_name)
                    db.session.commit()
                    count += 1
                    logger.debug("    Relation (existing): %s <-[%s]-> %s",
                                 parent_api_id, relation_name, rel_api_id)
                    continue

                # Fetch full details (rate-limited)
                rel_type = entry.get("type", "")
                full = (self.get_manga_full(rel_mal_id) if rel_type == "manga"
                        else self.get_anime_full(rel_mal_id))

                if not full:
                    logger.warning("    No full data for related mal_id=%s", rel_mal_id)
                    continue

                try:
                    norm = self._normalize_full_entry(
                        full, is_anime=(rel_type != "manga"))
                    self.cache_media(**{k: v for k, v in norm.items()
                                        if k in ("original_api_id", "title",
                                                 "media_type_name", "description",
                                                 "release_date_str", "cover_url", "rating")})
                    db.session.commit()
                    self.create_relation(parent_api_id, norm["original_api_id"],
                                         relation_name)
                    db.session.commit()
                    count += 1
                    logger.info("    Cached related: %s <-[%s]-> %s",
                                norm["title"], relation_name, parent_api_id)
                except Exception:
                    db.session.rollback()
                    logger.exception("    Failed to cache related mal_id=%s", rel_mal_id)

        return count


# ═══════════════════════════════════════════════════════════════════
# Scraping loops (fully sequential)
# ═══════════════════════════════════════════════════════════════════

def scrape_anime(scraper: Scraper, state: dict):
    """Scrape ALL anime via GET /anime?page=N."""
    page = state["anime_page"] + 1

    while True:
        logger.info("Fetching anime page %d", page)
        resp = scraper.get_anime_page(page)
        data = resp.get("data", []) or []
        pagination = resp.get("pagination", {})

        if not data:
            logger.info("  Empty page %d — stopping.", page)
            break

        for item in data:
            norm = scraper._normalize_page_entry(item, is_anime=True)
            api_id = norm["original_api_id"]
            title = norm["title"]

            if Media.query.filter_by(original_api_id=api_id).first():
                logger.debug("  Skip (exists): %s", title)
                continue

            try:
                scraper.cache_media(**{k: v for k, v in norm.items()
                                       if k in ("original_api_id", "title",
                                                "media_type_name", "description",
                                                "release_date_str", "cover_url", "rating")})
                db.session.commit()
                state["total_cached"] += 1
                logger.info("  [%d] Cached anime: %s", state["total_cached"], title)

                mal_id = int(api_id) if api_id else 0
                if mal_id:
                    rel_count = scraper.fetch_relations_and_cache(
                        api_id, mal_id, is_anime=True)
                    state["total_relations"] += rel_count
            except Exception:
                db.session.rollback()
                state["total_errors"] += 1
                logger.exception("  Failed: %s", title)

        state["anime_page"] = page
        save_progress(state)

        if not pagination.get("has_next_page"):
            logger.info("  Anime complete at page %d.", page)
            break
        page += 1


def scrape_manga(scraper: Scraper, state: dict):
    """Scrape ALL manga via GET /manga?page=N."""
    page = state["manga_page"] + 1

    while True:
        logger.info("Fetching manga page %d", page)
        resp = scraper.get_manga_page(page)
        data = resp.get("data", []) or []
        pagination = resp.get("pagination", {})

        if not data:
            logger.info("  Empty page %d — stopping.", page)
            break

        for item in data:
            norm = scraper._normalize_page_entry(item, is_anime=False)
            api_id = norm["original_api_id"]
            title = norm["title"]

            if Media.query.filter_by(original_api_id=api_id).first():
                logger.debug("  Skip (exists): %s", title)
                continue

            try:
                scraper.cache_media(**{k: v for k, v in norm.items()
                                       if k in ("original_api_id", "title",
                                                "media_type_name", "description",
                                                "release_date_str", "cover_url", "rating")})
                db.session.commit()
                state["total_cached"] += 1
                logger.info("  [%d] Cached manga: %s", state["total_cached"], title)

                mal_id = int(api_id) if api_id else 0
                if mal_id:
                    rel_count = scraper.fetch_relations_and_cache(
                        api_id, mal_id, is_anime=False)
                    state["total_relations"] += rel_count
            except Exception:
                db.session.rollback()
                state["total_errors"] += 1
                logger.exception("  Failed: %s", title)

        state["manga_page"] = page
        save_progress(state)

        if not pagination.get("has_next_page"):
            logger.info("  Manga complete at page %d.", page)
            break
        page += 1


# ═══════════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Bulk scrape Jikan API for anime and manga")
    parser.add_argument("--anime-only", action="store_true")
    parser.add_argument("--manga-only", action="store_true")
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--delay", type=float, default=2.0)
    args = parser.parse_args()

    app = create_app()

    state = load_progress()
    if args.reset:
        state = {"anime_page": 0, "manga_page": 0,
                 "total_cached": 0, "total_relations": 0, "total_errors": 0}
        save_progress(state)

    logger.info("=" * 60)
    logger.info("Scrape starting — %d cached, %d relations, %d errors so far",
                state["total_cached"], state["total_relations"], state["total_errors"])
    logger.info("Rate limit: 1 req / %.1fs = %.0f/min | Max retries: %d",
                args.delay, 60 / args.delay, args.retries)
    logger.info("Anime from page %d | Manga from page %d",
                state["anime_page"] + 1, state["manga_page"] + 1)
    logger.info("=" * 60)

    scraper = Scraper(max_retries=args.retries, delay=args.delay)
    start_time = time.time()

    with app.app_context():
        if args.manga_only:
            scrape_manga(scraper, state)
        elif args.anime_only:
            scrape_anime(scraper, state)
        else:
            scrape_anime(scraper, state)
            scrape_manga(scraper, state)

    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info("Done in %s", str(timedelta(seconds=int(elapsed))))
    logger.info("Cached: %d | Relations: %d | Errors: %d",
                state["total_cached"], state["total_relations"], state["total_errors"])
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
