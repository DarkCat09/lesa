// Shows Messages from Flask
// As a SweetAlert Toasts

var t_elem = document.querySelector('.toasts');
var msgs = t_elem.querySelectorAll('.msg');
var last = msgs.length - 1;
var shown = false;
message(0);

function message(i) {
    if (shown) return;
    let el = msgs[i];
    if (!el) return;
    // show toast
    Swal.fire({
        icon: el.dataset.alert,
        title: el.innerHTML.trim(),
        position: 'top-end',
        toast: true,
        timer: 1000,
        timerProgressBar: true,
        showConfirmButton: false
    }).then(() => {
        // if it's the last notification,
        // remove the element and
        // stop the function
        if (i == last) {
            t_elem.remove();
            shown = true;
        }
        // otherwise, recursively start
        // this function for the next message
        message(i + 1);
    });
}
