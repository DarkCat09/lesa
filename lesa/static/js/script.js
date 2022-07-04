// Main script

addEventListener('load', checkTarget);
addEventListener('hashchange', checkTarget);

function checkTarget() {
    addr = window.location.hash.replace(/^#/, '');
    addr = (addr != '' ? addr : 'main');
    getPage(addr);
}

function toggleMap() {
    let map = document.querySelector('.map');
    let frm = map.querySelector('iframe');
    let btn = document.querySelector('.hidden-title>a');
    if (map.classList.contains('hidden')) {
        frm.src = frm.dataset.src;
        map.classList.remove('hidden');
        btn.innerHTML = 'Скрыть карту';
        return;
    }
    map.classList.add('hidden');
    btn.innerHTML = 'Показать карту';
}
