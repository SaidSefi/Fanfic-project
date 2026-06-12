import uuid
from datetime import datetime
from sqlalchemy import or_

from schemas.db import db
from schemas.models import User, Friend, UserMedia


class FriendsService:
    def add_friend(self, requester_username, addressee_username):
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

    def remove_friend(self, username, friend_username):
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

    def get_friends(self, user_id):
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return None

        friendships = Friend.query.filter(
            or_(
                (Friend.requester_id == user_id) & (Friend.accepted == True),
                (Friend.addressee_id == user_id) & (Friend.accepted == True),
            )
        ).all()

        result = []
        for f in friendships:
            other_id = f.addressee_id if f.requester_id == user_id else f.requester_id
            other = User.query.filter_by(id=other_id).first()
            if not other:
                continue

            # recent activity: latest review_created_at or added_at
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

    def get_friend_requests(self, user_id):
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

    def add_friend_request(self, addressee_id, sender_id):
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

    def accept_friend_request(self, addressee_id, request_id):
        fr = Friend.query.filter_by(id=request_id, addressee_id=addressee_id).first()
        if not fr:
            return 'request_not_found'
        if fr.addressee_id != addressee_id:
            return 'not_allowed'

        fr.accepted = True
        fr.accepted_at = datetime.utcnow()
        db.session.commit()

        return {'status': 'accepted', 'request_id': fr.id}

    def refuse_friend_request(self, addressee_id, request_id):
        fr = Friend.query.filter_by(id=request_id, addressee_id=addressee_id).first()
        if not fr:
            return 'request_not_found'

        db.session.delete(fr)
        db.session.commit()

        return True

    def remove_friend_by_id(self, user_id, friend_id):
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
