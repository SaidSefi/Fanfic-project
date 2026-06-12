import uuid
from datetime import datetime
from typing import TypedDict, List, Union, Any

from sqlalchemy import or_, func

from schemas.db import db
from schemas.models import (
    User, Friend, UserTopItem, Media, MediaType,
    CustomList, ListItem, RelatedMedia, MediaRelationType, UserMedia
)


# ── TypedDicts ──────────────────────────────────────────────

class HealthDict(TypedDict):
    status: str
    message: str


class ListPageDict(TypedDict):
    nom: str
    description: str | None
    cover: str | None
    contenu: List[dict[str, Any]]


class UserListSummaryDict(TypedDict):
    id: str
    nom: str
    description: str | None
    cover: str | None
    nombre_elements: int
    created_at: str | None


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


class UserProfileDict(TypedDict):
    username: str
    avatar: str | None
    bio: str | None
    joined_at: str | None
    followers_count: int
    following_count: int


class UpdateProfilePayloadDict(TypedDict, total=False):
    username: str
    avatar_url: str | None
    bio: str | None


class FriendRequestCreatedDict(TypedDict):
    status: str
    requester: str
    addressee: str


class FriendRequestCreatedWithIdDict(TypedDict):
    status: str
    request_id: str
    requester: str
    addressee: str


class IncomingRequestDict(TypedDict):
    status: str


class FriendRequestAcceptedDict(TypedDict):
    status: str
    request_id: str


class FriendDict(TypedDict):
    username: str
    avatar: str | None
    activite_recent: str | None


class FriendRequestDict(TypedDict):
    request_id: str
    sender: str
    avatar: str | None


class TopMediaDict(TypedDict):
    cover: str | None
    nom: str
    rating: float
    type: str


class MediaSummaryDict(TypedDict):
    titre: str
    image: str | None
    score: float
    type: str


class MediaDetailDict(TypedDict):
    titre: str
    cover: str | None
    banner: str | None
    synopsis: str | None
    release_date: str | None
    average_rating: float
    total_reviews: int
    type: str | None


class MediaReviewDict(TypedDict):
    user: str
    review: str | None
    rating: float | None
    created_at: str | None


class MediaTypeDict(TypedDict):
    type: str


class RelatedMediaDict(TypedDict):
    cover: str | None
    nom: str


class RelationTypeDict(TypedDict):
    type: str | None


class UserMediaItemDict(TypedDict):
    media_name: str
    image: str | None
    status: str
    rating: float | None
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


# ── BaseService ─────────────────────────────────────────────

