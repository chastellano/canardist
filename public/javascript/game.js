import baseUrl from './baseUrl.js'
const socket = io.connect(baseUrl);
import { anim, cards, checkcheck, insertMsg } from './helpers.js';

let shareLink;
let currentPlayers = {};
let handle = '';

$('#join').focus();

$('#join').click(() => {
    socket.emit('knock');
});

$(function() {
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    $("html, body").css({"height":h});
});

$(window).resize(() => {
    if ($(window).height() < $('#consoleBody').outerHeight()) {
        document.documentElement.scrollTop = $('#headerBanner').outerHeight();
        $('#consoleBody').css('height', `${$(window).height()}`);
    } else {
        document.documentElement.scrollTop = 0;
        $('#consoleBody').css('height', '25em');
    }
})


socket.on('available', (bool, duplicate) => {
    console.log(bool)
    if (bool === true) {
        nameModal();
        if (duplicate === true) {
            console.log('DUPLICATE')
            $('#nameWarning').css('display', 'block');
            $('#nameInput').val('');
            $('#nameInput').focus();
        }
    } else {
        $('#roomFull').css('display', 'block');
    }
});

const nameModal = () => {
    $('#nameModal').modal('show');
    $('#nameModal').on('shown.bs.modal', function () {
        $('#nameInput').focus();
    });

    $('#nameInput').on('keyup', e => {
        if (e.keyCode === 13) {
            $('#enlistButt').click()
        }
    });

    $('#enlistButt').on('click', function() {
        console.log($('#nameInput').val())
        if ($('#nameInput').val()) {
            const name = $('#nameInput').val()
            socket.emit('nameCheck', name);    
            return;
        } else {
            console.log('Enter your name');
        }
    });
}

$('#chatInput').on('keyup', e => {
    if (e.keyCode === 13) {
        $('#chatSend').click()
    }
});

$('#chatSend').on('click', () => {
    const msg = $('#chatInput').val();
    if (msg.length) {
        socket.emit('chatSend', handle, msg)
        $('#chatInput').val('');
        $('#chatInput').focus();
    }
});

$('#reload').on('click', () => {
    socket.emit('reload')
})

socket.on('chatRcv', msgArr => {
    const msg = $(`
        <p class="chat"> <span class="bold mr-1">${msgArr[0]}:</span> ${msgArr[1]}<p>
    `)

    insertMsg(msg, 'chatBody');
});

$('#chatDropdownDiv').on('show.bs.dropdown', function(e){
    // console.log('clicked')
    $('#chatDropdown').first().stop(true, true).slideDown();
});
$('#chatDropdownDiv').on('hide.bs.dropdown', function(e){
    if(e.clickEvent) {
        e.preventDefault();
    }
    $('#chatDropdown').first().stop(true, true).slideUp();
});

socket.on('revealStart', () => {
    $('#copyLink').on('click', e => {
        $('#copyButt').removeClass('btn-success');
        $('#copyButt').addClass('btn-primary');
        $('#copyButt').html('Copy URL');
        $('#shareLink').val(window.location.href);
        $('#shareModal').on('shown.bs.modal', () => {
            $('#shareLink').select();
        });
        $('#copyButt').on('click', () => {
            $('#shareLink').select();
            document.execCommand('copy');
            $('#copyButt').addClass('btn-success');
            $('#copyButt').removeClass('btn-primary');
            $('#copyButt').html('Copied!');
        });
        $('#shareModal').modal('show');
    })
    
    // $('body').css('background', '#343a40')
    $('#enlistButt').off('click');
    $('#roomFull').css('display', 'none');
    $('#joinDiv').css('display', 'none');
    $('#nameWarning').css('display', 'none');
    $('#nameModal').modal('hide');
    $('#nameModal').off('click');
    // $('#startGame').css('display', 'block');
    $('#gameBody').fadeIn('slow');
    // $('#playersInput').focus();
    // $('#playerName').html(name);
    $('#chatInput').focus();
});

socket.on('addPlayer', (players, num, name) => {
    handle = name;
    $('#currentPlayers').html('');
    $('#chatBody').html('');

    players.forEach(player => {
        currentPlayers[player] = currentPlayers[player] || {};
        const p = `
            <p id="chat${player}">${player}</p>
        `
        $('#currentPlayers').append(p)
    });

    checkNumPlayers(num);
    console.log(`There are ${num} players in the room`)
});

