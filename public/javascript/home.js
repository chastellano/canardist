import baseUrl from './baseUrl.js'

const goButt = document.getElementById('goButt');
const pathInp = document.getElementById('pathInp');
const idWarning = document.getElementById('idWarning');
const charWarning = document.getElementById('charWarning');
const rulesButt = document.getElementById('rulesButt');
const rulesModal = document.getElementById('rulesModal');

pathInp.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
        goButt.click();
    }
});

rulesButt.addEventListener('click', () => {
    $('#rulesModal').modal('show');
})


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
        val = val.replace(/\s/g, '');
        gameId = val;
        window.location.href = baseUrl + gameId;        
    }
});