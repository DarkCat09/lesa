from flask import redirect
from flask import request
from typing import Any

from ..app import app, db
from ..models import Register, Config

from . import check_token

@app.route('/admin/payment', methods=['POST'])
def payment_done():

    if not check_token(xhr=True):
        return redirect('/admin')

    data = request.get_json(force=True)
    mid = data.get('mid')
    state = bool(data.get('state', True))

    db.session.\
        query(Register).filter(Register.mid == mid).\
        update({'payment': state})
    db.session.commit()

    return ''

def change_regallow(state:bool) -> Any:

    if not check_token(xhr=True):
        return redirect('/admin')

    db.session\
        .query(Config).filter(Config.id == 0)\
        .update({'reg_allow': state})
    db.session.commit()

    return ''

@app.route('/admin/closereg', methods=['POST'])
def close_reg():
    return change_regallow(False)

@app.route('/admin/openreg', methods=['POST'])
def open_reg():
    return change_regallow(True)

@app.route('/admin/clear', methods=['POST'])
def clear_reg():
    
    if not check_token(xhr=True):
        return redirect('/admin')

    db.session.query(Register).delete()
    db.session.commit()

    return ''
