import os
import secrets
from flask import redirect
from flask import make_response, flash
from flask import request
from flask_wtf import FlaskForm
from typing import Union

from ..app import app, bcrypt, db
from ..reg import show_errors
from ..upload import process_dirs
from ..upload import save_imgs
from ..upload import check_dirs
from ..upload import remove_dirs
from ..models import Config, Post, About

from . import check_token, access
from .adminforms import LoginForm, PasswordForm
from .adminforms import PostForm, AboutForm

@app.route('/admin/login', methods=['POST'])
def login():
    
    form = LoginForm()
    if form.validate_on_submit():

        # check
        pswd = form.data['password']
        adminpswd = Config.query.filter(Config.id == 0).first().adminpswd
        if bcrypt.check_password_hash(adminpswd, pswd):

            # create access token
            token = secrets.token_urlsafe(16)
            access[0] = token

            # set cookie
            resp = make_response(redirect('/admin/panel'))
            resp.set_cookie('lesa_admin', token)
            return resp

    flash('Неверный пароль')
    return redirect('/admin')

@app.route('/admin/rmphoto', methods=['POST'])
def rm_photo():

    if not check_token(xhr=True):
        return redirect('/admin')
    
    data = request.get_json(force=True)
    name = data.get('data')
    if not name: return ''

    def remove(path, exists):
        if not exists: return
        file = os.path.join(path, name)
        try:
            os.remove(file)
        except Exception:
            return

    process_dirs(remove, 'about')
    return ''

@app.route('/admin/rmpost', methods=['POST'])
def rm_post():

    if not check_token(xhr=True):
        return redirect('/admin')

    data = request.get_json(force=True)
    pid = data.get('data', 0)
    if not pid: return ''

    pid = int(pid)
    db.session.\
        query(Post).filter(Post.id == pid).\
        delete()
    db.session.commit()

    remove_dirs(pid)
    return ''

@app.route('/admin/post', methods=['POST'])
def create_post():

    if not check_token():
        return redirect('/admin')

    form = PostForm()
    if form.validate_on_submit():

        p = Post(
            title=form.title.data,
            body=form.body.data
        )
        db.session.add(p)
        db.session.commit()
        flash('I:Пост создан')

        upload(form, p.id)

        return redirect('/admin/panel#posts')
    
    flash('F:' + show_errors(form))
    return redirect('/admin/panel#posts')

@app.route('/admin/about', methods=['POST'])
def about_us():

    if not check_token():
        return redirect('/admin')

    form = AboutForm()
    if form.validate_on_submit():

        upload(form, 'about', 'about', False)

        db.session.query(About).\
            filter(About.id == 0).\
            update({'text': form.text.data})
        db.session.commit()
    
    return redirect('/admin/panel#about')

@app.route('/admin/pswd', methods=['POST'])
def change_pswd():

    if not check_token():
        return redirect('/admin')
    
    form = PasswordForm()
    if form.validate_on_submit():

        if form.newpswd.data != form.confirm.data:
            flash('E:Пароли не совпадают')
            return redirect('/admin/panel#account')

        adminpswd = Config.query.filter(Config.id == 0).first().adminpswd
        
        if bcrypt.check_password_hash(adminpswd, form.oldpswd.data):

            adminpswd = bcrypt.generate_password_hash(form.newpswd.data)
            access[0] = ''
            db.session.\
                query(Config).filter(Config.id == 0).\
                update({'adminpswd': adminpswd})
            db.session.commit()

            resp = make_response(redirect('/admin'))
            resp.delete_cookie('lesa_admin')
            return resp
        
        flash('E:Неверный пароль')
        return redirect('/admin/panel#account')
    
    flash('F:' + show_errors(form))
    return redirect('/admin/panel#account')

def upload(
        form:FlaskForm,
        post:Union[int,str],
        target:str='posts',
        remove:bool=True) -> None:

    pics = request.files.getlist(form.photos.name)
    if (not pics) or (not pics[0]):
        check_dirs(post)
        return redirect('/admin/panel#' + target)

    save_imgs(pics, post, remove)
    
    count = len(pics)
    ending = \
        'я' if count == 1 else \
        'и' if count  < 5 else 'й'
    flash(f'I:{count} фотографи{ending} загружено')
