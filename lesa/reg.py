import json
import secrets
from flask import request
from flask_wtf import FlaskForm
from wtforms import FieldList
from typing import Dict, List, Union, Optional

from .app import app, db
from .forms import RegisterForm
from .forms import phone_number
from .models import Register
from .models import Parent, Child
from .models import BeenLastYear
from .models import Config

def show_errors(
    form:FlaskForm,
    errs:Optional[Dict[str,str]]=None,
    lst:bool=False) -> Union[List[str],str]:

    '''
    Вывод label-ов некорректно заполненных полей,
    например, для сообщения об ошибке'''

    errs = errs or form.errors
    labels = []

    for e in errs:

        field = form[e]
        lbl = field.label.text

        if isinstance(field, FieldList):
            inner = []
            lbl += ' ('
            for f in field:
                inner.append(show_errors(f, f.errors))
            lbl += '; '.join(inner)
            lbl += ')'
        
        labels.append(lbl)

    if lst: return labels
    return ', '.join(labels).lower()

@app.route('/form/code', methods=['POST'])
def check_code():

    data = request.get_json(force=True)
    codes = BeenLastYear.query.filter(
        BeenLastYear.code == data['code']
    ).all()
    
    if len(codes) > 0:
        return json.dumps({'data':True})

    return json.dumps({'data':False})

@app.route('/form/register', methods=['POST'])
def regform():

    config = Config.query.filter(Config.id == 0).first()

    if not config.reg_allow:
        return json.dumps({
            'ok': False,
            'data': 'Регистрация пока закрыта'
        })

    form = RegisterForm()
    form.main_email.choices = [form.main_email.data]
    form.main_phone.choices = [form.main_phone.data]
    if form.validate_on_submit():

        data = form.data
        parents = data['parentslst']
        children = data['childrenlst']

        mid = secrets.token_urlsafe(16)
        email = data['main_email']
        phone = data['main_phone']
        
        db.session.add(Register(
            family=data['family'],
            dates=data['dates'],
            count=data['count'],
            children=data['children'],
            meal=data['meal_count'],
            house=data['house'],
            friends=data['friends'],
            email=email,
            phone=phone,
            code=data['code'],
            mid=mid
        ))

        for p in parents:
            phone = phone_number(p['phone'])
            db.session.add(Parent(
                mid=mid,
                surname=p['surname'],
                firstname=p['firstname'],
                midname=p['midname'],
                phone=phone,
                email=p['email'],
                social=p['social']
            ))

        for c in children:
            db.session.add(Child(
                mid=mid,
                surname=c['surname'],
                firstname=c['firstname'],
                gender=c['gender'],
                birthday=c['birthday']
            ))

        db.session.commit()
        return json.dumps({'ok':True,'data':mid})

    return json.dumps({
        'ok': False,
        'data': show_errors(
            form=form,
            errs=None,
            lst=True
        )
    })
