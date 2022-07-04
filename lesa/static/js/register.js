// Interactive Forms and XHR

var page = 0;
var prev = false;
var forms = [];
var sendbtn = null;
var inprogress = false;
var jsform;

function regInit() {

    // blank forms
    jsform = {
        parent: document.querySelector('#parent-form>.fields'),
        child: document.querySelector('#child-form>.fields')
    };
    // they are removed from HTML,
    // but not from JS objects
    // and still can be accessed
    // with jsform.parent,child
    // (view update*Fields functions)
    //
    // они удаляются из HTML,
    // но не из объектов в JavaScript,
    // и всё ещё доступны через jsform.parent,child
    // (см. функции update*Fields)
    jsform.parent.remove();
    jsform.child.remove();

    // initialize
    let cb = document.querySelector('#f1 input[type=checkbox]');
    cb.checked = true;
    updateParentsFields(cb);
    updateChildrenFields(1);
    changePage();

    document.querySelectorAll('ul.hide-items>li').forEach(
        elem => elem.classList.add('hidden')
    );
}

// ***
// Simple Forms Page Switcher

function regNext() {
    page++;
    changePage();
}

function regPrev() {
    page--;
    prev = true;
    changePage();
    prev = false;
}

function changePage() {

    // refresh
    forms = document.querySelectorAll('div.form');
    btns = document.querySelectorAll('footer>.button');
    last = forms.length - 1;

    // check
    page = Math.max(page, 0);
    page = Math.min(page, last);

    // hide all forms
    // excluding id=f<page>
    for (var i = 0; i < forms.length; i++) {
        if (forms[i] == forms[page]) {
            forms[i].style.display = 'block';
            continue;
        }
        forms[i].style.display = 'none';
    }

    // change buttons state
    // (active / inactive)
    if (page == 0) { btns[0].classList.add('inactive'); }
    if (page != 0) { btns[0].classList.remove('inactive'); }
    if (page == last) { btns[1].classList.add('inactive'); }
    if (page != last) { btns[1].classList.remove('inactive'); }

    // progressbar
    document.body.style.setProperty('--pbwidth', `${100 / (forms.length - 1) * page}%`);
}

function computeCost(cb, phone) {

    // how many people
    let count_elem = document.querySelector('input#count');
    let count = Number(count_elem.value) || 2;
    let children_elem = document.querySelector('input#children');
    let children = Number(children_elem.value) || 1;
    let meals_elem = document.querySelector('input#meal_count');
    let meals_count = Number(meals_elem.value) || count;

    // what type of house and its price
    let house = Array.from(
        document.querySelectorAll(
            'ul#house input[type=radio]'
        )
    ).filter(elem => elem.checked)[0];
    let selected = (house ? house.value : 0);

    // camp activities and meals price
    let block = document.querySelector('div.price');
    let meal = block.querySelector('#meal').innerHTML;
    let child = block.querySelector('#child').innerHTML;
    let parent = block.querySelector('#parent').innerHTML;

    // the 1st shift date and children's birthdays
    let shift = block.querySelector('#shift').innerHTML;

    // span where must be displayed the cost
    let field = document.querySelector('span.cost>span.number');

    (async () => {

        field.classList.add('loading');

        // children's birthdays
        let birthdays = document.querySelectorAll('div.form.child input[type=date][name$=-birthday]');
        let children_bday = []; // date as a timestamp
        birthdays.forEach(elem => {
            if (!(elem instanceof HTMLInputElement && elem.type == 'date')) return;
            children_bday.push(elem.valueAsNumber);
        });

        // compute and display
        let code = (cb ? await genCode(cb, phone) : [null])
        let result = await getCost(
            { // prices
                meal: meal,
                child: child,
                parent: parent
            },
            { // family data
                count: count,
                children: children,
                house: selected,
                meals: meals_count
            },
            { // additional data
                shift: shift,
                birthdays: children_bday,
                code: code[0]
            }
        );
        field.innerHTML = result[0];

        if (cb) {
            let was_checked = cb.checked;
            cb.checked = result[1];
            // if not errored and cb was checked
            if (!code[1] && was_checked)
                processVerificationResult(result[1]);
        }

        if (result[1]) {
            document.getElementById('code').value = code[0];
        }

        field.classList.remove('loading');

    })();
}

async function genCode(cb, phone) {

    if (!(cb instanceof HTMLInputElement)) return;

    if (cb.checked || phone) {

        if (!phone) {

            let main_phone = Array.from(
                document.querySelectorAll(
                    'ul#main_phone input[type=radio]'
                )
            ).filter(elem => elem.checked)[0];
            
            phone = (
                main_phone ?
                main_phone.value :
                document.querySelector(
                    'input[name$=-phone]'
                ).value
            );
        }

        let family = document.getElementById('family').value;
        const {code, err} = await getCode(family, phone);

        if (err) {
            await Swal.fire({
                icon: 'warning',
                title: String(err).replace(/^\d+?:/, ''),
                showConfirmButton: true,
                heightAuto: false
            });
            cb.checked = false;
            return [null, true];
        }
        return [code, false];
    }

    return [null];
}

function processVerificationResult(state) {

    if (Boolean(state)) return;

    const code_err =
        'Для проверки, что Ваша семья была ' +
        'в лагере в прошлом году используется код, ' +
        'состоящий из 4 цифр номера телефона и 4 букв фамилии. ' +
        'Ваш код не удалось найти в базе. ' +
        'Возможно, Вы поменяли номер телефона. ' +
        'Введите здесь старый номер, либо свяжитесь с организатором.';

    Swal.fire({
        icon: 'error',
        title: 'Не удалось найти код!',
        text: code_err,
        showConfirmButton: true,
        showCancelButton: true,
        cancelButtonText: 'Отмена',
        input: 'text',
        inputPlaceholder: 'Старый номер телефона',
        heightAuto: false
    }).then(result => {
        if (result.isConfirmed) {
            let cb = document.getElementById('been-last-year');
            cb.checked = true;
            computeCost(cb, result.value);
        }
    });
}

