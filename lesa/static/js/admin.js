addEventListener('load', checkTarget);
addEventListener('hashchange', checkTarget);

addEventListener('load', beenLastYearList);

const session_regex = /lesa_admin=([\w\-]+)(?:;|$)/;

var titles = document.querySelectorAll('.tabs-title>li:not(.toggle)');
titles.forEach(el => {
    el.addEventListener('click', activated);
});

function checkTarget() {
    addr = window.location.hash.replace(/^#/, '');
    addr = '#' + (addr != '' ? addr : 'posts');
    window.location.hash = addr;
    let tab = document.querySelector('.tabs-title>li>a[href="' + addr + '"]');
    tab.click();
}

function activated(ev) {
    titles.forEach((el) => {
        el.classList.remove('active');
    });
    ev.currentTarget.classList.add('active');
    if (!(ev.currentTarget instanceof HTMLAnchorElement)) {
        ev.stopPropagation();
    }
}

function beenLastYearList() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/admin/been_last_year');
    xhr.onloadend = () => {
        if (xhr.status == 200 &&
            xhr.response &&
            xhr.response.constructor == String)
        {
            been_last_year =
                xhr.response
                    .trim()
                    .replace('\r\n', '\n')
                    .split('\n');
        }
    };
    xhr.send(JSON.stringify({
        token: sessionCookie()
    }));
}

function photoContextMenu(ev) {
    if (!(ev instanceof MouseEvent)) return;
    hideContextMenu();
    let photo = ev.currentTarget.parentElement;
    let menu = photo.querySelector('ul.context-menu');
    menu.classList.add('open');
    menu.style.top = ev.offsetY + 5 + 'px';
    menu.style.left = ev.offsetX + 5 + 'px';
    ev.preventDefault();
    return false;
}

function hideContextMenu() {
    let menus = document.querySelectorAll('ul.context-menu.open');
    for (let m of menus) {
        m.classList.remove('open');
    }
}

function insertPhoto(id) {
    edit.insert('about-text', ['',`[кар]${id}[/кар]`]);
}

function deletePhoto(id) {
    Swal.fire({
        icon: 'warning',
        title: 'Удалить фото?',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет'
    }).then(result => {
        if (result.isConfirmed) {
            adminRequest('rmphoto', id, false);
        }
    });
}

function removePost(id) {
    id = Number(id);
    if (!id) return;
    Swal.fire({
        icon: 'warning',
        title: 'Удалить пост?',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет'
    }).then(result => {
        if (result.isConfirmed) {
            adminRequest('rmpost', id);
        }
    });
}

function closeReg() {
    Swal.fire({
        icon: 'warning',
        title: 'Закрытие регистрации',
        text:
            'Когда начинается смена, желательно ' +
            'закрыть доступ к регистрации, ' +
            'чтобы никто не мог добавить записи в таблицу. ' +
            'Открыть регистрацию на новый сезон ' +
            'можно будет этой же кнопкой. ' +
            'Продолжить?',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет'
    }).then(result => {
        if (result.isConfirmed) {
            adminRequest('closereg');
        }
    });
}

function openReg() {
    Swal.fire({
        icon: 'question',
        title: 'Открытие регистрации',
        text:
            'Когда определились с турбазой и ценами, ' +
            'можно открывать регистрацию для принятия заявок. ' +
            'Желательно сначала указать информацию в разделе [Новый сезон]. ' +
            'Продолжить?',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет'
    }).then(result => {
        if (result.isConfirmed) {
            adminRequest('openreg');
        }
    });
}

function clearReg() {
    Swal.fire({
        icon: 'error',
        title: 'Очистка списка',
        text:
            'Очистить весь список зарегистрированных пользователей? ' +
            'Резервную копию можно сделать в разделе [Архивация].',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Да',
        cancelButtonText: 'Нет',
        focusCancel: true
    }).then(result => {
        if (result.isConfirmed) {
            adminRequest('clear');
        }
    });
}

