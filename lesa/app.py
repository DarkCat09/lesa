import secrets
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .upload import check_dirs, basedir

sql = 'sqlite:///' + basedir + '/sql/database.db'
app = Flask(__name__)
app.config.update({
    'SECRET_KEY': secrets.token_hex(),
    'SQLALCHEMY_DATABASE_URI': sql,
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    'MAX_CONTENT_LENGTH': 16 * 1024 * 1024 # 16 MiB
})

bcrypt = Bcrypt(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

check_dirs()

from . import models
from . import pages
from . import reg
from . import admin

models.init_db()