socket.on('updatePlayer', arr => {
    const name = arr[0];
    const num = arr[1];
    // console.log(`UPDATE NAME: ${name}, UPDATE NUM: ${num}`)
    const p = $(`
        <p id="chat${name}">${name}</p>
    `);
    $('#currentPlayers').append(p.hide().fadeIn('fast'));
    const msg = $(`
        <p class="scrollPush text-center enterLeave">* * * ${name} joined the room * * *</p>
    `);

    insertMsg(msg, 'chatBody');
    checkNumPlayers(num);
    console.log('FIRED');
});

socket.on('rmvPlayer', (left, num) => {
    $('#scoreboardDiv').css('display', 'none');
    $('#outcomeModal').modal('hide');
    delete currentPlayers[left];
    const el = $('#chat'+left);
    el.remove();
    console.log('num!', num)
    checkNumPlayers(num);
    const msg = $(`
        <p class="scrollPush text-center enterLeave">* * * ${left} left the room * * *</p>
    `);
    insertMsg(msg, 'chatBody')
    console.log(`There are ${num} players in the room`);
});

socket.on('breakout', function(num) {
    $('#scoreboardDiv').css('display', 'none');
    $('#revealAll').off('click');
    checkNumPlayers(num);
});

const checkNumPlayers = num => {
    console.log(num + " people in the room")
    let msg, btn;

    switch(true) {

        case num === 0:
            $('#chatBody').html('');
            break;

        case num === 1:
            msg = $(`
                <p class="staticMsg bluePush">You are the first to arrive</p>
            `)
            btn = $(`
                <p class="redPush staticMsg">5-10 players required to start</p>
            `)
            anim(msg, 'staticPush');
            anim(btn, 'buttonDiv');
            break;

        case num > 1 && num < 5:
            msg = $(`
                <p class="staticMsg bluePush">There are ${num} people in the room</p>
            `);
            const n = 5 - num;
            let x;

            n === 1 ? x = 'player' : x = 'players';

            btn = $(`
                <p class="staticMsg redPush">You need ${n} more ${x} to start</p>
            `);
            anim(msg, 'staticPush');
            anim(btn, 'buttonDiv');
            break;

        case num > 4 && num < 11:
            btn = $(`
                <button class="btn btn-success col" id='startGameButt' type='button'>Click Here to Start!</button>
            `)
            msg = $(`
                <p class="bluePush staticMsg">Click start if everyone has arrived</p>
            `)
        
            function startListen () {
                $('#startGameButt').off('click')
                $('#startGameButt').on('click', function () {
                    socket.emit('startGame');
                    console.log(`SENT ${num}!!`)
                    $('#startGameButt').off('click');
                });
            }

            anim(msg, 'staticPush');
            anim(btn, 'buttonDiv', startListen);
            break;
        
        case num > 10:
            msg = $(`
                <p class="staticMsg bluePush">There are ${num} people in the room . . .</p>
            `)
            btn = $(`
                <p class="staticMsg redPush">You have ${num - 10} too many people to start</p>
            `)
            anim(msg, 'staticPush');
            anim(btn, 'buttonDiv');
            break;
        
        default:
            console.log('WTF?')
    }
}

socket.on('idCard', idCard => {
    console.log(idCard);
    $('#playerIdentity').html('');
    const cardEl = $(`
        <img class="img-fluid identity" style="display:inline" src=${cards[idCard]} />
    `);
    $('#playerIdentity').append(cardEl);
    $('#blackNum').html('0');
    $('#redNum').html('0');
    $('#roundNum').html('1');
    $('#scoreboardDiv').fadeIn('slow');
    $('#startGameButt').off('click');
});

socket.on('turn', (current, name) => {
    $('#roundButt').off('click');
    current+=1;
    console.log('name: ', name)
    console.log(current);
    const btn = $(`
        <button id="roundButt" class="btn btn-info col" type="button">Start Round ${current}</button>
    `);
    const msg = $(`
        <p class="bg-success text-white staticMsg">It's your turn, ${name}!</p>
    `);
    
    function roundListen () {
        $('#roundButt').on('click', function() {
            console.log('button press!');
            socket.emit('getButtons');
        });
    }

    anim(msg, 'staticPush');
    anim(btn, 'buttonDiv', roundListen);

});

socket.on('notTurn', turn => {
    const msg = $(`
        <p class="staticMsg bluePush">It is ${turn}'s turn . . .</p>
    `);
    const btn = $(`
        <p class="staticMsg notTurnButt"> . . . </p>
    `);
    anim(btn, 'buttonDiv');
    anim(msg, 'staticPush');
});

socket.on('specialRound', function () {
    const chatMsg = $(`
    <p class="scrollPush text-center bold enterLeave"><span class="text-danger">WARNING: </span>Round 4 will only fail if MORE THAN ONE red card is submitted.</p>
    `)
    insertMsg(chatMsg, 'chatBody')
});

