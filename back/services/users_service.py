from typing import TypedDict, Union

from schemas.db import db
from schemas.models import User, Friend


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


class UsersService:
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
