function showPhoto(elem) {
    if (!(elem instanceof HTMLAnchorElement)) return;
    let parts = getPhotoUrl(elem);
    let file = parts[1];
    let url = parts.join('/');
    Swal.fire({
        text: file,
        imageUrl: url,
        showCancelButton: true,
        confirmButtonText: 'Увеличить',
        cancelButtonText: 'Закрыть',
        heightAuto: false
    }).then((result) => {
        if (result.isConfirmed) {
            let link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.click();
        }
    });
}

function getPhotoUrl(elem) {
    let photos = elem.parentElement.parentElement;
    let dir = photos.dataset.dir;
    let file = elem.dataset.photo;
    return [dir, file];
}
