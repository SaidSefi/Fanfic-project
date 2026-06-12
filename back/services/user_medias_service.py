from datetime import datetime, date
from typing import TypedDict, Union, List, Any
import uuid

from schemas.db import db
from schemas.models import User, UserMedia, Media


class UserMediaItemDict(TypedDict):
    media_name: str
    image: str | None
    status: str
    rating: float | None
    liked: bool | None
    review_text: str | None
    consumed_at: str | None
    updated_at: str


class UserMediaReviewDict(TypedDict):
    user_id: str
    media_id: str
    review: str | None
    rating: float | None
    created_at: str | None


class UpdateUserMediaPayloadDict(TypedDict, total=False):
    status: str
    rating: float
    review_text: str


class UserMediasService:
    def get_user_medias(self, user_id: str, status: str | None = None) -> List[UserMediaItemDict] | None:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return None

        query = db.session.query(UserMedia, Media).join(Media, UserMedia.media_id == Media.id).filter(UserMedia.user_id == user_id)
        if status:
            query = query.filter(UserMedia.status == status)

        items = query.all()

        return [
            {
                'media_name': media.title,
                'image': media.cover_url,
                'status': user_media.status,
                'rating': user_media.rating,
                'updated_at': user_media.review_created_at.isoformat() if user_media.review_created_at else user_media.added_at.isoformat(),
            }
            for user_media, media in items
        ]

    def get_user_media(self, user_id: str, media_id: str) -> UserMediaItemDict | None:
        result = (
            db.session.query(UserMedia, Media)
            .join(Media, UserMedia.media_id == Media.id)
            .filter(UserMedia.user_id == user_id, UserMedia.media_id == media_id)
            .first()
        )
        if not result:
            return None

        user_media, media = result
        return {
            'media_name': media.title,
            'image': media.cover_url,
            'status': user_media.status,
            'rating': user_media.rating,
            'liked': user_media.liked,
            'review_text': user_media.review_text,
            'consumed_at': user_media.consumed_at.isoformat() if user_media.consumed_at else None,
            'updated_at': user_media.review_created_at.isoformat() if user_media.review_created_at else user_media.added_at.isoformat(),
        }

    def update_user_media(
        self, user_id: str, media_id: str, payload: UpdateUserMediaPayloadDict
    ) -> Union[UserMediaItemDict, str]:
        item = UserMedia.query.filter_by(user_id=user_id, media_id=media_id).first()
        if not item:
            return 'user_media_not_found'

        if 'status' in payload:
            item.status = payload.get('status')
        if 'rating' in payload:
            item.rating = payload.get('rating')
        if 'review_text' in payload:
            item.review_text = payload.get('review_text')
            item.review_created_at = datetime.utcnow()

        db.session.commit()

        return {
            'media_name': item.media.title,
            'status': item.status,
            'rating': item.rating,
            'updated_at': item.review_created_at.isoformat() if item.review_created_at else item.added_at.isoformat(),
        }

    def delete_user_media(self, user_id: str, media_id: str) -> Union[bool, str]:
        item = UserMedia.query.filter_by(user_id=user_id, media_id=media_id).first()
        if not item:
            return 'user_media_not_found'

        db.session.delete(item)
        db.session.commit()

        return True

    def delete_user_media_review(self, user_id: str, media_id: str) -> Union[bool, str]:
        """Clear only the review and rating — keep the library entry."""
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return 'user_not_found'

        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        user_media = UserMedia.query.filter_by(user_id=user.id, media_id=media.id).first()
        if not user_media or (user_media.review_text is None and user_media.rating is None):
            return 'review_not_found'

        user_media.review_text = None
        user_media.rating = None
        user_media.review_created_at = None
        db.session.commit()

        return True

    def get_user_media_review(self, user_id: str, media_id: str) -> Union[UserMediaReviewDict, str, None]:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return 'user_not_found'

        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        user_media = UserMedia.query.filter_by(user_id=user.id, media_id=media.id).first()
        if not user_media or (user_media.review_text is None and user_media.rating is None):
            return None

        return {
            'user_id': user.id,
            'media_id': media.id,
            'review': user_media.review_text,
            'rating': user_media.rating,
            'created_at': user_media.review_created_at.isoformat() if user_media.review_created_at else None,
        }

    def upsert_user_media(
        self,
        user_id: str,
        media_id: str,
        status: str | None = None,
        rating: float | None = None,
        liked: bool | None = None,
        review_text: str | None = None,
        consumed_at: str | None = None,
    ) -> dict[str, Any]:
        """
        Create, update, or delete a UserMedia row.

        Fields with None/0/False/\"\" are treated as \"clear this field\".
        If ALL fields are cleared → delete the row (if it exists).
        Otherwise → create or update with the provided values.
        """
        item = UserMedia.query.filter_by(user_id=user_id, media_id=media_id).first()

        # Normalize: what values are we actually setting?
        effective_status = status if status else None
        effective_rating = rating if rating and rating > 0 else None
        effective_liked = liked if liked else None
        effective_review = review_text if review_text else None
        effective_date = None
        if consumed_at:
            try:
                effective_date = datetime.strptime(consumed_at, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass

        # Check if everything is cleared
        everything_cleared = (
            not effective_status
            and effective_rating is None
            and not effective_liked
            and not effective_review
            and effective_date is None
        )

        if everything_cleared:
            if item:
                db.session.delete(item)
                db.session.commit()
                return {'action': 'deleted'}
            return {'action': 'none'}

        # ── Create or update ──
        if item is None:
            item = UserMedia(
                id=uuid.uuid4().hex,
                user_id=user_id,
                media_id=media_id,
                status=effective_status or 'wishlist',
                rating=effective_rating,
                liked=effective_liked if effective_liked else None,
                review_text=effective_review,
                consumed_at=effective_date,
            )
            db.session.add(item)
            db.session.commit()
            return {'action': 'created'}

        # Update existing
        if effective_status is not None:
            item.status = effective_status
        if effective_rating is not None:
            item.rating = effective_rating
        elif rating is not None and rating == 0:
            item.rating = None
        if liked is not None:
            item.liked = effective_liked if effective_liked else None
        if review_text is not None:
            item.review_text = effective_review
            if effective_review:
                item.review_created_at = datetime.utcnow()
            else:
                item.review_created_at = None
        if consumed_at is not None:
            item.consumed_at = effective_date

        db.session.commit()
        return {'action': 'updated'}
