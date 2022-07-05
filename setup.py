from setuptools import setup

setup(
    name='lesa',
    version='1.0.1',
    packages=['lesa'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'waitress',
        'flask',
        'flask-wtf',
        'flask-sqlalchemy',
        'flask-migrate',
        'flask-bcrypt',
        'email-validator',
        'phonenumberslite',
        'pillow',
        'openpyxl'
    ],
)
