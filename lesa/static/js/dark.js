addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
        toggleDark(false, true);
    getCookieDark();
});

function toggleDark(btn, value) {

    // if value was not set,
    // just toggle dark mode
    if (value == undefined)
        document.body.classList.toggle('dark');
    else
        if (value)
            document.body.classList.add('dark');
        else
            document.body.classList.remove('dark');
    
    // if the function was called by onclick
    if (btn)
        setCookieDark();
}

function getCookieDark() {
    let raw = document.cookie;
    let list = raw.split(/; ?/);
    if (list.includes('lesa_dark=true'))
        toggleDark(true);
}

function setCookieDark() {
    let state = document.body.classList.contains('dark');
    document.cookie = 'lesa_dark=' + state + ';path=/';
}
