"""
Canonical media type definitions — single source of truth for backend and frontend.

The order of this list determines the autoincrement IDs on a fresh database.
Always add new types at the END to avoid shifting existing IDs.

Categories:
  "primary" — appears in searches, deep search, general browsing
  "child"   — only in specific contexts (related media, profile, etc.)
"""
from typing import TypedDict, Literal


class MediaTypeDef(TypedDict):
    name: str
    category: Literal["primary", "child"]


# ═══════════════════════════════════════════════════════════════════
# Ordered list — DO NOT reorder or insert in the middle.
# New types go at the bottom.
# ═══════════════════════════════════════════════════════════════════
MEDIA_TYPES: list[MediaTypeDef] = [
    {"name": "Movie",          "category": "primary"},
    {"name": "Game",           "category": "primary"},
    {"name": "TV Show",        "category": "primary"},
    {"name": "TV Season",      "category": "child"},
    {"name": "Anime",          "category": "primary"},
    {"name": "Manga",          "category": "primary"},
]

# Convenience accessors
MEDIA_TYPE_NAMES: list[str] = [t["name"] for t in MEDIA_TYPES]

PRIMARY_TYPE_NAMES: list[str] = [
    t["name"] for t in MEDIA_TYPES if t["category"] == "primary"
]

CHILD_TYPE_NAMES: list[str] = [
    t["name"] for t in MEDIA_TYPES if t["category"] == "child"
]


def is_primary(name: str) -> bool:
    return name in PRIMARY_TYPE_NAMES


def is_child(name: str) -> bool:
    return name in CHILD_TYPE_NAMES


def seed_media_types(db):
    """
    Ensure all canonical media types exist in the database.
    On a fresh DB this produces deterministic autoincrement IDs.
    On an existing DB it adds any missing types (without reordering).
    """
    from schemas.models import MediaType

    for mt in MEDIA_TYPES:
        existing = MediaType.query.filter_by(name=mt["name"]).first()
        if not existing:
            db.session.add(MediaType(name=mt["name"]))

    db.session.commit()


# ═══════════════════════════════════════════════════════════════════
# Media relation types
# ═══════════════════════════════════════════════════════════════════
MEDIA_RELATION_TYPES = [
    "Standard",           # default / catch-all
    "Prequel",
    "Sequel",
    "Side story",
    "Spin-off",
    "Alternative version",
    "Adaptation",
    "Parent story",
    "Summary",
    "Related",            # generic relation (used for anime/manga Jikan relations)
]


def seed_media_relation_types(db):
    """Ensure all canonical media relation types exist in the database."""
    from schemas.models import MediaRelationType

    for name in MEDIA_RELATION_TYPES:
        existing = MediaRelationType.query.filter_by(name=name).first()
        if not existing:
            db.session.add(MediaRelationType(name=name))

    db.session.commit()
