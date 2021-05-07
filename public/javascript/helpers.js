export const cards = {
    "ah": "cardsJS/cards/AH.svg",
    "ad": "cardsJS/cards/AD.svg",
    "ac": "cardsJS/cards/AC.svg",
    "as": "cardsJS/cards/AS.svg",
    "2h": "cardsJS/cards/2H.svg",
    "2d": "cardsJS/cards/2D.svg",
    "2c": "cardsJS/cards/2C.svg",
    "2s": "cardsJS/cards/2S.svg",
    "3h": "cardsJS/cards/3H.svg",
    "3d": "cardsJS/cards/3D.svg",
    "3c": "cardsJS/cards/3C.svg",
    "3s": "cardsJS/cards/3S.svg",
    "4h": "cardsJS/cards/4H.svg",
    "4d": "cardsJS/cards/4D.svg",
    "4c": "cardsJS/cards/4C.svg",
    "4s": "cardsJS/cards/4S.svg",
    "5h": "cardsJS/cards/5H.svg",
    "5d": "cardsJS/cards/5D.svg",
    "5c": "cardsJS/cards/5C.svg",
    "5s": "cardsJS/cards/5S.svg",
    "6h": "cardsJS/cards/6H.svg",
    "6d": "cardsJS/cards/6D.svg",
    "6c": "cardsJS/cards/6C.svg",
    "6s": "cardsJS/cards/6S.svg",
    "7h": "cardsJS/cards/7H.svg",
    "7d": "cardsJS/cards/7D.svg",
    "7c": "cardsJS/cards/7C.svg",
    "7s": "cardsJS/cards/7S.svg",
    "8h": "cardsJS/cards/8H.svg",
    "8d": "cardsJS/cards/8D.svg",
    "8c": "cardsJS/cards/8C.svg",
    "8s": "cardsJS/cards/8S.svg",
    "9h": "cardsJS/cards/9H.svg",
    "9d": "cardsJS/cards/9D.svg",
    "9c": "cardsJS/cards/9C.svg",
    "9s": "cardsJS/cards/9S.svg",
    "10h": "cardsJS/cards/10H.svg",
    "10d": "cardsJS/cards/10D.svg",
    "10c": "cardsJS/cards/10C.svg",
    "10s": "cardsJS/cards/10S.svg",
    "jh": "cardsJS/cards/JH.svg",
    "jd": "cardsJS/cards/JD.svg",
    "jc": "cardsJS/cards/JC.svg",
    "js": "cardsJS/cards/JS.svg",
    "qh": "cardsJS/cards/QH.svg",
    "qd": "cardsJS/cards/QD.svg",
    "qc": "cardsJS/cards/QC.svg",
    "qs": "cardsJS/cards/QS.svg",
    "kh": "cardsJS/cards/KH.svg",
    "kd": "cardsJS/cards/KD.svg",
    "kc": "cardsJS/cards/KC.svg",
    "ks": "cardsJS/cards/KS.svg"
}

export function checkcheck (mission, max) {
    mission+=1;
    $('#missionPropose').off('click');
    $('#proposeModalHeader').html(`Choose ${max} people for Mission ${mission}:`)
    return new Promise (function(resolve, reject){
        const checked = [];
        const checkboxArr = $('.checkcheck');
        checkboxArr.off('click');
        console.log(`There are ${checkboxArr.length} players`);
        // console.log($('.checkcheck'));
        console.log(`Mission: ${mission}, Max: ${max}`);
        checkboxArr.on('click', function () {
            if (this.checked && (checked.length < max)) {
                checked.push(this.nextElementSibling.innerHTML);
                // console.log(`Checked: ${checked.length}, Max: ${max}`);
            } else if (this.checked && (checked.length === max)) {
                this.checked = false;
                // console.log(`Checked: ${checked.length}, Max: ${max}`);
                $('#proposeModalHeader').html(`You can <strong class='text-danger'>ONLY</strong> choose ${max} people:`);
            } else if (!this.checked) {
                const index = checked.indexOf(this.nextElementSibling.innerHTML)
                checked.splice(index, 1);
                // console.log(`Checked: ${checked.length}, Max: ${max}`);
            }
        })
        $('#missionPropose').on('click', function () {
            if (checked.length === max) {
                // console.log('success!');
                checkboxArr.off('click');
                resolve(checked);
            } else {
                $('#proposeModalHeader').html(`You <strong class='text-danger'>MUST</strong> choose ${max} people:`);
            }
        });
        $('#proposeEsc').on('click', function() {
            $('#missionPropose').off('click');
            reject('Player exited proposal window')
        });
    });
}


// pass new child, and parent to append to. check to see if parent has same color class.
// if not, animate color of parent, then fade in new message
export function anim (newEl, el, listener = null) {
    const parent = '#' + el
    
    //checks if el has any child nodes, fades in child if not, applies listener
    if ($(parent).children().length === 0) {
        $(parent).append(newEl.hide().delay(400).fadeIn(1000, function() {
            if(listener) {
                listener();
            }
        }));

    } else {
        //grabs all children
        const oldEl = $(parent).find('*');

        //compare content of old and new children, escapes function if they are the same and no listener is passed
        const oldContent = oldEl.eq(0).html();
        const newContent = newEl.html();
        // console.log('OLD: ' + oldContent)
        // console.log('NEW: ' + newContent)
        if (!listener && oldContent === newContent) {
            console.log('same html, no listener')
        } else {
            //appends but hides new child, applies listener, captures css bg color in variable
            $(parent).append(newEl.hide());
            
            const oldColor = $(oldEl).css('background-color')
            const newColor = newEl.css('background-color');

            //if new (hidden) child and old child have same bg, visible child is faded out
            //and new child is faded in
            if (newColor === oldColor) {
                // console.log('same bg!')
                $(oldEl).fadeOut(400, function () {
                    $(this).remove();
                    newEl.delay(400).fadeIn(600, function() {
                        if (listener) {
                            listener();
                        }
                    });        
                });

            //if bgs are different, changes bg of parent behind old child to new child's bg color
            //fades out current child, fades in new child, applies listener
            } else {
                $(parent).css('background-color', newColor);
                // console.log('Parent bg is now: ', $(parent).css('background-color'));
                $(oldEl).fadeOut(600, function () {
                    $(this).remove();
                    newEl.delay(600).fadeIn(600, function () {
                        if (listener) {
                            listener();
                        }
                    });
                });
                // console.log (`There is ${$(parent).find('*').length} child in ${el}`)
                // console.log($(parent).html());
            }
        }
    }
}

export function insertMsg (msg, el) {
    el = '#' + el
    const check = ($(el)[0].scrollHeight - ($(el)[0].scrollTop + $(el)[0].offsetHeight) <= 2);
    $(el).append(msg.hide().fadeIn('slow'));
    if(check) {
        $(el)[0].scrollTop = $(el)[0].scrollHeight;
    }
}
