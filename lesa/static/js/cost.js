async function getCost(price, data, adv, been_last_year) {

    /*
    price: {meal, child, parent}
    data: {count, children, meals, house}
    adv: {shift, birthdays, code}
    been_last_year: ['123abc', '456cde']
    */

    // just multiply
    let adults          = data.count   - data.children;
    let house_cost      = data.house   * data.count;
    let meals           = price.meal   * data.meals;
    let camp_children   = price.child  * data.children;
    let camp_parents    = price.parent * adults;

    // discounts
    const third_child = 0.5; // 50%
    const last_year = 0.1; // 10%

    let birthdays = adv.birthdays || [];
    let shift = Number(adv.shift);
    if (birthdays.constructor == Array) {

        if (birthdays.length >= 3 &&
            birthdays.every(
                el => childAge(el,shift) > 3
            )
        ) {
            // remove one child's camp activities cost
            camp_children -= price.child;
            // and add it back with discount
            camp_children += price.child - (price.child * third_child);
        }
    }

    let camp = camp_parents + camp_children;
    let verified = false;

    if (adv.code) {

        adv.code = String(adv.code);
        
        // if the list is provided
        // (e.g. this function was
        //       executed from admin panel)
        if (been_last_year &&
            been_last_year.constructor == Array)
        {
            // check if it has the family code
            verified = been_last_year.includes(adv.code);
        }
        else {
            let req = await fetch('/form/code', {
                method: 'POST',
                body: JSON.stringify({
                    code: String(adv.code)
                }),
                headers: {
                    'Content-Type':
                    'application/json;charset=utf-8'
                }
            });
            let json = await req.json();
            verified = (json.data === true);
        }

        if (verified) {
            // if the family was in the camp last year
            // (it is verified with the code),
            // give them a discount
            camp -= camp * last_year;
        }
    }

    // result
    return [
        house_cost + meals + camp,
        verified
    ];
}

function childAge(bday, shift) {
    let diff = shift * 1000 - bday;
    let hours = diff / 1000 / 60 / 60;
    return hours / 24 / 365;
}

async function getCode(family, phone) {

    let code = null;
    if (!family) return {code: null, err: '11: Не указана фамилия семьи!'};
    if (!phone)  return {code: null, err: '21: Не указан номер телефона!'};

    // first 4 letters of surname
    // первые 4 буквы фамилии
    let letters = String(family).slice(0, 4);

    let m = String(phone).match(/\d/g);
    if (!m) {
        return {
            code: null,
            err: '22: Не указан номер телефона!'
        }
    }

    // -4 = four digits from the end
    // -4 = четыре цифры с конца
    last_digits = m.slice(-4).join('');

    // Ивановы, 912 345 6789 =
    // 6789Иван
    code = last_digits + letters;

    return {code: code};
}
