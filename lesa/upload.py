import re
import os
import shutil
import secrets
from PIL import Image
from flask_wtf.file import FileStorage
from typing import Any, Union, List, Tuple, Callable

basedir = os.path.abspath(os.path.dirname(__file__))
upload_dir = os.path.join(basedir, 'static', 'upload')

# .../static/upload/photos,thumbs
photos_dir, thumbs_dir = tuple(map(
    lambda dir: os.path.join(upload_dir, dir),
    ['photos', 'thumbs']
))

updirs = (photos_dir, thumbs_dir)

def post_dirs(post:Union[int,str]) -> Tuple[str]:

    id = str(post)
    # .../static/upload/photos,thumbs/id
    return tuple(map(
        lambda dir: os.path.join(dir, id),
        (photos_dir, thumbs_dir)
    ))

def html_dirs(post:Union[int,str]) -> Tuple[str]:

    id = str(post)
    # /static/upload/photos,thumbs/id
    # only for html!
    return tuple(map(
        lambda dir:
            os.path.join(dir, id)\
            .replace(basedir, ''),
        (photos_dir, thumbs_dir)
    ))

def listdir(path:str) -> List[str]:
    try:
        return os.listdir(path)
    except Exception:
        return []

def save_imgs(
    pics:Tuple[FileStorage],
    post:Union[int,str]=0,
    remove:bool=True) -> None:

    id = str(post)

    if remove:
        remove_dirs(post)
    check_dirs(post)

    for pic in pics:

        # secure name
        fname = filename(pic.filename, post)

        # generates something like
        # .../static/upload/photos/123/myphoto.jpg
        # .../static/upload/thumbs/123/myphoto.jpg
        # calling map for photos and thumbs dir
        orig_path, thumb_path = \
            tuple(map(
                lambda dir: os.path.join(dir, id, fname),
                (photos_dir, thumbs_dir)
            ))

        # save original
        pic.save(orig_path)

        # save thumbnail
        size = (196, 196)
        img = Image.open(pic.stream)
        img.thumbnail(size)
        img.save(thumb_path)

def check_dirs(
    post:Union[int,str]=-1,
    dirs:Tuple[str]=updirs) -> None:

    process_dirs(
        lambda p,e: os.makedirs(p) if not e else None,
        post, dirs
    )

def remove_dirs(
    post:Union[int,str]=-1,
    dirs:Tuple[str]=updirs) -> None:

    process_dirs(
        lambda p,e: shutil.rmtree(p) if e else None,
        post, dirs
    )

# callback args: dir path, does it exist
def process_dirs(
    callback:Callable[[str,bool],Any],
    post:Union[int,str]=-1,
    dirs:Tuple[str]=updirs) -> Tuple[Any]:

    def process(dir):
        path = os.path.join(dir, id)
        exists = os.path.exists(path)
        return callback(path, exists)

    id = str(post) if isinstance(post, str) or post > -1 else ''
    return tuple(map(process, dirs))

def filename(
    name:str,
    post:Union[int,str]=-1,
    dirs:Tuple[str]=updirs) -> str:
    
    # remove unsafe symbols and ..
    res = re.sub(
        r'[^A-Za-zА-Яа-я0-9\-+.]', '_',
        name
    ).replace('..', '')

    # the filename should not begin or end with .
    res = re.sub(r'(?:^\.)|(?:\.$)', '', res)

    # if the name is empty
    if res.strip() == '':
        res = 'file.png'

    # if the name is too long
    if len(res) > 32:
        # crop to the 30th character
        # from the end
        res = res[-30:]

    #
    # if the file is already exists
    #
    result = process_dirs(
        lambda path, _e:
            os.path.exists(
                os.path.join(path, name)
            ),
        post, dirs
    )
    print(result)
    # if at least one path exists,
    if any(result):
        # add some random symbols
        # at the beginning of the filename
        res = secrets.token_urlsafe(4) + res

    return res
