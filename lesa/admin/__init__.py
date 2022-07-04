from flask import request

access = ['']
def check_token(xhr:bool=False):

    cookie = request.cookies.get('lesa_admin', '0')
    result = (access[0] == cookie)

    if xhr:
        data = request.get_json(force=True)
        if not data: return False

        xhrtoken = data.get('token', '0')
        result = result and (access[0] == xhrtoken)

    return result

from . import admin
from . import formhandler
from . import regdb
from . import season
from . import backup
