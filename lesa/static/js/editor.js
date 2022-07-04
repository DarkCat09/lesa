const edit = {
    selection: (textarea) => {
        let txt = textarea.value;
        let before = txt.slice(0, textarea.selectionStart);
        let selected = txt.substring(
            textarea.selectionStart,
            textarea.selectionEnd
        );
        let after = txt.slice(textarea.selectionEnd);
        return {
            before: before,
            after: after,
            content: selected,
            length: selected.length
        };
    },
    textarea: (elem) => {
        if (!(elem instanceof HTMLElement)) return;
        let toolbar = elem.parentElement.parentElement;
        id = toolbar.dataset.textarea;
        return document.getElementById(id);
    },
    insert: (elem, code) => {
        let textarea;
        if (elem.constructor == String)
            textarea = document.getElementById(elem);
        else
            textarea = edit.textarea(elem);
        let sel = edit.selection(textarea);
        let repl;
        if (code.constructor == Array)
            // 0 = beginning tag, 1 = closing tag
            repl = code[0] + sel.content + code[1];
        else
            // replacement for whole selection
            repl = code;
        textarea.value = sel.before + repl + sel.after;
    },
    bold: (elem) => {
        edit.insert(elem, ['[ж]','[/ж]']);
    },
    italic: (elem) => {
        edit.insert(elem, ['[к]','[/к]']);
    },
    underlined: (elem) => {
        edit.insert(elem, ['[ч]','[/ч]']);
    },
    strikeouted: (elem) => {
        edit.insert(elem, ['[з]','[/з]']);
    },
    linebreak: (elem) => {
        edit.insert(elem, ['+п\n','']);
    },
    heading: async (elem) => {
        let textarea = edit.textarea(elem);
        const title = 'Добавить подзаголовок';
        const def = edit.selection(textarea).content;

        let { value: size } = await Swal.fire({
            title: title,
            html: '<span id="example"></span>',
            showConfirmButton: true,
            showCancelButton: true,
            cancelButtonText: 'Отмена',
            input: 'range',
            inputLabel: 'Выберите размер подзаголовка',
            inputValue: 3,
            inputAttributes: {
                min: 1,
                max: 6,
                step: 1
            },
            didOpen: () => {

                let html = Swal.getHtmlContainer();
                let ex = html.querySelector('#example');
                let inp = Swal.getInput();
                function updateExample(val) {
                    val = Number(val);
                    if (!val) return;
                    ex.innerHTML = `<h${val}>Пример</h${val}>`;
                }
                updateExample(inp.value);

                inp.addEventListener('input', (ev) => {
                    updateExample(ev.target.value);
                });
            }
        });
        if (!size) return;

        let { value: txt } = await Swal.fire({
            title: title,
            showConfirmButton: true,
            showCancelButton: true,
            cancelButtonText: 'Отмена',
            input: 'text',
            inputPlaceholder: 'Введите текст',
            inputValue: def
        });
        if (!txt) return;

        edit.insert(elem, `[под${size}]${txt}[/под]`);
    },
    link: async (elem) => {
        let textarea = edit.textarea(elem);
        const title = 'Добавить ссылку';
        const def = edit.selection(textarea).content;

        let { value: url } = await Swal.fire({
            title: title,
            showConfirmButton: true,
            showCancelButton: true,
            input: 'url',
            inputPlaceholder: 'Введите URL-адрес'
        });
        if (!url) return;

        let { value: txt } = await Swal.fire({
            title: title,
            showConfirmButton: true,
            showCancelButton: true,
            input: 'text',
            inputPlaceholder: 'Введите текст',
            inputValue: def
        });

        txt = txt || '';
        let code = `[сс:${txt}]${url}[/сс]`;
        edit.insert(elem, code);
    },
    list: async (elem) => {
        const title = 'Добавить список';
        let { value: marker } = await Swal.fire({
            title: title,
            showConfirmButton: true,
            showCancelButton: true,
            input: 'select',
            inputPlaceholder: 'Выберите тип списка',
            inputOptions: {
                '-': '- Дефис',
                '*': '* Звёздочка',
                disc: '\u2022 Закрашенный круг',
                circle: '\u25e6 Незакрашенный круг',
                square: '\u25a0 Квадрат',
                decimal: '1. Нумерованный',
                'decimal-leading-zero': '01. Нумерованный (с нулём в начале)',
                'lower-roman': 'i. Маленькие римские цифры',
                'upper-roman': 'I. Большие римские цифры',
                'lower-alpha': 'a. Маленькие латинские буквы',
                'upper-alpha': 'A. Большие латинские буквы',
                'lower-greek': '\u03b1. Маленькие греческие буквы'
            }
        });
        if (!marker) return;

        let i = 1;
        let list_items = [];
        while (true) {

            let one = i % 10;  // разряд единиц
            let ten = i % 100; // разряд десятков
            let ending = 'ый';
            // 2ой
            if (one == 2 && ten != 1)
                ending = 'ой';
            // 3ий
            if (one == 3 && ten != 1)
                ending = 'ий';
            // 6ой, 7ой, 8ой
            if (one >= 6 && one <= 8 && ten != 1)
                ending = 'ой';
            
            let { value: item } = await Swal.fire({
                title: title,
                showConfirmButton: true,
                showCancelButton: true,
                input: 'text',
                inputPlaceholder:
                    `Введите ${i}-${ending} элемент списка`
            });
            if (!item) break;
            list_items.push(item);
            i++;
        }

        let code = `[сп:${marker}]`;
        for (let item of list_items) {
            code += `[-]${item}[/-]`;
        }
        code += '[/сп]';
        edit.insert(elem, code);
    },
    picture: async (elem) => {

        let filenames = {};

        let textarea = edit.textarea(elem);
        let form = textarea.parentElement;
        let photos = form.querySelectorAll('.photos>.photo>a');
        if (!photos.length < 1) {
            for (let p of photos) {
                data = p.dataset.photo;
                filenames[data] = data;
            }
        }

        let upload = form.querySelector('#photos');
        if (upload &&
            upload instanceof HTMLInputElement &&
            upload.type == 'file')
        {
            for (let f of upload.files) {
                filenames[f.name] = f.name;
            }
        }

        let { value: file } = await Swal.fire({
            title: 'Добавить картинку',
            showConfirmButton: true,
            showCancelButton: true,
            input: 'select',
            inputPlaceholder: 'Выберите загруженный файл',
            inputOptions: filenames
        });
        if (!file) return;
        edit.insert(elem, ['',`[кар]${file}[/кар]`]);
    }
};
