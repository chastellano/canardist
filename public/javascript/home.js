import baseUrl from './baseUrl.js'
console.log('CONNECTED')

const goButt = document.getElementById('goButt');
const pathInp = document.getElementById('pathInp');
const idWarning = document.getElementById('idWarning');
const charWarning = document.getElementById('charWarning');

// const re = /[^\w\s_-]/ //matches letters, numbers, whitespace, _ and -

pathInp.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
        goButt.click();
    }
});


goButt.addEventListener('click', () => {
    idWarning.style.display = 'none';
    charWarning.style.display = 'none';
    let gameId;
    let val = pathInp.value;

    if (!val && pathInp.placeholder === 'Enter a game ID') {
        idWarning.style.display = 'block';
        return;
    } else if (!val) {
        gameId = pathInp.placeholder;
        window.location.href = baseUrl + gameId;
    } else {
        // const invalId = re.exec(val);
        // console.log('VALIDATE: ' + invalId);
        // if (invalId) {
            // charWarning.style.display = 'block';
            // return;
        // } else {
            console.log('VAL BEFORE: ' + val)
            val = val.replace(/\s/g, '');
            console.log('VAL AFTER: ' + val)
            gameId = val;
            window.location.href = baseUrl + gameId;
        // }
    }
    
    console.log(gameId);
});