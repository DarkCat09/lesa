import waitress
from lesa.app import app

if __name__ == '__main__':
    waitress.serve(app)