socket.on('propModal', (buttons, round, max) => {
    $('#userButts').empty();
    buttons.forEach(function(button) {
        $('#userButts').append(button);
    });
    $('#proposeModal').modal('show');
    // const current = currentRound + 1;
    
    const proposal = async (round, max) => {
        try {
            const checked = await checkcheck(round, max);
            
            $('#roundButt').off('click');
            const btn = $(`
                <p class="staticMsg notTurnButt"> . . . </p>
            `);
            anim(btn, 'buttonDiv');

            // console.log('sending!');
            $('#proposeModal').modal('hide');
            $('#yourTurn').css('display', 'none');
            socket.emit('sendProposal', checked);
        } catch (error) {
            console.log(error)
        }
    }

    proposal(round, max); 
});

socket.on('voteLabels', (labels, checked, name) => {
    $('#outcomeModal').modal('hide');
    $('#voteSubmit').off('click');
    $('#voteButt').off('click');
    console.log('331: ' + checked);
    const newChecked = checked.map(name => name.toUpperCase()) //.splice(-1, 0, '&'); //capitalizes names, places '&' between last two
    console.log('332: ' + newChecked);
    const chatMsg = $(`
        <p class="scrollPush text-center bold enterLeave">${name} proposes ${newChecked.join(', ')}</p>
    `)
    const msg = $(`
        <p class="staticMsg bg-success text-white" style="position:absolute">Click below to vote!</p>
    `);
    const btn = $(`
        <button id="voteButt" style="position:absolute" class="btn btn-info bold col" type="button">V O T E</button>
    `);
    insertMsg(chatMsg, 'chatBody');
    anim(msg, 'staticPush');
    anim(btn, 'buttonDiv');

    $('#notYourTurn').css('display', 'none');
    $('#yes').prop('checked', false);
    $('#no').prop('checked', false);
    $("#voteWarning").css("display","none");
    $('#proposedPlayers').html('');

    labels.forEach(function(label) {
        $('#proposedPlayers').append(label);
    });

    $('#voteButt').on('click', function() {
        console.log('VOTE CLICK')
        $('#voteModal').modal('show');
        $('#voteEsc').on('click', function () {
            $('#voteModal').modal('hide');
            $('#voteEsc').off('click');
        });      
    });

    $('#voteSubmit').on('click', function() {
        const yea = $("#yes").is(":checked");
        const nay = $("#no").is(":checked");
        if (yea || nay) {
            if (yea) {
                console.log('yea vote!')
                socket.emit('vote', 'yea');
            } else {
                console.log('nay vote!');
                socket.emit('vote', 'nay');
            }
            const msg = $(`
                <p class="staticMsg bluePush">Tallying the votes . . .</p>
            `)
            const btn = $(`
                <p class="staticMsg notTurnButt"> . . . </p>
            `);
            anim(btn, 'buttonDiv');
            anim(msg, 'staticPush');
            $('#voteModal').modal('hide');
            $('#voteSubmit').off('click');
            $('#voteButt').off('click');
        } else {
            $("#voteWarning").css("display","block");
        }
    });
});

socket.on('votePush', (name, vote) => {
    let color;
    if (vote === 'nay') {
        color = 'redVote';
    } else {
        color = 'greenVote';
    }
    const msg = $(`
        <p class="${color} bold text-center scrollPush">${name} votes ${vote}</p>
    `)
    insertMsg(msg, 'chatBody');
});

socket.on('votedUp', player => {
    const chatMsg = $(`
        <p class="text-center scrollPush enterLeave bold">${player}'s proposal was approved!</p>
    `);
    const msg = $(`
        <p class="staticMsg bluePush">Round in progress . . .</p>
    `);
    insertMsg(chatMsg, 'chatBody');
    anim(msg, 'staticPush');
});

socket.on('votedDown', player => {
    const chatMsg = $(`
        <p class="text-center scrollPush enterLeave bold">${player}'s proposal was voted down!</p>
    `)
    insertMsg(chatMsg, 'chatBody');
});