class BaseService:
    def health_check(self) -> HealthDict:
        return {
            'status': 'ok',
            'message': 'Fanfic API is ready'
        }

    # ── Lists ────────────────────────────────────────────

    def get_list_page(self, list_id: str) -> ListPageDict | None:
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

    def update_list_item_position(
        self, list_id: str, item_id: str, position: int
    ) -> Union[UpdatedPositionDict, str]:
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

    def remove_list_item(self, list_id: str, item_id: str) -> Union[bool, str]:
        custom_list = CustomList.query.filter_by(id=list_id).first()
        if not custom_list:
            return 'list_not_found'

        list_item = ListItem.query.filter_by(id=item_id, list_id=custom_list.id).first()
        if not list_item:
            return 'item_not_found'

        db.session.delete(list_item)
        db.session.commit()

        return True

    # ── User Profile ─────────────────────────────────────

    def update_user_profile(
        self, username: str, payload: UpdateProfilePayloadDict
    ) -> Union[UserProfileDict, str, None]:
        user = User.query.filter_by(username=username).first()
        if not user:
            return None

        new_username = payload.get('username')
        if new_username and new_username != user.username:
            existing = User.query.filter_by(username=new_username).first()
            if existing:
                return 'username_taken'
            user.username = new_username

        if 'avatar_url' in payload:
            user.avatar_url = payload.get('avatar_url')
        if 'bio' in payload:
            user.bio = payload.get('bio')

        db.session.commit()

        return self.get_user_profile(user.username)

    # ── Friends ──────────────────────────────────────────

    def add_friend(
        self, requester_username: str, addressee_username: str
    ) -> Union[FriendRequestCreatedDict, IncomingRequestDict, str]:
        requester = User.query.filter_by(username=requester_username).first()
        addressee = User.query.filter_by(username=addressee_username).first()
        if not requester or not addressee:
            return 'user_not_found'
        if requester.id == addressee.id:
            return 'self_friend'

        existing = Friend.query.filter_by(requester_id=requester.id, addressee_id=addressee.id).first()
        reverse = Friend.query.filter_by(requester_id=addressee.id, addressee_id=requester.id).first()
        if existing:
            if existing.accepted:
                return 'already_friends'
            return 'already_requested'
        if reverse:
            if reverse.accepted:
                return 'already_friends'
            return {'status': 'incoming_request_exists'}

        friend = Friend(
            id=str(uuid.uuid4()),
            requester_id=requester.id,
            addressee_id=addressee.id,
            accepted=None,
        )
        db.session.add(friend)
        db.session.commit()

        return {
            'status': 'friend_request_created',
            'requester': requester.username,
            'addressee': addressee.username,
        }

    def remove_friend(self, username: str, friend_username: str) -> Union[bool, str]:
        user = User.query.filter_by(username=username).first()
        friend_user = User.query.filter_by(username=friend_username).first()
        if not user or not friend_user:
            return 'user_not_found'

        friendship = Friend.query.filter(
            or_(
                (Friend.requester_id == user.id) & (Friend.addressee_id == friend_user.id),
                (Friend.requester_id == friend_user.id) & (Friend.addressee_id == user.id),
            )
        ).first()

        if not friendship:
            return 'friend_not_found'

        db.session.delete(friendship)
        db.session.commit()

        return True

    def get_friends(self, user_id: str) -> List[FriendDict] | None:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return None

        friendships = Friend.query.filter(
            or_(
                (Friend.requester_id == user_id) & (Friend.accepted == True),
                (Friend.addressee_id == user_id) & (Friend.accepted == True),
            )
        ).all()

        result: List[FriendDict] = []
        for f in friendships:
            other_id = f.addressee_id if f.requester_id == user_id else f.requester_id
            other = User.query.filter_by(id=other_id).first()
            if not other:
                continue

            latest = (
                UserMedia.query.filter_by(user_id=other.id)
                .order_by(UserMedia.review_created_at.desc())
                .first()
            )
            activity = None
            if latest:
                activity = (latest.review_created_at or latest.added_at)

            result.append({
                'username': other.username,
                'avatar': other.avatar_url,
                'activite_recent': activity.isoformat() if activity else None,
            })

        return result

    def get_friend_requests(self, user_id: str) -> List[FriendRequestDict] | None:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return None

        reqs = Friend.query.filter_by(addressee_id=user_id, accepted=None).order_by(Friend.created_at.desc()).all()
        return [
            {
                'request_id': r.id,
                'sender': User.query.filter_by(id=r.requester_id).first().username,
                'avatar': User.query.filter_by(id=r.requester_id).first().avatar_url,
            }
            for r in reqs
        ]

    def add_friend_request(
        self, addressee_id: str, sender_id: str
    ) -> Union[FriendRequestCreatedWithIdDict, IncomingRequestDict, str]:
        addressee = User.query.filter_by(id=addressee_id).first()
        sender = User.query.filter_by(id=sender_id).first()
        if not addressee or not sender:
            return 'user_not_found'
        if addressee.id == sender.id:
            return 'self_friend'

        existing = Friend.query.filter_by(requester_id=sender.id, addressee_id=addressee.id).first()
        reverse = Friend.query.filter_by(requester_id=addressee.id, addressee_id=sender.id).first()
        if existing:
            if existing.accepted:
                return 'already_friends'
            return 'already_requested'
        if reverse:
            if reverse.accepted:
                return 'already_friends'
            return {'status': 'incoming_request_exists'}

        friend = Friend(
            id=str(uuid.uuid4()),
            requester_id=sender.id,
            addressee_id=addressee.id,
            accepted=None,
        )
        db.session.add(friend)
        db.session.commit()

        return {
            'status': 'friend_request_created',
            'request_id': friend.id,
            'requester': sender.username,
            'addressee': addressee.username,
        }

    def accept_friend_request(
        self, addressee_id: str, request_id: str
    ) -> Union[FriendRequestAcceptedDict, str]:
        fr = Friend.query.filter_by(id=request_id, addressee_id=addressee_id).first()
        if not fr:
            return 'request_not_found'
        if fr.addressee_id != addressee_id:
            return 'not_allowed'

        fr.accepted = True
        fr.accepted_at = datetime.utcnow()
        db.session.commit()

        return {'status': 'accepted', 'request_id': fr.id}

    def refuse_friend_request(
        self, addressee_id: str, request_id: str
    ) -> Union[bool, str]:
        fr = Friend.query.filter_by(id=request_id, addressee_id=addressee_id).first()
        if not fr:
            return 'request_not_found'

        db.session.delete(fr)
        db.session.commit()

        return True

    def remove_friend_by_id(self, user_id: str, friend_id: str) -> Union[bool, str]:
        friendship = Friend.query.filter(
            or_(
                (Friend.requester_id == user_id) & (Friend.addressee_id == friend_id),
                (Friend.requester_id == friend_id) & (Friend.addressee_id == user_id),
            )
        ).first()

        if not friendship or not friendship.accepted:
            return 'friend_not_found'

        db.session.delete(friendship)
        db.session.commit()

        return True

    def get_user_profile(self, username: str) -> UserProfileDict | None:
        user = User.query.filter_by(username=username).first()
        if not user:
            return None

        followers_count = Friend.query.filter_by(addressee_id=user.id, accepted=True).count()
        following_count = Friend.query.filter_by(requester_id=user.id, accepted=True).count()

        return {
            'username': user.username,
            'avatar': user.avatar_url,
            'bio': user.bio,
            'joined_at': user.created_at.isoformat() if user.created_at else None,
            'followers_count': followers_count,
            'following_count': following_count,
        }

    def get_user_top_medias(self, username: str) -> List[TopMediaDict] | None:
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
                'titre': media.title,
                'image': media.cover_url,
                'score': media.average_rating,
                'type': media_type.name,
            }
            for media, media_type in items
        ]

    def search_medias(self, query_text: str) -> List[MediaSummaryDict]:
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

    def get_user_medias(
        self, user_id: str, status: str | None = None
    ) -> List[UserMediaItemDict] | None:
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

    def get_media(self, media_id: str) -> MediaDetailDict | None:
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
            'genres': [],
            'release_date': media.release_date.isoformat() if media.release_date else None,
            'average_rating': media.average_rating,
            'total_reviews': total_reviews,
            'type': media_type.name if media_type else None,
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

    def get_media_relation_type(self, media_id: str) -> RelationTypeDict | None:
        media = Media.query.filter_by(id=media_id).first()
        if not media:
            return None

        related_model = RelatedMedia.query.filter_by(id=media.related_media).first()
        if not related_model:
            return {'type': None}

        relation_type = MediaRelationType.query.filter_by(id=related_model.media_relation_type_id).first()
        return {'type': relation_type.name if relation_type else None}

    def add_media_review(
        self, media_id: str, payload: dict[str, Any]
    ) -> Union[dict[str, Any], str]:
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

    def add_media_to_library(
        self, media_id: str, payload: dict[str, Any]
    ) -> Union[dict[str, Any], str]:
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
