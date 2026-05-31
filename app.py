from flask import Flask
from flask_migrate import Migrate
from schemas.db import db

from schemas.models import User, Friend, MediaRelationType, RelatedMedia, MediaType, Media, UserMedia, UserMediaLike, CustomList, ListItem, UserTopItem
from routes import api_bp


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fanfic.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    Migrate(app, db)
    app.register_blueprint(api_bp, url_prefix='/api')

    return app


app = create_app()
