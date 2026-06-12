import uuid

from schemas.db import db
from schemas.models import User, UserTopItem, Media, MediaType


class TopsService:
    def get_user_top_medias(self, username):
        user = User.query.filter_by(username=username).first()
        if not user:
            return None

        top_items = (
            db.session.query(UserTopItem, Media, MediaType)
            .join(Media, UserTopItem.media_id == Media.id)
            .join(MediaType, Media.media_type == MediaType.id)
            .filter(UserTopItem.user_id == user.id)
            .order_by(UserTopItem.position)
            .all()
        )

        return [
            {
                'cover': media.cover_url,
                'nom': media.title,
                'rating': media.average_rating,
                'type': media_type.name,
            }
            for _, media, media_type in top_items
        ]

    def add_top_item(self, username, payload):
        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        media_id = payload.get('media_id')
        if not media_id:
            return 'missing_media_id'

        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        top_id = payload.get('top_id', 1)

        position = payload.get('position')
        if position is not None:
            # Shift existing items at or after this position down by 1
            UserTopItem.query.filter(
                UserTopItem.user_id == user.id,
                UserTopItem.top_id == top_id,
                UserTopItem.position >= position
            ).update(
                {UserTopItem.position: UserTopItem.position + 1},
                synchronize_session=False
            )
        else:
            max_position = (
                db.session.query(db.func.max(UserTopItem.position))
                .filter(UserTopItem.user_id == user.id, UserTopItem.top_id == top_id)
                .scalar()
            )
            position = (max_position or 0) + 1

        top_item = UserTopItem(
            id=str(uuid.uuid4()),
            user_id=user.id,
            top_id=top_id,
            media_id=media.id,
            position=position,
        )
        db.session.add(top_item)
        db.session.commit()

        return {
            'id': top_item.id,
            'top_id': top_item.top_id,
            'media_id': media.id,
            'position': top_item.position,
        }

    def update_top_item_position(self, username, item_id, position):
        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        top_item = UserTopItem.query.filter_by(id=item_id, user_id=user.id).first()
        if not top_item:
            return 'item_not_found'

        old_position = top_item.position

        if old_position != position:
            if old_position < position:
                # Moving down: shift items between old+1 and new position up by 1
                UserTopItem.query.filter(
                    UserTopItem.user_id == user.id,
                    UserTopItem.top_id == top_item.top_id,
                    UserTopItem.position > old_position,
                    UserTopItem.position <= position
                ).update(
                    {UserTopItem.position: UserTopItem.position - 1},
                    synchronize_session=False
                )
            else:
                # Moving up: shift items between new and old-1 position down by 1
                UserTopItem.query.filter(
                    UserTopItem.user_id == user.id,
                    UserTopItem.top_id == top_item.top_id,
                    UserTopItem.position >= position,
                    UserTopItem.position < old_position
                ).update(
                    {UserTopItem.position: UserTopItem.position + 1},
                    synchronize_session=False
                )

            top_item.position = position

        db.session.commit()

        return {
            'id': top_item.id,
            'position': top_item.position,
        }

    def remove_top_item(self, username, item_id):
        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        top_item = UserTopItem.query.filter_by(id=item_id, user_id=user.id).first()
        if not top_item:
            return 'item_not_found'

        removed_position = top_item.position
        db.session.delete(top_item)

        # Close the gap: shift items after the removed position up by 1
        UserTopItem.query.filter(
            UserTopItem.user_id == user.id,
            UserTopItem.top_id == top_item.top_id,
            UserTopItem.position > removed_position
        ).update(
            {UserTopItem.position: UserTopItem.position - 1},
            synchronize_session=False
        )

        db.session.commit()

        return True
