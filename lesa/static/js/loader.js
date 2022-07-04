// Content Loader

var addr = '';

function getPage(name) {
    addr = name;
    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/page/' + name);
    xhr.onreadystatechange = () => {
        // if loading
        if (xhr.readyState != xhr.DONE)
            return
        // if completed
        // show response
        if (xhr.status == 200) {
            showContent(xhr.response);
            return
        }
        // or notify about error
        xhrError(xhr.status, xhr.statusText);
    }
    xhr.send();
}

function showContent(html) {
    var block = document.querySelector('.content-wrapper');
    let page = html.replace(
        /<div class="timestamp">(\d+)(?:\.\d+)?/g,
        (_match, p1) => {
            let dt = new Date(p1 * 1000);
            let str = dt.toLocaleString(['ru'])
            return '<div class="timestamp">' + str;
        }
    );
    page = markup(page);
    block.innerHTML = page;
    if (addr == 'register') regInit();
    addr = '';
}

function xhrError(code, err) {
    console.log(
        'Unable to perform an XHR request!\n' + 
        `Status: ${code} ${err}`
    );
}
