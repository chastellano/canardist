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

export const cardBack = "cardsJS/cards/BLUE_BACK.svg";

export function checkcheck (round, max) {
    $('#roundPropose').off('click');
    $('.proposeWarning').css('display', 'none');
    $('#proposeModalHeader').html(`Choose ${max} people for Round ${round+1}:`)
    return new Promise (function(resolve, reject){
        const checked = [];
        const checkboxArr = $('.checkcheck');
        checkboxArr.off('click');
        checkboxArr.on('click', function () {
            if (this.checked && (checked.length < max)) {
                checked.push(this.nextElementSibling.innerHTML);
            } else if (this.checked && (checked.length === max)) {
                this.checked = false;
                $('.proposeWarning').css('display', 'none');
                $('#tooManyWarning').html(`You can ONLY choose ${max} people`);
                $('#tooManyWarning').css('display', 'block');
                $('#proposeModal').animate({
                    scrollTop: `${$('#proposeModal').prop('scrollHeight')}`
                });
            } else if (!this.checked) {
                const index = checked.indexOf(this.nextElementSibling.innerHTML)
                checked.splice(index, 1);
            }
        })
        $('#roundPropose').on('click', function () {
            if (checked.length === max) {
                checkboxArr.off('click');
                resolve(checked);
            } else {
                $('.proposeWarning').css('display', 'none');
                $('#tooFewWarning').html(`You MUST choose ${max} people`);
                $('#tooFewWarning').css('display', 'block');
                $('#proposeModal').animate({
                    scrollTop: `${$('#proposeModal').prop('scrollHeight')}`
                });
            }
        });
        $('#proposeEsc').on('click', function() {
            $('#roundPropose').off('click');
            reject('Player exited proposal window')
        });
    });
}



export function anim (newElement, parentElement, listener = null) {
    const parent = '#' + parentElement

    //checks if el has any child nodes, fades in child if not, applies listener
    if ($(parent).children().length === 0) {
        $(parent).append(newElement.hide().delay(400).fadeIn(1000, function() {
            if(listener) {
                listener();
            }
        }));

    } else {
        if ($('.action').is(':animated').length > 0) { //stops any currently running action button animations
            $('.action').finish();
        }

        //grabs all children
        const oldEl = $(parent).find('*');

        //compare content of old and new children, returns if they are the same and no listener is passed
        const oldContent = oldEl.eq(0).html();
        const newContent = newElement.html();

        if (listener || oldContent != newContent) {
            //appends but hides new child, captures css bg color in variable
            $(parent).append(newElement.hide());
            
            const oldColor = $(oldEl).css('background-color')
            const newColor = newElement.css('background-color');

            //if new (hidden) child and old child have same bg, visible child is faded out
            //and new child is faded in, applies listener
            if (newColor === oldColor) {
                $(oldEl).fadeOut(400, function () {
                    $(this).remove();
                    newElement.delay(400).fadeIn(600, function() {
                        if (listener) {
                            listener();
                        }
                    });        
                });

            //if bgs are different, changes bg of parent behind old child to new child's bg color
            //fades out current child, fades in new child, applies listener
            } else {
                $(parent).css('background-color', newColor);
                $(oldEl).fadeOut(600, function () {
                    $(this).remove();
                    newElement.delay(600).fadeIn(600, function () {
                        if (listener) {
                            listener();
                        }
                    });
                });
            }
        }
    }
}