socket.on('roundModal', (roundCards) => {
    $('#executeButt').off('click');
    console.log(roundCards)
    $('#pass').prop('checked', false);
    $('#fail').prop('checked', false);
    const black = roundCards[0];
    const red = roundCards[1]
    $('#blackCard').attr('src', `${cards[black]}`)
    $('#redCard').attr('src', `${cards[red]}`)
    $('#roundModal').modal('show');
    $('#executeButt').on('click', function() {
        console.log('execute pressed')
        if ($('input[name="executeRadio"]:checked').length > 0) {
            const selected = $('input[name="executeRadio"]:checked');
            if (selected.attr('id') === 'pass') {
                console.log('BLACK: ', black)
                socket.emit('roundResolve','pass', black);
            } else if (selected.attr('id') === 'fail') {
                console.log('RED: ', red);
                socket.emit('roundResolve','fail', red);
            } else {
                console.log('Error');
            }
            $('#executeButt').off('click')
            $('#roundModal').modal('hide');
        }
    });
})

socket.on('fail', (outcomeCards, score, currRound) => {
    const nextRound = currRound + 1;
    const scoreEl = $(`<span id="redNum">${score}</span>`);
    $('#redNum').fadeOut('slow', function() {
        $(this).remove();
        $('#redScore').append(scoreEl.hide().fadeIn('slow'))
    });
    showResult(outcomeCards);

    const chatMsg = $(`
            <p class="text-center scrollPush enterLeave bold">ROUND ${currRound} FAILED! Red Team Scores!</p>
    `);
    $('#roundResult').html(`ROUND ${currRound} FAILED!`);
    insertMsg(chatMsg, 'chatBody');
    

    const nextRoundEl = $(`<span id="roundNum">${nextRound}</span>`)
    $('#roundNum').fadeOut('slow', function() {
        $(this).remove();
        $('#currentScore').append(nextRoundEl.hide().fadeIn('slow'))
    });
});

socket.on('pass', (outcomeCards, score, currRound) => {
    const nextRound = currRound + 1;
    const scoreEl = $(`<span id="blackNum">${score}</span>`);
    $('#blackNum').fadeOut('slow', function() {
        $(this).remove()
        $('#blackScore').append(scoreEl.hide().fadeIn('slow'))
    });
    showResult(outcomeCards);

    const chatMsg = $(`
            <p class="text-center scrollPush enterLeave bold">ROUND ${currRound} PASSED! Black Team Scores!</p>
        `);
    insertMsg(chatMsg, 'chatBody');
    $('#roundResult').html(`ROUND ${currRound} PASSED!`);
    
    const nextRoundEl = $(`<span id="roundNum">${nextRound}</span>`)
    $('#roundNum').fadeOut('slow', function() {
        $(this).remove();
        $('#currentScore').append(nextRoundEl.hide().fadeIn('slow'))
    });
});

socket.on('winner', (color, outcomeCards, ids) => {
    const scoreEl = $(`<span id="${color}Num">3</span>`);
    $(`#${color}Num`).fadeOut('slow', function() {
        $(this).remove()
        $(`#${color}Score`).append(scoreEl.hide().fadeIn('slow'))
    });
    showResult(outcomeCards);

    const caps = color.toUpperCase();
    const msg = $(`
        <p class="text-white staticMsg bg-black bold">${caps} TEAM WINS!!!</p>
    `);
    $('#roundResult').html(`${caps} TEAM WINS`);
    anim(msg, 'staticPush');

    getIdentities(ids)
    identityReveal();
    return;
});

//takes identity object as argument, removes client's entry and populates modal that will reveal all player's identities
const getIdentities = obj => {
    console.log('IDOBJ: ', obj)
    $('#playerIdentities').html('');
    delete obj[handle];
    for (let player in obj) {
        const identityDiv = document.createElement('div');
        identityDiv.innerHTML = `
            <p class="text-center text-nowrap">${player}</p>
            <img class="identityCardModal mx-auto" src="cardsJS/cards/${obj[player]}.svg"/>
        `;
        $('#playerIdentities').append(identityDiv);
    }
};


const showResult = arr => {
    $('#submissionCards').html('');

    arr.forEach(function(cardId) {
        const cardImg = `<div><img class="identityCardModal mx-auto" src=${cards[cardId]} /></div>`
        $('#submissionCards').append(cardImg);
    });
    $('#outcomeModal').modal('show')
}

function identityReveal () {
    const btn = $(`
        <button id="revealAll" class="btn btn-success col" type="button">Reveal Identities</button>
    `)
    
    function revealListen () {
        $('#revealAll').off('click');
        $('#revealAll').on('click', function () {
            $('#identityModal').modal('show');
        });
        setTimeout(() => {
            const chatMsg = $(`
                <p class="text-center scrollPush enterLeave bold">CLICK TITLE TO RESET GAME</p>
            `);
            insertMsg(chatMsg, 'chatBody');
        }, 5000);    
    }

    anim(btn, 'buttonDiv', revealListen)
}