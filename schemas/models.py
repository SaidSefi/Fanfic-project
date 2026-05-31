from schemas.db import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(255), primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    media_interactions = db.relationship('UserMedia', backref='user', lazy=True)
    likes = db.relationship('UserMediaLike', backref='user', lazy=True)
    custom_lists = db.relationship('CustomList', backref='user', lazy=True)
    top_items = db.relationship('UserTopItem', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'


class Friend(db.Model):
    __tablename__ = 'friends'
    
    id = db.Column(db.String(255), primary_key=True)
    requester_id = db.Column(db.String(255), db.ForeignKey('users.id'), nullable=False)
    addressee_id = db.Column(db.String(255), db.ForeignKey('users.id'), nullable=False)
    accepted = db.Column(db.Boolean, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime, nullable=True)
    
    __table_args__ = (db.UniqueConstraint('requester_id', 'addressee_id', name='_friend_pair_uc'),)


class MediaRelationType(db.Model):
    __tablename__ = 'media_relation_type'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)


class RelatedMedia(db.Model):
    __tablename__ = 'related_medias'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    original_api_id = db.Column(db.String(255), nullable=False)
    media_relation_type_id = db.Column(db.Integer, db.ForeignKey('media_relation_type.id'), nullable=False)


class MediaType(db.Model):
    __tablename__ = 'media_types'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)


class Media(db.Model):
    __tablename__ = 'media'
    
    id = db.Column(db.String(255), primary_key=True)
    original_api_id = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False, index=True)
    media_type = db.Column(db.Integer, db.ForeignKey('media_types.id'), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    release_date = db.Column(db.Date, nullable=True)
    cover_url = db.Column(db.Text, nullable=True)
    banner_url = db.Column(db.Text, nullable=True)
    average_rating = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    related_media = db.Column(db.Integer, db.ForeignKey('related_medias.id'), nullable=False)


class UserMedia(db.Model):
    __tablename__ = 'user_media'
    
    id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.String(255), db.ForeignKey('users.id'), nullable=False, index=True)
    media_id = db.Column(db.String(255), db.ForeignKey('media.id'), nullable=False, index=True)
    
    status = db.Column(db.String(50), default='wishlist')
    rating = db.Column(db.Float, nullable=True)
    liked = db.Column(db.Boolean, nullable=True)
    
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    consumed_at = db.Column(db.Date, nullable=True)
    
    review_text = db.Column(db.Text, nullable=True)
    review_created_at = db.Column(db.DateTime, nullable=True)
    
    likes = db.relationship('UserMediaLike', backref='user_media', lazy=True)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'media_id', name='_user_media_uc'),)


class UserMediaLike(db.Model):
    __tablename__ = 'user_media_likes'
    
    id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.String(255), db.ForeignKey('users.id'), nullable=False)
    user_media_id = db.Column(db.String(255), db.ForeignKey('user_media.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'user_media_id', name='_user_like_uc'),)


class CustomList(db.Model):
    __tablename__ = 'lists'
    
    id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.String(255), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    visibility = db.Column(db.String(50), default='public')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)
    
    items = db.relationship('ListItem', backref='custom_list', cascade='all, delete-orphan', lazy=True)


class ListItem(db.Model):
    __tablename__ = 'list_items'
    
    id = db.Column(db.String(255), primary_key=True)
    list_id = db.Column(db.String(255), db.ForeignKey('lists.id'), nullable=False)
    media_id = db.Column(db.String(255), db.ForeignKey('media.id'), nullable=False)
    position = db.Column(db.Integer, nullable=True)
    
    __table_args__ = (db.UniqueConstraint('list_id', 'media_id', name='_list_media_uc'),)


class UserTopItem(db.Model):
    __tablename__ = 'user_top_items'
    
    id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.String(255), db.ForeignKey('users.id'), nullable=False)
    top_id = db.Column(db.Integer, nullable=False)
    media_id = db.Column(db.String(255), db.ForeignKey('media.id'), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('top_id', 'media_id', name='_top_media_uc'),
        db.UniqueConstraint('top_id', 'position', name='_top_position_uc'),
    )