function updateParentsFields(cb) {

    if (!(cb instanceof HTMLInputElement)) return;

    let form = cb.parentElement.parentElement.parentElement;
    // if the parent is not going to the camp
    if (!cb.checked) {
        form.querySelector('.fields').remove();
        return;
    }

    // otherwise
    let page_str = form.id.replace('f', '');
    let page = Number(page_str);
    let field = page - 1;

    form.append(createItem(jsform.parent, field));
}

function updateChildrenFields(count) {

    const PAGES_BEFORE_CHILDREN = 2;

    if (count == '') return;
    
    count = Number(count) || 1;
    count = Math.min(count, 10);
    let children = document.querySelectorAll('div.form.child');
    let diff = count - children.length;

    let parents = document.querySelectorAll('div.form.parent');
    let lastparent = parents[parents.length-1];

    let lastchild = children[children.length-1];
    let lastid;
    if (lastchild)
        lastid = lastchild.id.replace('f', '');
    lastid = Number(lastid) || PAGES_BEFORE_CHILDREN;

    if (diff > 0) {
        for (var i = 0; i < diff; i++) {

            let field = lastid - PAGES_BEFORE_CHILDREN + i;
            let pagenum = lastid + 1;

            let newpage = document.createElement('div');
            newpage.classList.add('form');
            newpage.classList.add('child');
            newpage.id = 'f' + pagenum;

            newpage.append(createItem(jsform.child, field));

            let prev_elem = lastchild || lastparent;
            prev_elem.insertAdjacentElement('afterend', newpage);

            lastchild = newpage;
        }
        // reload to automatically set
        // display:none for new pages
        changePage();
    }
    else if (diff < 0) {
        Array.from(children)
            .slice(children.length + diff)
            .forEach(elem => elem.remove());
    }
}

function createItem(baseform, num) {
    let newform = baseform.cloneNode(true);
    newform.id = newform.id.replace(/\d+/, num);

    let lbl = newform.querySelectorAll('label');
    lbl.forEach(elem => {
        elem.htmlFor = elem.htmlFor.replace(/\d+/, num);
    });

    let inp = newform.querySelectorAll('input');
    inp.forEach(elem => {
        elem.id = elem.id.replace(/\d+/, num);
        elem.name = elem.name.replace(/\d+/, num);
    });

    return newform;
}

function changeMainEmail() {
    changeChoices('email');
}

function changeMainPhone() {
    changeChoices('phone');
}

function changeChoices(field) {

    const no_data = 'Не указано';
    let fields = document.querySelectorAll(`input[id$=-${field}]`);
    let list = document.querySelectorAll(`#main_${field}>li`);
    let radio = document.querySelectorAll(`#main_${field}>li>input`);
    try {

        let val1 = fields[0].value.trim() || no_data;
        list[0].classList.remove('hidden');
        radio[0].value = val1;
        radio[0].labels[0].innerText = val1;

        if (fields.length > 1) {

            let val2 = fields[1].value.trim() || no_data;
            list[1].classList.remove('hidden');
            radio[1].value = val2;
            radio[1].labels[0].innerText = val2;
            return;
        }

        list[1].classList.add('hidden');
        [radio[1].checked, radio[0].checked] = [false, true];
    }
    catch (_err) {}
}

// ***
// Sending forms data

function regSend() {

    // if a user has already sent the data
    if (inprogress) return;

    //
    
    let regform = document.querySelector('form');
    sendbtn = document.querySelector('a#send');
    
    // send form
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/form/register');
    xhr.responseType = 'json';
    xhr.onreadystatechange = () => {
        if (xhr.readyState != xhr.DONE) return;

        if (xhr.status == 500) {
            error('Произошла ошибка на сервере');
            return;
        }

        if (xhr.status != 200) {
            error(`Ошибка ${xhr.status} ${xhr.statusText}`);
            return;
        }

        if (!xhr.response.ok) {
            error(xhr.response.data);
            return;
        }

        end();

        Swal.fire({
            icon: 'success',
            title: 'Готово!',
            timer: 2000,
            heightAuto: false
        });

        // switch to the main page
        window.location.hash = '';
    };
    xhr.send(new FormData(regform));

    // change text
    sendbtn.innerHTML = 'Отправка...';
    inprogress = true;
}

function error(data) {

    end();

    const csrf_err = 
        'Похоже, сервер перезапустился ' +
        '(а это должно быть очень редко),\n' +
        'из-за чего поменялся код безопасности.\n' +
        'Вам нужно будет заполнить форму заново.';

    // if it's a list of wtforms errors
    if (data && data.constructor == Array) {

        let fields = data.join(', ').toLowerCase();

        console.log(fields);
        console.log(fields.includes('csrf token'));
        console.log(fields.indexOf('csrf token'));

        // if the server was restarted
        if (fields.includes('csrf token')) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка CSRF_TOKEN',
                text: csrf_err,
                heightAuto: false
            }).then((result) => {
                if (result.isConfirmed)
                    window.location.reload();
            });
            return;
        }

        // else, just show which fields are invalid
        Swal.fire({
            icon: 'error',
            title: 'Неверно заполнены:',
            text: fields,
            heightAuto: false
        });
        return;
    }

    // otherwise,
    // show an error message
    Swal.fire({
        icon: 'error',
        title: data,
        heightAuto: false
    });
}

function end() {
    inprogress = false;
    sendbtn.innerHTML = 'Отправить';
    page = 0;
    changePage();
}
