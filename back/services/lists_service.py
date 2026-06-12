import uuid
from typing import TypedDict, List, Union

from schemas.db import db
from schemas.models import User, CustomList, ListItem, Media


class ListSummaryDict(TypedDict):
    id: str
    nom: str
    description: str | None
    cover: str | None
    total_items: int
    visibility: str
    created_at: str | None


class UserListSummaryDict(TypedDict):
    id: str
    nom: str
    description: str | None
    cover: str | None
    nombre_elements: int
    created_at: str | None


class ListItemDict(TypedDict):
    id: str
    media_id: str
    media_name: str
    image: str | None
    note: float
    position: int


class PaginatedListItemsDict(TypedDict):
    items: List[ListItemDict]
    page: int
    per_page: int
    total_items: int
    total_pages: int


class ListPageDict(TypedDict):
    nom: str
    description: str | None
    cover: str | None
    contenu: List[ListItemDict]


class CreateListPayloadDict(TypedDict):
    title: str
    description: str | None
    visibility: str


class UpdateListPayloadDict(TypedDict, total=False):
    title: str
    description: str | None
    visibility: str


class AddListItemPayloadDict(TypedDict):
    media_id: str
    position: int | None


class AddedListItemDict(TypedDict):
    id: str
    list_id: str
    media_id: str
    position: int


class UpdatedPositionDict(TypedDict):
    id: str
    position: int


class ListsService:
    def get_list(self, list_id: str) -> ListSummaryDict | None:
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return None

        total_items = ListItem.query.filter_by(list_id=custom_list.id).count()

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
            'total_items': total_items,
            'visibility': custom_list.visibility,
            'created_at': custom_list.created_at.isoformat() if custom_list.created_at else None,
        }

    def get_list_items(
        self, list_id: str, page: int = 1, per_page: int = 20
    ) -> PaginatedListItemsDict | None:
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return None

        total_items = ListItem.query.filter_by(list_id=custom_list.id).count()
        total_pages = max(1, (total_items + per_page - 1) // per_page)

        offset = (page - 1) * per_page
        items = (
            db.session.query(ListItem, Media)
            .join(Media, ListItem.media_id == Media.id)
            .filter(ListItem.list_id == custom_list.id)
            .order_by(ListItem.position)
            .offset(offset)
            .limit(per_page)
            .all()
        )

        return {
            'items': [
                {
                    'id': item.id,
                    'media_id': media.id,
                    'media_name': media.title,
                    'image': media.cover_url,
                    'note': media.average_rating,
                    'position': item.position,
                }
                for item, media in items
            ],
            'page': page,
            'per_page': per_page,
            'total_items': total_items,
            'total_pages': total_pages,
        }

    def get_user_lists(self, user_id: str) -> List[UserListSummaryDict] | None:
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

    def create_list(
        self, user_id: str, payload: CreateListPayloadDict
    ) -> Union[UserListSummaryDict, str]:
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

    def update_list(
        self, list_id: str, payload: UpdateListPayloadDict
    ) -> Union[UserListSummaryDict, str]:
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

    def delete_list(self, list_id: str) -> Union[bool, str]:
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        db.session.delete(custom_list)
        db.session.commit()

        return True

    def add_list_item(
        self, list_id: str, payload: AddListItemPayloadDict
    ) -> Union[AddedListItemDict, str]:
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
        if position is not None:
            # Shift existing items at or after this position down by 1
            ListItem.query.filter(
                ListItem.list_id == custom_list.id,
                ListItem.position >= position
            ).update(
                {ListItem.position: ListItem.position + 1},
                synchronize_session=False
            )
        else:
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

    def update_list_item_position(
        self, list_id: str, item_id: str, position: int
    ) -> Union[UpdatedPositionDict, str]:
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        list_item = ListItem.query.filter_by(id=item_id, list_id=custom_list.id).first()
        if not list_item:
            return 'item_not_found'

        old_position = list_item.position

        if old_position != position:
            if old_position < position:
                # Moving down: shift items between old+1 and new position up by 1
                ListItem.query.filter(
                    ListItem.list_id == custom_list.id,
                    ListItem.position > old_position,
                    ListItem.position <= position
                ).update(
                    {ListItem.position: ListItem.position - 1},
                    synchronize_session=False
                )
            else:
                # Moving up: shift items between new and old-1 position down by 1
                ListItem.query.filter(
                    ListItem.list_id == custom_list.id,
                    ListItem.position >= position,
                    ListItem.position < old_position
                ).update(
                    {ListItem.position: ListItem.position + 1},
                    synchronize_session=False
                )

            list_item.position = position

        db.session.commit()

        return {
            'id': list_item.id,
            'position': list_item.position,
        }

    def remove_list_item(self, list_id: str, item_id: str) -> Union[bool, str]:
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        list_item = ListItem.query.filter_by(id=item_id, list_id=custom_list.id).first()
        if not list_item:
            return 'item_not_found'

        removed_position = list_item.position
        db.session.delete(list_item)

        # Close the gap: shift items after the removed position up by 1
        ListItem.query.filter(
            ListItem.list_id == custom_list.id,
            ListItem.position > removed_position
        ).update(
            {ListItem.position: ListItem.position - 1},
            synchronize_session=False
        )

        db.session.commit()

        return True
