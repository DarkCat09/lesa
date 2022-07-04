var tbody = document.querySelector('.regdb-wrapper table>tbody');
const rows_selector = 'tr:not(.caption)';

var tr = Array.from(tbody.querySelectorAll(rows_selector));
var tr_len = tr.length;

function columnContextMenu(ev) {
    if (!(ev instanceof MouseEvent)) return;
    hideContextMenu();
    let th = ev.currentTarget.parentElement;
    let menu = th.querySelector('ul.context-menu');
    menu.classList.add('open');
    menu.style.top = ev.pageY + 5 + 'px';
    menu.style.left = ev.pageX + 5 + 'px';
    ev.preventDefault();
    ev.stopPropagation();
}

function filter(col, elem) {

    hideContextMenu();
    if (!(elem instanceof HTMLAnchorElement)) return;
    col = Number(col) || 0;

    let menu = elem.parentElement.parentElement;

    let start = performance.now();

    let search = menu.querySelector('input').value;
    let rows = searchText(col, search.trim());

    let is_asc = menu.querySelector('select').value == 'asc';
    rows = filterBy(col, is_asc, rows);

    let end = performance.now();
    console.log('Filtering done in ' + (end - start));

    displayFiltered(rows);
    let end2 = performance.now();
    console.log('Rendering done in ' + (end2 - start));
}

function searchText(col, query, rows_arr) {

    // retrieving the rows list
    // получаем список строк
    rows_arr = rows_arr || tr;
    let rows_len = rows_arr.length;

    // if the query is not empty
    // если запрос не пустой
    if (query.trim() != '') {

        // searching the rows using css selector
        // ищем строки с помощью css-селектора
        matching = tbody.querySelectorAll(
            `${rows_selector}>td[data-value*="${query}"]:nth-child(${col + 1})`
        );
        let len = matching.length;
        let rows = [];
        for (let i = 0; i < len; i++) {
            rows.push(matching[i].parentElement);
        }

        for (let i = 0; i < rows_len; i++) {
            let elem = rows_arr[i];
            if (rows.indexOf(elem) > -1)
                elem.style.display = 'table-row';
            else
                elem.style.display = 'none';
        }
    }
    else {
        // or just show all rows
        // либо просто показываем все строки
        for (let i = 0; i < rows_len; i++) {
            rows_arr[i].style.display = 'table-row';
        }
    }

    return rows_arr;
}

function search(col, query, elem) {
    const cell_data = columnDataOne(col, elem);
    return cell_data.includes(query);
}

function filterBy(col, asc, rows_arr) {

    // retrieving the rows list
    // получаем список строк
    rows_arr = rows_arr || tr;

    // if asc, func=ascSort, else func=descSort
    let func = (
        asc ?
        (a,b) =>  ascSort(col,a,b) :
        (a,b) => descSort(col,a,b)
    );
    // sorting
    rows_arr.sort(func);
    return rows_arr;
}

function displayFiltered(rows) {

    // replacing the table content
    // меняем содержимое таблицы

    // clearing
    // очистка
    for (let i = 0; i < tr_len; i++) {
        (async i => tr[i].remove())(i);
    }

    // filling
    // заполнение
    let rows_len = rows.length;
    for (let i = 0; i < rows_len; i++) {
        (async i => tbody.append(rows[i]))(i);
    }
}

// descending
// от большего к меньшему
function descSort(col, a, b) {
    // распаковка
    const [a_val, b_val] = columnData(col, a, b);
    // -1 = a идёт первым
    //  1 = b идёт первым
    if (a_val < b_val) return 1;
    if (a_val > b_val) return -1;
    return 0;
}

// ascending
// от меньшего к большему
function ascSort(col, a, b) {
    // распаковка
    const [a_val, b_val] = columnData(col, a, b);
    // -1 = a идёт первым
    //  1 = b идёт первым
    if (a_val < b_val) return -1;
    if (a_val > b_val) return 1;
    return 0;
}

// extracting data from columns
// извлечение данных из столбцов
function columnData(col, a, b) {
    const a_col = a.querySelectorAll('td')[col].dataset;
    const b_col = b.querySelectorAll('td')[col].dataset;
    const a_val = (a_col.type == 'num' ? Number(a_col.value) : a_col.value);
    const b_val = (b_col.type == 'num' ? Number(b_col.value) : b_col.value);
    return [a_val, b_val];
}

function columnDataOne(col, a) {
    const a_col = a.querySelectorAll('td')[col].dataset;
    return a_col.value;
}
