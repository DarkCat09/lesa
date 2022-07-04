import phonenumbers
from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms import IntegerField, RadioField
from wtforms import DateField, TelField
from wtforms import FieldList, FormField
from wtforms import HiddenField
from wtforms import validators

from .models import Shift, House

# https://regexr.com/6n9s6
tel_regex = r'^\+?(\d+?)?([ \-()]*\d+){4}'

def phone_number(value:str) -> str:

    '''Приведение телефонного номера к одному формату'''

    # если указан украинский номер,
    # но без плюса в начале
    if value.startswith('380'):
        value = '+' + value
    
    # парсинг
    # (работает даже без кода страны!)
    result = phonenumbers.parse(value, 'RU')

    # пример: +79123456789
    return f'+{result.country_code}{result.national_number}'

class ParentForm(FlaskForm):
    surname = StringField(label='Фамилия')
    firstname = StringField(label='Имя')
    midname = StringField(label='Отчество')
    phone = TelField(
        label='Номер телефона',
        validators=[validators.Regexp(tel_regex)]
    )
    email = StringField(
        label='E-mail',
        validators=[validators.Email()]
    )
    social = StringField(
        label='VK/FB/Instagram',
        validators=[
            validators.URL(),
            validators.Optional()
        ]
    )

class ChildForm(FlaskForm):
    surname = StringField(label='Фамилия')
    firstname = StringField(label='Имя')
    gender = RadioField(label='Пол ребёнка', choices=[(0,'М'),(1,'Ж')])
    birthday = DateField(label='Дата рождения')

class RegisterForm(FlaskForm):
    family = StringField(
        label='Фамилия семьи',
        validators=[validators.DataRequired()]
    )
    dates = RadioField(
        label='Смена',
        validators=[validators.DataRequired()]
    )
    count = IntegerField(
        'Кол-во человек',
        validators=[
            validators.DataRequired(),
            validators.NumberRange(min=1,max=20)
        ]
    )
    children = IntegerField(
        'Кол-во детей',
        validators=[
            validators.DataRequired(),
            validators.NumberRange(min=1,max=10)
        ]
    )
    meal_count = IntegerField(
        'Питание',
        validators=[
            validators.DataRequired(),
            validators.NumberRange(min=0,max=20)
        ]
    )
    house = RadioField(
        label='Проживание',
        validators=[validators.DataRequired()]
    )
    # Из Google Формы:
    # С кем из друзей Вы хотите жить в одном домике?
    # Организаторы постараются учесть пожелания, но не гарантируют их исполнение.
    friends = StringField(
        label=
            'Фамилия друзей, с которыми '
            'Вы хотите жить в одном домике',
    )

    parentslst = FieldList(
        FormField(ParentForm),
        label='Данные родителей',
        min_entries=1, max_entries=2
    )
    childrenlst = FieldList(
        FormField(ChildForm),
        label='Данные детей',
        min_entries=1, max_entries=10
    )

    main_email = RadioField(
        label='Основная почта',
        validators=[validators.DataRequired()],
        choices=['', '']
    )
    main_phone = RadioField(
        label='Основной номер телефона',
        validators=[validators.DataRequired()],
        choices=['', '']
    )

    code = HiddenField()

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        shifts = Shift.query.all()
        houses = House.query.all()
        self.dates.choices = [(s.id, s.title) for s in shifts]
        self.house.choices = [(h.price, h.title) for h in houses]
