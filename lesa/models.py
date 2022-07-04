from datetime import datetime
from datetime import timezone

from .app import db
from .consts import DEF_PSWD

def get_utc():
    return datetime.now(timezone.utc)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64))
    dt = db.Column(db.TIMESTAMP, default=get_utc)
    body = db.Column(db.Text)

class About(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text)

class Shift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64))
    begin = db.Column(db.Date)
    end = db.Column(db.Date)

class House(db.Model):
    price = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64))

class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer)
    meal = db.Column(db.Integer)
    child = db.Column(db.Integer)
    parent = db.Column(db.Integer)
    name = db.Column(db.String(64))
    mapid = db.Column(db.String(32))
    reg_allow = db.Column(db.Boolean)
    adminpswd = db.Column(db.String(60))
    actions = db.Column(db.String(8))

class AdminColumn(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(16))
    ctype = db.Column(db.String(4))
    title = db.Column(db.String(32))

class Register(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    family = db.Column(db.String(32))
    dates = db.Column(db.Integer)
    count = db.Column(db.Integer, default=2)
    children = db.Column(db.Integer, default=1)
    meal = db.Column(db.Integer, default=0)
    house = db.Column(db.Integer)
    friends = db.Column(db.String(32))
    email = db.Column(db.String(64))
    phone = db.Column(db.String(32))
    payment = db.Column(db.Boolean)
    code = db.Column(db.String(8))
    mid = db.Column(db.String(32))

class Parent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.String(32))
    surname = db.Column(db.String(32))
    firstname = db.Column(db.String(32))
    midname = db.Column(db.String(32))
    phone = db.Column(db.String(32))
    email = db.Column(db.String(64))
    social = db.Column(db.String(64))

class Child(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.String(32))
    surname = db.Column(db.String(32))
    firstname = db.Column(db.String(32))
    gender = db.Column(db.Integer, default=False)
    birthday = db.Column(db.Date)

class BeenLastYear(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(8))

def init_db():

    db.create_all()
    if Config.query.count() == 0:
        c = Config(
            id=0, year=2022,
            meal=0, child=0, parent=0,
            name='Не указано', mapid='0',
            reg_allow=True,
            adminpswd=DEF_PSWD,
            actions='mpvc'
        )
        db.session.add(c)

    if About.query.count() == 0:
        a = About(
            id=0, text='Пусто'
        )
        db.session.add(a)

    if AdminColumn.query.count() == 0:
        for k, v in {
            'id': ('№', 'num'),
            'actions': ('Действия', ''),
            'family': ('Семья', 'str'),
            'dates': ('Смена', 'num'),
            'count': ('Кол-во', 'num'),
            'adults': ('Взрослые', 'num'),
            'children': ('Дети', 'num'),
            'meal': ('Питание', 'num'),
            'house': ('Дом', 'num'),
            'friends': ('Друзья', 'str'),
            'cost': ('Стоимость', 'num')
        }.items():
            db.session.add(AdminColumn(
                key=k, title=v[0], ctype=v[1]
            ))

    db.session.commit()
