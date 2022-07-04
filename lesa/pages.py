from datetime import datetime
from flask import render_template

from .app import app
from .forms import RegisterForm
from .upload import post_dirs
from .upload import html_dirs
from .upload import listdir
from .consts import FONT
from .models import Config
from .models import Post, About
from .models import Shift, House

photos0_html, thumbs0_html = html_dirs(0)
photos0_dir = post_dirs(0)[0]

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html', font=FONT)

@app.route('/page/main')
def mainpage():

    config = Config.query.filter(Config.id == 0).first()
    posts = Post.query.order_by(Post.id.desc()).all()

    return render_template(
        'main.html',
        news=posts,
        year=config.year,
        shiftdb=Shift.query.all(),
        housedb=House.query.all(),
        place={
            'name': config.name,
            'mapid': config.mapid
        },
        listdir=listdir,
        post_dirs=post_dirs,
        html_dirs=html_dirs
    )

@app.route('/page/register')
def register():

    config = Config.query.filter(Config.id == 0).first()
    
    if not config.reg_allow:
        return render_template('closed.html')

    shift = Shift.query.filter(Shift.id == 1).first()
    if not shift:
        shift = datetime.now()
    else:
        shift = datetime(
            year=shift.begin.year,
            month=shift.begin.month,
            day=shift.begin.day
        )

    return render_template(
        'register.html',
        form=RegisterForm(),
        shift=shift.timestamp(),
        price={
            'meal': config.meal,
            'child': config.child,
            'parent': config.parent
        }
    )

@app.route('/page/about')
def about():

    photos_html, thumbs_html = html_dirs('about')
    return render_template(
        'about.html',
        about=About.query.\
            filter(About.id == 0).\
            first(),
        photos_dir=photos_html,
        thumbs_dir=thumbs_html
    )

@app.route('/page/photos<int:post>')
def photos(post):

    photos_html, thumbs_html = html_dirs(post)
    photos_dir = post_dirs(post)[0]
    return render_template(
        'photos.html',
        photos=listdir(photos_dir),
        photos_dir=photos_html,
        thumbs_dir=thumbs_html
    )
