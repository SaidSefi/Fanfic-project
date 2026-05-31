import uuid
from datetime import datetime

from schemas.db import db
from schemas.models import User, CustomList, ListItem, Media


class ListsService:
    def get_list_page(self, list_id):
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return None

        items = (
            db.session.query(ListItem, Media)
            .join(Media, ListItem.media_id == Media.id)
            .filter(ListItem.list_id == custom_list.id)
            .order_by(ListItem.position)
            .all()
        )

        cover = items[0][1].cover_url if items else None
        return {
            'nom': custom_list.title,
            'description': custom_list.description,
            'cover': cover,
            'contenu': [
                {
                    'id': item.id,
                    'media_name': media.title,
                    'image': media.cover_url,
                    'note': media.average_rating,
                    'position': item.position,
                }
                for item, media in items
            ],
        }

    def get_user_lists(self, user_id):
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return None

        lists = CustomList.query.filter_by(user_id=user_id).order_by(CustomList.created_at.desc()).all()
        return [
            {
                'id': custom_list.id,
                'nom': custom_list.title,
                'description': custom_list.description,
                'cover': (
                    db.session.query(Media.cover_url)
                    .join(ListItem, ListItem.media_id == Media.id)
                    .filter(ListItem.list_id == custom_list.id)
                    .order_by(ListItem.position)
                    .scalar()
                ),
                'nombre_elements': ListItem.query.filter_by(list_id=custom_list.id).count(),
                'created_at': custom_list.created_at.isoformat() if custom_list.created_at else None,
            }
            for custom_list in lists
        ]

    def create_list(self, user_id, payload):
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return 'user_not_found'

        title = payload.get('title')
        if not title:
            return 'title_required'

        custom_list = CustomList(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title=title,
            description=payload.get('description'),
            visibility=payload.get('visibility', 'public'),
        )
        db.session.add(custom_list)
        db.session.commit()

        return {
            'id': custom_list.id,
            'nom': custom_list.title,
            'description': custom_list.description,
            'cover': None,
            'nombre_elements': 0,
            'created_at': custom_list.created_at.isoformat() if custom_list.created_at else None,
        }

    def update_list(self, list_id, payload):
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        if 'title' in payload:
            custom_list.title = payload.get('title')
        if 'description' in payload:
            custom_list.description = payload.get('description')
        if 'visibility' in payload:
            custom_list.visibility = payload.get('visibility')

        db.session.commit()

        cover = (
            db.session.query(Media.cover_url)
            .join(ListItem, ListItem.media_id == Media.id)
            .filter(ListItem.list_id == custom_list.id)
            .order_by(ListItem.position)
            .scalar()
        )

        return {
            'id': custom_list.id,
            'nom': custom_list.title,
            'description': custom_list.description,
            'cover': cover,
            'nombre_elements': ListItem.query.filter_by(list_id=custom_list.id).count(),
            'created_at': custom_list.created_at.isoformat() if custom_list.created_at else None,
        }

    def delete_list(self, list_id):
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        db.session.delete(custom_list)
        db.session.commit()

        return True

    def add_list_item(self, list_id, payload):
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        media_id = payload.get('media_id')
        if not media_id:
            return 'missing_media_id'

        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return 'media_not_found'

        position = payload.get('position')
        if position is None:
            max_position = (
                db.session.query(db.func.max(ListItem.position))
                .filter(ListItem.list_id == custom_list.id)
                .scalar()
            )
            position = (max_position or 0) + 1

        list_item = ListItem(
            id=str(uuid.uuid4()),
            list_id=custom_list.id,
            media_id=media.id,
            position=position,
        )
        db.session.add(list_item)
        db.session.commit()

        return {
            'id': list_item.id,
            'list_id': custom_list.id,
            'media_id': media.id,
            'position': list_item.position,
        }

    def update_list_item_position(self, list_id, item_id, position):
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        list_item = ListItem.query.filter_by(id=item_id, list_id=custom_list.id).first()
        if not list_item:
            return 'item_not_found'

        list_item.position = position
        db.session.commit()

        return {
            'id': list_item.id,
            'position': list_item.position,
        }

    def remove_list_item(self, list_id, item_id):
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        list_item = ListItem.query.filter_by(id=item_id, list_id=custom_list.id).first()
        if not list_item:
            return 'item_not_found'

        db.session.delete(list_item)
        db.session.commit()

        return True
