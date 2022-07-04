function markup(html) {

    let photos = '';
    let thumbs = '';
    html = html.replace(
        /photos=(.*?)\$!/g,
        (_m, p1) => {
            photos = p1;
            return '';
        }
    );
    html = html.replace(
        /thumbs=(.*?)\$!/g,
        (_m, p1) => {
            thumbs = p1;
            return '';
        }
    );

    let tags = {
        '[ж](.*?)[/ж]': '<b>$1</b>',
        '[к](.*?)[/к]': '<i>$1</i>',
        '[ч](.*?)[/ч]': '<u>$1</u>',
        '[з](.*?)[/з]': '<s>$1</s>',
        '[под(\\d)](.*?)[/под(?:\\d)?]': '<h$1>$2</h$1>',
        '[сс:?(.*?)](.*?)[/сс]': (_m, p1, p2) => {
            let url = p2;
            let text = p1;
            if (!p1) {
                url = p2;
                text = String(p2).slice(0, 48);
            }
            return `<a href="${url.trim()}">${text.trim()}</a>`;
        },
        '[сп:?(.*?)](.*?)[/сп]': (_m, p1, p2) => {
            let content = p2;
            let marker = 'disc';

            if (p1 == '1')
                return `<ol>${content.trim()}</ol>`;

            if (p1)
                marker = p1.trim();

            return `<ul style="list-style-type:${marker};">${content}</ul>`;
        },
        '[-](.*?)[/-]': '<li>$1</li>',
        '[кар](.*?)[/кар]':
            `<div class="photos" data-dir="${photos}">` +
                `<div class="photo">` +
                    `<a href="javascript:void(0);" onclick="showPhoto(this);" data-photo="$1">` +
                        `<img src="${thumbs}/$1" />` +
                    `</a>` +
                `</div>` +
            `</div>`,
        '\\+п(?:ере)?': '<br>'
    };

    return html.replace(
        /<div class="markup">([\s\S]+?)<\/div>/g,
        (_match, p1) => {

            let rendered = String(p1);
            for (let key in tags) {

                let repl = tags[key];
                let regex = key
                    .replace(/\[/g, '\\[')
                    .replace(/\]/g, '\\]');

                rendered = rendered.replace(
                    new RegExp(regex, 'gs'),
                    repl
                );
            }
            return rendered;
        }
    ).trim();
}
