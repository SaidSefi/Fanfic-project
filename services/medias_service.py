import uuid
from datetime import datetime
from sqlalchemy import or_, func

from schemas.db import db
from schemas.models import User, Media, MediaType, UserMedia, RelatedMedia, MediaRelationType


class MediasService:
    def get_medias(self, ids=None, genre=None, year=None, popularity=None, rating=None):
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
                'titre': media.title,
                'image': media.cover_url,
                'score': media.average_rating,
                'type': media_type.name,
            }
            for media, media_type in items
        ]

    def search_medias(self, query_text):
        medias = (
            db.session.query(Media, MediaType)
            .join(MediaType, Media.media_type == MediaType.id)
            .filter(
                or_(
                    Media.title.ilike(f'%{query_text}%'),
                    Media.description.ilike(f'%{query_text}%')
                )
            )
            .all()
        )

        return [
            {
                'titre': media.title,
                'image': media.cover_url,
                'score': media.average_rating,
                'type': media_type.name,
            }
            for media, media_type in medias
        ]

    def get_media(self, media_id):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        total_reviews = (
            UserMedia.query.filter_by(media_id=media.id)
            .filter(
                or_(UserMedia.review_text.isnot(None), UserMedia.rating.isnot(None))
            )
            .count()
        )

        media_type = MediaType.query.filter_by(id=media.media_type).first()

        return {
            'titre': media.title,
            'cover': media.cover_url,
            'banner': media.banner_url,
            'synopsis': media.description,
            'release_date': media.release_date.isoformat() if media.release_date else None,
            'average_rating': media.average_rating,
            'total_reviews': total_reviews,
            'type': media_type.name if media_type else None,
        }

    def get_media_reviews(self, media_id):
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

    def get_media_type(self, media_id):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        media_type = MediaType.query.filter_by(id=media.media_type).first()
        if not media_type:
            return None

        return {'type': media_type.name}

    def get_media_related(self, media_id):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        if media.related_media is None:
            return []

        related = (
            Media.query
            .filter(Media.related_media == media.related_media)
            .filter(Media.id != media.id)
            .all()
        )

        return [
            {
                'cover': related_media.cover_url,
                'nom': related_media.title,
            }
            for related_media in related
        ]

    def get_media_relation_type(self, media_id):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        related_model = RelatedMedia.query.filter_by(id=media.related_media).first()
        if not related_model:
            return {'type': None}

        relation_type = MediaRelationType.query.filter_by(id=related_model.media_relation_type_id).first()
        return {'type': relation_type.name if relation_type else None}

    def add_media_review(self, media_id, payload):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        user = User.query.filter_by(username=payload.get('username')).first()
        if not user:
            return 'user_not_found'

        user_media = UserMedia.query.filter_by(user_id=user.id, media_id=media.id).first()
        if not user_media:
            user_media = UserMedia(
                id=str(uuid.uuid4()),
                user_id=user.id,
                media_id=media.id,
                status='wishlist',
            )
            db.session.add(user_media)

        user_media.review_text = payload.get('review_text')
        user_media.rating = payload.get('rating')
        user_media.review_created_at = datetime.utcnow()

        db.session.commit()

        return {
            'user': user.username,
            'review': user_media.review_text,
            'rating': user_media.rating,
            'created_at': user_media.review_created_at.isoformat(),
        }

    def add_media_to_library(self, media_id, payload):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        user = User.query.filter_by(username=payload.get('username')).first()
        if not user:
            return 'user_not_found'

        user_media = UserMedia.query.filter_by(user_id=user.id, media_id=media.id).first()
        if user_media:
            if 'status' in payload:
                user_media.status = payload.get('status')
            db.session.commit()
            return {
                'id': user_media.id,
                'media_id': media.id,
                'status': user_media.status,
            }

        user_media = UserMedia(
            id=str(uuid.uuid4()),
            user_id=user.id,
            media_id=media.id,
            status=payload.get('status', 'wishlist'),
            rating=payload.get('rating'),
            review_text=payload.get('review_text'),
            review_created_at=datetime.utcnow() if payload.get('review_text') else None,
        )
        db.session.add(user_media)
        db.session.commit()

        return {
            'id': user_media.id,
            'media_id': media.id,
            'status': user_media.status,
        }

    def update_media_library(self, media_id, payload):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        user = User.query.filter_by(username=payload.get('username')).first()
        if not user:
            return 'user_not_found'

        user_media = UserMedia.query.filter_by(user_id=user.id, media_id=media.id).first()
        if not user_media:
            user_media = UserMedia(
                id=str(uuid.uuid4()),
                user_id=user.id,
                media_id=media.id,
            )
            db.session.add(user_media)

        if 'status' in payload:
            user_media.status = payload.get('status')
        if 'rating' in payload:
            user_media.rating = payload.get('rating')
        if 'review_text' in payload:
            user_media.review_text = payload.get('review_text')
            user_media.review_created_at = datetime.utcnow()

        db.session.commit()

        return {
            'id': user_media.id,
            'media_id': media.id,
            'status': user_media.status,
            'rating': user_media.rating,
        }

    def delete_media_review(self, media_id, username):
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        user_media = UserMedia.query.filter_by(user_id=user.id, media_id=media.id).first()
        if not user_media or (user_media.review_text is None and user_media.rating is None):
            return 'review_not_found'

        user_media.review_text = None
        user_media.rating = None
        user_media.review_created_at = None
        db.session.commit()

        return True
