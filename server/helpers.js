const red = ['ah', 'ad', '2h', '2d', '3h', '3d', '4h', '4d', '5h', '5d', '6h', '6d', '7h', '7d', '8h', '8d', '9h', '9d', '10h', '10d', 'jh', 'jd', 'qh', 'qd', 'kh', 'kd'];
const black = ['ac', 'as', '2c', '2s', '3c', '3s', '4c', '4s', '5c', '5s', '6c', '6s', '7c', '7s', '8c', '8s', '9c', '9s', '10c', '10s', 'jc', 'js', 'qc', 'qs', 'kc', 'ks'];
const colors = ['btn-green', 'btn-blue', 'btn-yellow', 'btn-red', 'btn-indigo', 'btn-brown', 'btn-orange', 'btn-violet', 'btn-beige', 'btn-aqua']

function createTeamsTemplate(num) {
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

function createRoundArray(num) {
    const rounds = []
    switch (num) {
        case 5:
            rounds.push(2, 3, 2, 3, 3)
            break;
        case 6:
            rounds.push(2, 3, 4, 3, 4)
            break;
        case 7:
            rounds.push(2, 3, 3, 4, 4)
            break;
        case 8:
        case 9:
        case 10:
            rounds.push(3, 4, 4, 5, 5)
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

//takes a teams template as argument, instantiates/shuffles new game deck, deals out requisite id cards from each deck
function dealIdentity(game, temp) {
    game['deck']['red'] = shuffle(red.slice());
    game['deck']['black'] = shuffle(black.slice());

    const blackIdCards = dealOut(temp.blacks, game['deck']['black'])
    const redIdCards = dealOut(temp.reds, game['deck']['red'])
    const identityCards = blackIdCards.concat(redIdCards);

    return identityCards;
}

function buildGameObjects (room) {
    const numberOfPlayers = room['joins'].length;
    const teamsTemp = createTeamsTemplate(numberOfPlayers)
    const idCards = dealIdentity(room['game'], teamsTemp);
    console.log({idCards});
    //populate Game obj
    room['game'].idCards = idCards;
    room['game'].teamsTemp = teamsTemp;
    room['game'].playersPerRound = createRoundArray(numberOfPlayers);
    room['game'].currentRound = 0;
    room['game'].turn = room['joins'][0];
    // room['game'].next = room['joins'][1];
    room['game'].order = shuffle(room['joins']);

    const cards = shuffle(room['game'].idCards);
    const buttonColors = shuffle(colors.slice(0, numberOfPlayers));

    //populate Player objs
    for (let player of room['joins']) {
        
        //assign teams and id cards
        const card = dealOut(1, cards);
        room['players'][player]['idCard'] = card;
        room['players'][player]['team'] = card.includes('s') || card.includes('c') ? 'black' : 'red';

        //assign button color
        room['players'][player]['color'] = dealOut(1, buttonColors);

        //generate and assign div for button and label
        const color = room['players'][player]['color'];
        const name = room['players'][player]['name']; 
        
        room['players'][player]['button'] = 
            `<div>
                <input type="checkbox" class="hideInput checkcheck" id="${name}" name="" value="${name}">
                <label class="btn-circle ${color}" id="${name}Label" for="${name}">${name}</label>
            </div>`;
        room['players'][player]['label'] = 
            `<div>
                <label class="${color} btn-circle">${name}</label>
            </div>`;

        room['players'][player]['isInCurrentGame'] = true;
    }
}

//accepts number of players in round and game deck, returns array of arrays with one black and one red card for each player
function dealRound (num, deck) {
    const pairArr = [];
    const black = shuffle(deck.black.slice());
    const red = shuffle(deck.red.slice());
    for (let i = 0; i < num; i++) {
        const blackCard = dealOut(1, black);
        const redCard = dealOut(1, red);
        const pair = [blackCard, redCard];
        pairArr.push(pair);
    }

    return pairArr;
}

function isSubmissionPass (card) {
    return black.includes(card);
}

module.exports = {
    buildGameObjects,
    dealRound,
    shuffle,
    isSubmissionPass
}

