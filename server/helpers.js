const red = ['ah', 'ad', '2h', '2d', '3h', '3d', '4h', '4d', '5h', '5d', '6h', '6d', '7h', '7d', '8h', '8d', '9h', '9d', '10h', '10d', 'jh', 'jd', 'qh', 'qd', 'kh', 'kd'];
const black = ['ac', 'as', '2c', '2s', '3c', '3s', '4c', '4s', '5c', '5s', '6c', '6s', '7c', '7s', '8c', '8s', '9c', '9s', '10c', '10s', 'jc', 'js', 'qc', 'qs', 'kc', 'ks'];
const buttColors = ['btn-green', 'btn-blue', 'btn-yellow', 'btn-red', 'btn-indigo', 'btn-brown', 'btn-orange', 'btn-violet', 'btn-beige', 'btn-aqua']

function genTeamsTemp(num) {
    let reds;
    let blacks;  
    switch (num) {
        case 5:
            blacks = 3
            reds = 2
            break;
        case 6:
            blacks = 4
            reds = 2
            break;
        case 7:
            blacks = 4
            reds = 3
            break;
        case 8:
            blacks = 5
            reds = 3
            break;
        case 9:
            blacks = 6
            reds = 3
            break;
        case 10:
            blacks = 6
            reds = 4
            break;
        default:
            break;
    }
    return {blacks, reds};
}

function roundArr(num) {
    const rounds = []
    switch (num) {
        case 5:
            rounds[0] = 2;
            rounds[1] = 3;
            rounds[2] = 2;
            rounds[3] = 3;
            rounds[4] = 3;
            break;
        case 6:
            rounds[0] = 2;
            rounds[1] = 3;
            rounds[2] = 4;
            rounds[3] = 3;
            rounds[4] = 4;
            break;
        case 7:
            rounds[0] = 2;
            rounds[1] = 3;
            rounds[2] = 3;
            rounds[3] = 4;//***
            rounds[4] = 4;
            break;
        case 8:
        case 9:
        case 10:
            rounds[0] = 3;
            rounds[1] = 4;
            rounds[2] = 4;
            rounds[3] = 5;//***
            rounds[4] = 5;
            break;
        default:
            break;
    }
    return rounds;
}

function shuffle(arr) {
    let i, j, x;
    for (i = arr.length - 1; i; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
    return arr;
}

//removes num items from arr, if num is 1 it returns the item, if more than 1 it returns array of items
function dealOut (num, arr) {
    newArr = arr.splice(0, num)
    if (num === 1) {
        return newArr[0];
    } else {
        return newArr;
    }
}

//returns item to arr, if item is array it is flattened and then concatenated to arr
function dealReturn (item, arr) {
    if ( typeof item === 'string' ) {
        arr.push(item);
    } else if ( Array.isArray(item) ) {
        item = item.flat();
        arr.push(...item);
    } else {
        console.log('first argument can only accept an array or string')
    }
}

//takes a teams template as argument, instantiates/shuffles new game deck, deals out requisite id cards from each deck
function dealIdentity(game, temp) {
    game['deck']['red'] = shuffle(red.slice());
    game['deck']['black'] = shuffle(black.slice());

    const blackIdCards = dealOut(temp.blacks, game['deck']['black'])
    const redIdCards = dealOut(temp.reds, game['deck']['red'])
    identityCards = blackIdCards.concat(redIdCards);

    return identityCards;
}

function populateThings (room, num) {
    const teamsTemp = genTeamsTemp(num)
    const idCards = dealIdentity(room['game'], teamsTemp);

    //populate Game obj
    room['game'].idCards = idCards;
    room['game'].teamsTemp = teamsTemp;
    room['game'].rounds = roundArr(num);
    room['game'].currentRound = 0;
    room['game'].order = shuffle(Object.keys(room['players']));
    room['game'].turn = room['game'].order[0];
    room['game'].next = room['game'].order[1];

    const cards = room['game'].idCards;
    const colorArr = buttColors.slice(0, num);

    shuffle(cards);
    shuffle(colorArr);

    //populate Player objs
    for (let player in room['players']) {
        
        //assign teams and id cards
        const card = dealOut(1, cards);
        room['players'][player]['idCard'] = card;
        if (card.includes('s') || card.includes('c')) {
            room['players'][player]['team'] = 'black';
        } else {
            room['players'][player]['team'] = 'red';
        }
        
        //assign button color
        room['players'][player]['color'] = dealOut(1, colorArr);

        //generate and assign div for button and label
        const color = room['players'][player]['color'];
        const name = room['players'][player]['name'];
        const button = 
            `<div>
                <input type="checkbox" class="hideInput checkcheck" id="${name}" name="" value="${name}">
                <label class="btn-circle ${color}" id="${name}Label" for="${name}">${name}</label>
            </div>`
        const label =
            `<div>
                <label class="${color} btn-circle">${name}</label>
            </div>`
        room['players'][player]['button'] = button;
        room['players'][player]['label'] = label;
        
        //populates Game.idsObj, which has each players {name: idCard}
        room['game']['idsObj'][player] = room['players'][player]['idCard'];
    }
}

//accepts number of players in round and game deck, returns array of arrays with one black and one red card for each player
function dealRound (num, deck) {
    const pairArr = [];
    const black = deck.black.slice();
    const red = deck.red.slice();
    for (let i = 0; i < num; i++) {
        const blackCard = dealOut(1, black);
        const redCard = dealOut(1, red);
        const pair = [blackCard, redCard];
        pairArr.push(pair);
    }

    return pairArr;
}

module.exports = {
    populateThings: populateThings,
    dealRound: dealRound,
    shuffle: shuffle
}

