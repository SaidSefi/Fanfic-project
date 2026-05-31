import uuid
from datetime import datetime
from sqlalchemy import or_

from schemas.db import db
from schemas.models import User, UserMedia, Media


class UserMediasService:
    def get_user_medias(self, user_id, status=None):
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
                'progress': self._derive_progress(user_media.status),
                'updated_at': user_media.review_created_at.isoformat() if user_media.review_created_at else user_media.added_at.isoformat(),
            }
            for user_media, media in items
        ]

    def get_user_media(self, user_id, media_id):
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
            'progress': self._derive_progress(user_media.status),
            'updated_at': user_media.review_created_at.isoformat() if user_media.review_created_at else user_media.added_at.isoformat(),
        }

    def update_user_media(self, user_id, media_id, payload):
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
            'progress': self._derive_progress(item.status),
            'updated_at': item.review_created_at.isoformat() if item.review_created_at else item.added_at.isoformat(),
        }

    def delete_user_media(self, user_id, media_id):
        item = UserMedia.query.filter_by(user_id=user_id, media_id=media_id).first()
        if not item:
            return 'user_media_not_found'

        db.session.delete(item)
        db.session.commit()

        return True

    def get_user_media_review(self, user_id, media_id):
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

    def _derive_progress(self, status):
        if status == 'completed' or status == 'watched':
            return 100
        if status == 'playing':
            return 50
        if status == 'dropped':
            return 0
        if status == 'planned':
            return 0
        return None
