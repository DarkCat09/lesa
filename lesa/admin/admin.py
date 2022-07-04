import phonenumbers
from phonenumbers import PhoneNumberFormat
from datetime import date, datetime
from flask import render_template, redirect
from flask import make_response, request
from typing import List, Optional

from ..app import app
from ..consts import FONT
from ..upload import post_dirs
from ..upload import html_dirs
from ..upload import listdir
from ..models import Config, About
from ..models import Post, Register
from ..models import Shift, House
from ..models import Parent, Child
from ..models import AdminColumn
from ..models import BeenLastYear

from . import check_token, access
from .adminforms import LoginForm, PasswordForm
from .adminforms import PostForm, SeasonForm, AboutForm

@app.route('/admin')
def admin():

    if check_token():
        return redirect('/admin/panel')

    return render_template(
        'login.html',
        form=LoginForm(),
        font=FONT
    )

@app.route('/admin/logout', methods=['GET'])
def logout():

    if check_token():
        access[0] = ''

    resp = make_response(redirect('/admin'))
    resp.delete_cookie('lesa_admin')
    return resp

@app.route('/admin/panel')
def panel():

    if not check_token():
        return redirect('/admin')

    shifts: List[Shift] = Shift.query.order_by(Shift.id.asc()).all()
    shift = shifts[0] if len(shifts) > 0 else None
    shift_dt = date_timestamp(shift.begin) if shift else 0

    config = Config.query.filter(Config.id == 0).first()
    about = About.query.filter(About.id == 0).first()

    about_form = AboutForm()
    if about:
        about_form.text.data = about.text
    
    photos_dir = post_dirs('about')[0]
    photos_html, thumbs_html = html_dirs('about')

    return render_template(
        'admin.html',
        posts=Post.query.\
            order_by(Post.id.desc()).\
            all(),
        columns=AdminColumn.query.\
            order_by(AdminColumn.id.asc()).\
            all(),
        pform=PostForm(),
        about=about_form,
        sform=SeasonForm(),
        rform=Register.query.all(),
        aform=PasswordForm(),
        dates=shifts,
        housedb=House.query.all(),
        photos=listdir(photos_dir),
        photos_dir=photos_html,
        thumbs_dir=thumbs_html,
        shift=shift_dt,
        format_phone=format_phone,
        editor=lambda id:
            render_template(
                'editor.html',
                textarea_id=id
            ),
        config=config,
        font=FONT
    )

@app.route('/admin/parents', methods=['POST'])
def parentslst():

    if not check_token(xhr=True):
        return redirect('/admin')

    post = request.get_json(force=True)
    mid = post.get('mid')
    return render_template(
        'parents.html',
        format_phone=format_phone,
        data=Parent.query.\
            filter(Parent.mid == mid).\
            all()
    )

@app.route('/admin/children', methods=['POST'])
def childrenlst():

    if not check_token(xhr=True):
        return redirect('/admin')
    
    shift: Shift = Shift.query.order_by(Shift.id.asc()).first()

    post = request.get_json(force=True)
    mid = post.get('mid')
    return render_template(
        'children.html',
        shift=shift.begin,
        data=Child.query.\
            filter(Child.mid == mid).\
            all()
    )

@app.route('/admin/been_last_year', methods=['POST'])
def been_last_year():

    if not check_token(xhr=True):
        return redirect('/admin')
    
    return render_template(
        'last_year.html',
        lst=BeenLastYear.query.all()
    )

def date_timestamp(dt: date) -> int:
    return datetime(
        year=dt.year,
        month=dt.month,
        day=dt.day
    ).timestamp()

def format_phone(num:str) -> str:
    return phonenumbers.format_number(
        phonenumbers.parse(num),
        PhoneNumberFormat.INTERNATIONAL
    )
