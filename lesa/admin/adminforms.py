from datetime import datetime
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms import PasswordField
from wtforms import IntegerField, DateField
from wtforms import MultipleFileField
from wtforms import Form, FieldList, FormField
from wtforms import validators

class LoginForm(FlaskForm):
    password = PasswordField(label='Пароль')

class PasswordForm(FlaskForm):
    oldpswd = PasswordField(
        label='Старый пароль',
        validators=[validators.DataRequired()]
    )
    newpswd = PasswordField(
        label='Новый пароль',
        validators=[validators.DataRequired()]
    )
    confirm = PasswordField(
        label='Повторите пароль',
        validators=[validators.DataRequired()]
    )

class PostForm(FlaskForm):
    title = StringField(
        label='Заголовок',
        validators=[validators.Optional()]
    )
    photos = MultipleFileField(label='Фотографии')
    body = TextAreaField(
        label='Текст', id='post-body',
        validators=[validators.DataRequired()]
    )

class AboutForm(FlaskForm):
    photos = MultipleFileField(label='Добавить фото')
    text = TextAreaField(label='Текст', id='about-text')

class ShiftForm(Form):
    begin = DateField(label='Начало смены')
    end = DateField(label='Конец смены')

class HouseForm(Form):
    name = StringField(label='Тип дома')
    price = IntegerField(label='Цена')

class SeasonForm(FlaskForm):

    year = IntegerField(
        label='Год',
        validators=[validators.DataRequired()],
        default=datetime.now().year
    )

    shifts = FieldList(FormField(ShiftForm), label='Смены', min_entries=1)
    houses = FieldList(FormField(HouseForm), label='Домики', min_entries=1)

    meal = IntegerField(
        label='Стоимость питания',
        validators=[validators.DataRequired()]
    )
    child = IntegerField(
        label='Стоимость программы (ребёнок)',
        validators=[validators.DataRequired()],
        default=700
    )
    parent = IntegerField(
        label='Стоимость программы (взрослый)',
        validators=[validators.DataRequired()],
        default=500
    )

    name = StringField(
        label='Место',
        validators=[validators.DataRequired()]
    )
    photos = MultipleFileField(label='Фотографии')
    embed = TextAreaField(
        label='Яндекс.Карты',
        validators=[validators.DataRequired()]
    )
