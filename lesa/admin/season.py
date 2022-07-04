from flask import redirect
from flask import flash
from flask import request
from flask_wtf import FlaskForm
from wtforms import MultipleFileField

from ..app import app, db
from ..reg import show_errors
from ..upload import save_imgs
from ..models import Config, Shift, House

from . import check_token
from .adminforms import SeasonForm

mapurl = '/map-widget/v1/-/'

@app.route('/admin/season', methods=['POST'])
def new_season():

    if not check_token():
        return redirect('/admin')

    form = SeasonForm()
    if form.validate_on_submit():

        config = db.session.\
            query(Config).filter(Config.id == 0)
        
        config.update({
            'year': form.year.data,
            'meal': form.meal.data,
            'child': form.child.data,
            'parent': form.parent.data,
            'name': str(form.name.data)
        })
        flash('I:Цены установлены')

        shifts(form)
        houses(form)

        processimg(form.photos)
        changemap(form.embed.data, config)

        db.session.commit()
        flash('I:Готово')
        return redirect('/admin/panel#season')
    
    flash('F:' + show_errors(form))
    return redirect('/admin/panel#season')

def shifts(form:FlaskForm):
    Shift.query.delete()
    for i, sh in enumerate(form.shifts.data,1):
        # окончание для числительного номера смены:
        # 1-ая, 2-ая, 10-ая, 100500-ая, но
        # 3-я, 23-я, 33-я, 43-я
        ending = 'ая'
        if i % 10 == 3 and i != 13:
            ending = 'я'
        # добавляем
        db.session.add(Shift(
            begin=sh['begin'],
            end=sh['end'],
            # Пример к коду ниже:
            # 1-ая: 01.07 - 11.07
            title=\
                f'{i}-{ending}: '
                f'{sh["begin"]:%d.%m}-'
                f'{sh["end"]:%d.%m}'
        ))
    flash('I:Смены обновлены')
    
def houses(form:FlaskForm):
    House.query.delete()
    for h in form.houses.data:
        db.session.add(House(
            price=h['price'],
            title=\
                f'{h["name"]}: '
                f'{h["price"]} руб./чел.'
        ))
    flash('I:Домики обновлены')

def processimg(photos:MultipleFileField) -> None:

    pics = request.files.getlist(photos.name)
    if (not pics) or (not pics[0]):
        flash('W:Не загружены фотографии')
        return

    save_imgs(pics)
    
    count = len(pics)
    ending = \
        'я' if count == 1 else \
        'и' if count  < 5 else 'й'
    flash(f'I:{count} фотографи{ending} загружено')

def changemap(embed, config) -> None:

    # map id is after the prefix
    # (/map-widget/v1/-/)
    # and before a closing double quote
    prefix = embed.find(mapurl)
    closing = embed.find('"', prefix + 1)

    if prefix < 0 or closing < 0:
        flash('E:Не удалось найти ссылку на Яндекс.Карты')
        return
    
    # skip /map-widget/v1/-/
    prefix += len(mapurl)
    # extract id
    mapid = embed[prefix:closing]
    # update in db
    config.update({'mapid':mapid})
    # show notification
    flash('I:Карта обновлена')
