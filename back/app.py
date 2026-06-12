from flask import Flask
from flask_migrate import Migrate
from schemas.db import db
from flask_cors import CORS

from routes import api_bp
from routes.auth import auth_bp


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fanfic.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],)

    db.init_app(app)
    Migrate(app, db)

    # Seed canonical media types on startup (idempotent)
    from schemas.seed import seed_media_types, seed_media_relation_types
    with app.app_context():
        db.create_all()  # ensure tables exist before seeding
        seed_media_types(db)
        seed_media_relation_types(db)

    app.register_blueprint(api_bp, url_prefix='/api')

    app.register_blueprint(auth_bp)

    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)