function tableComputeCost() {

    let block = document.querySelector('.price.hidden');
    let meal = block.querySelector('#meal').innerHTML;
    let child = block.querySelector('#child').innerHTML;
    let parent = block.querySelector('#parent').innerHTML;
    let shift = block.querySelector('#shift').innerHTML;

    let tbody = document.querySelector('.regdb-wrapper table>tbody');
    let tr = tbody.querySelectorAll('tr:not(.caption)');

    for (let row of tr) {
        (async (row) => {
            let code = row.dataset.code;
            let count = row.querySelector('td.count').dataset.value;
            let children = row.querySelector('td.children').dataset.value;
            let meals = row.querySelector('td.meal').dataset.value;
            let house = row.querySelector('td.house').dataset.value;
            let cost = row.querySelector('td.cost-cell');
            if (cost.dataset.value > 0) return;
            try {
                let res = await getCost(
                    { // prices
                        meal: meal,
                        child: child,
                        parent: parent
                    },
                    { // family data
                        count: count,
                        children: children,
                        meals: meals,
                        house: house
                    },
                    { // additional data
                        shift: shift,
                        birthdays: [],
                        code: code
                    },
                    been_last_year // view admin.html
                );
                cost.dataset.value = res[0];
                cost.querySelector('span.cost').innerText = res[0];
            }
            catch (err) {
                console.log(err);
            }
        })(row);
    }
}

function createItem(selector) {

    let match = String(selector).match(/\-(\d+)$/);
    if (!match) return;
    let item = Number(match[1]);
    item++;

    //
    let elem = document.querySelector(selector);
    if (!(elem instanceof HTMLElement)) return;

    //
    let elem2 = elem.cloneNode(true);
    elem2.id = elem2.id.replace(/\d+/, item);

    let lbl = elem2.querySelectorAll('label');
    lbl.forEach(el => {
        el.htmlFor = el.htmlFor.replace(/\d+/, item);
    });

    let inp = elem2.querySelectorAll('input');
    inp.forEach(el => {
        el.id = el.id.replace(/\d+/, item);
        el.name = el.id.replace(/\d+/, item);
        // if it's not a CSRF token
        if (el.type != 'hidden')
            el.value = '';
    });

    //
    let btn = elem.parentElement.parentElement.querySelector('input[type=button]');
    btn.onclick = () => createItem('#' + elem2.id);

    //
    let num = item + 1;
    let shift_num = elem.previousElementSibling;
    let shift_num2 = shift_num.cloneNode(true);
    shift_num2.innerHTML = shift_num2.innerHTML.replace(/\d+/, num);

    //
    elem.insertAdjacentElement('afterend', elem2);
    elem.insertAdjacentElement('afterend', shift_num2);
}

function markAsDone(el) {
    familyRowRequest(
        el, 'payment',
        (_r, td) => {
            td.classList.toggle('done');
            td.dataset.value = (td.dataset.value == 1 ? 0 : 1);
        }
    );
}

function showParentsData(el) {
    familyRowRequest(
        el, 'parents', resp => {
            Swal.fire({
                html: resp,
                confirmButtonText: 'Закрыть'
            });
        }
    );
}

function showChildrenData(el) {
    familyRowRequest(
        el, 'children', resp => {
            Swal.fire({
                html: resp,
                confirmButtonText: 'Закрыть'
            });
        }
    );
}

function adminRequest(url, data, reload) {
    reload = (reload != undefined ? reload : true);
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/admin/' + url);
    if (reload) {
        xhr.onloadend = () => window.location.reload();
    }
    xhr.send(JSON.stringify({
        token: sessionCookie(),
        data: data
    }));
}

function familyRowRequest(el, url, cb) {
    if (!(el instanceof HTMLElement)) return;
    cb = cb || function(_resp, _elem){};
    let td = el.parentElement;
    let row = td.parentElement;
    let family = row.id;
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/admin/' + url);
    xhr.onreadystatechange = () => {
        if (xhr.readyState != xhr.DONE) return;
        if (xhr.response == null) {
            Swal.fire({
                icon: 'error',
                title: `Ошибка ${xhr.status}`
            });
        }
        else
            cb(xhr.response, td);
    };
    xhr.send(JSON.stringify({
        token: sessionCookie(),
        mid: family,
        state: !td.classList.contains('done')
    }));
}

function sessionCookie() {
    return document.cookie.match(session_regex)[1];
}
