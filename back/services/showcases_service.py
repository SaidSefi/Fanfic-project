import uuid

from schemas.db import db
from schemas.models import User, Showcase, ShowcaseItem, CustomList, ListItem, UserMedia, Media, MediaType


def _build_list_item_data(item: ShowcaseItem) -> dict | None:
    """Build rich data for a list-type showcase item."""
    if not item.list_id:
        return None
    cl = CustomList.query.filter_by(id=item.list_id).first()
    if not cl:
        return None

    # Get covers of the first 3 items in the list
    top_covers = (
        db.session.query(Media.cover_url)
        .join(ListItem, ListItem.media_id == Media.id)
        .filter(ListItem.list_id == cl.id)
        .order_by(ListItem.position)
        .limit(3)
        .all()
    )
    covers = [row[0] for row in top_covers if row[0]]
    count = ListItem.query.filter_by(list_id=cl.id).count()

    return {
        'id': item.id,
        'position': item.position,
        'list': {
            'id': cl.id,
            'title': cl.title,
            'covers': covers,
            'element_count': count,
        },
    }


def _build_review_item_data(item: ShowcaseItem) -> dict | None:
    """Build rich data for a review-type showcase item."""
    if not item.user_media_id:
        return None
    um = UserMedia.query.filter_by(id=item.user_media_id).first()
    if not um:
        return None

    media = Media.query.filter_by(id=um.media_id).first()
    media_type = MediaType.query.filter_by(id=media.media_type).first() if media else None

    return {
        'id': item.id,
        'position': item.position,
        'review': {
            'id': um.id,
            'rating': um.rating,
            'review_text': um.review_text,
            'created_at': um.review_created_at.isoformat() if um.review_created_at else None,
            'media': {
                'id': media.id,
                'title': media.title,
                'cover_url': media.cover_url,
                'type': media_type.name if media_type else None,
            } if media else None,
        },
    }


class ShowcasesService:
    def get_user_showcases(self, username: str) -> list[dict] | None:
        """Get all showcases for a user, with their items populated."""
        user = User.query.filter_by(username=username).first()
        if not user:
            return None

        showcases = (
            Showcase.query
            .filter_by(user_id=user.id)
            .order_by(Showcase.position)
            .all()
        )

        result = []
        for sc in showcases:
            items = (
                ShowcaseItem.query
                .filter_by(showcase_id=sc.id)
                .order_by(ShowcaseItem.position)
                .all()
            )

            items_data = []
            for item in items:
                if sc.showcase_type == 'list':
                    data = _build_list_item_data(item)
                elif sc.showcase_type == 'review':
                    data = _build_review_item_data(item)
                else:
                    data = None
                if data:
                    items_data.append(data)

            result.append({
                'id': sc.id,
                'title': sc.title,
                'showcase_type': sc.showcase_type,
                'position': sc.position,
                'items': items_data,
            })

        return result

    def create_showcase(self, username: str, payload: dict) -> dict | str:
        """Create a new showcase for a user."""
        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        title = payload.get('title')
        if not title:
            return 'title_required'

        showcase_type = payload.get('showcase_type')
        if showcase_type not in ('list', 'review'):
            return 'invalid_showcase_type'

        position = payload.get('position')
        if position is None:
            max_pos = (
                db.session.query(db.func.max(Showcase.position))
                .filter(Showcase.user_id == user.id)
                .scalar()
            )
            position = (max_pos or 0) + 1

        # Shift existing showcases at or after this position
        if position is not None:
            Showcase.query.filter(
                Showcase.user_id == user.id,
                Showcase.position >= position
            ).update(
                {Showcase.position: Showcase.position + 1},
                synchronize_session=False
            )

        showcase = Showcase(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title=title,
            showcase_type=showcase_type,
            position=position,
        )
        db.session.add(showcase)
        db.session.flush()

        # Add items if provided
        items_payload = payload.get('items', [])
        for idx, item_data in enumerate(items_payload):
            item = ShowcaseItem(
                id=str(uuid.uuid4()),
                showcase_id=showcase.id,
                position=item_data.get('position', idx + 1),
                list_id=item_data.get('list_id') if showcase_type == 'list' else None,
                user_media_id=item_data.get('user_media_id') if showcase_type == 'review' else None,
            )
            db.session.add(item)

        db.session.commit()

        return self._showcase_to_dict(showcase)

    def update_showcase(self, username: str, showcase_id: str, payload: dict) -> dict | str:
        """Update a showcase and optionally replace its items."""
        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        showcase = Showcase.query.filter_by(id=showcase_id, user_id=user.id).first()
        if not showcase:
            return 'showcase_not_found'

        if 'title' in payload:
            showcase.title = payload['title']

        if 'position' in payload:
            old_pos = showcase.position
            new_pos = payload['position']
            if old_pos != new_pos:
                if old_pos < new_pos:
                    Showcase.query.filter(
                        Showcase.user_id == user.id,
                        Showcase.position > old_pos,
                        Showcase.position <= new_pos
                    ).update(
                        {Showcase.position: Showcase.position - 1},
                        synchronize_session=False
                    )
                else:
                    Showcase.query.filter(
                        Showcase.user_id == user.id,
                        Showcase.position >= new_pos,
                        Showcase.position < old_pos
                    ).update(
                        {Showcase.position: Showcase.position + 1},
                        synchronize_session=False
                    )
                showcase.position = new_pos

        # Replace items if provided (delete old, insert new)
        if 'items' in payload:
            ShowcaseItem.query.filter_by(showcase_id=showcase.id).delete()
            for idx, item_data in enumerate(payload['items']):
                item = ShowcaseItem(
                    id=str(uuid.uuid4()),
                    showcase_id=showcase.id,
                    position=item_data.get('position', idx + 1),
                    list_id=item_data.get('list_id') if showcase.showcase_type == 'list' else None,
                    user_media_id=item_data.get('user_media_id') if showcase.showcase_type == 'review' else None,
                )
                db.session.add(item)

        db.session.commit()

        return self._showcase_to_dict(showcase)

    def delete_showcase(self, username: str, showcase_id: str) -> bool | str:
        """Delete a showcase."""
        user = User.query.filter_by(username=username).first()
        if not user:
            return 'user_not_found'

        showcase = Showcase.query.filter_by(id=showcase_id, user_id=user.id).first()
        if not showcase:
            return 'showcase_not_found'

        removed_position = showcase.position
        db.session.delete(showcase)

        # Close the gap
        Showcase.query.filter(
            Showcase.user_id == user.id,
            Showcase.position > removed_position
        ).update(
            {Showcase.position: Showcase.position - 1},
            synchronize_session=False
        )

        db.session.commit()
        return True

    def _showcase_to_dict(self, showcase: Showcase) -> dict:
        """Convert a Showcase ORM object to a dict with items."""
        items = (
            ShowcaseItem.query
            .filter_by(showcase_id=showcase.id)
            .order_by(ShowcaseItem.position)
            .all()
        )

        items_data = []
        for item in items:
            if showcase.showcase_type == 'list':
                data = _build_list_item_data(item)
            elif showcase.showcase_type == 'review':
                data = _build_review_item_data(item)
            else:
                data = None
            if data:
                items_data.append(data)

        return {
            'id': showcase.id,
            'title': showcase.title,
            'showcase_type': showcase.showcase_type,
            'position': showcase.position,
            'items': items_data,
        }
