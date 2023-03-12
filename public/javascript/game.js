import baseUrl from './baseUrl.js'
const socket = io.connect(baseUrl);
import { anim, cards, checkcheck } from './helpers.js';

$("meta[property='og:url']").attr("content", window.location.href);

let onTour;
let sessionID;
let handle = '';
let lastHeight = $(window).height();
let lastWidth = $(window).width();

$(document).ready(function() {

    socket.on("checkForExistingSession", () => {
        sessionID = window.sessionStorage.getItem('sessionID');
        console.log("SOCKET: ", socket.id, ", EXISTING SESSION: ", sessionID);
        socket.emit('existingSession', sessionID);
    });
    
    socket.on("assignNewSession", sessionID => {
        console.log("new session ID issued: ", sessionID)
        window.sessionStorage.setItem("sessionID", sessionID);
        const newSessionID = window.sessionStorage.getItem('sessionID');
        console.log("new session ID in storage: ", newSessionID);
    });

    socket.on('nameIsUnavailable', () => {
            $('#nameWarning').css('display', 'block');
            $('#nameModal').animate({
                scrollTop: `${$('#nameModal').prop('scrollHeight')}`
            })
            $('#nameInput').val('').focus();
    });
    
    socket.on('exitGame', msg => {
        insertMsg(msg);
        $('#reloadModal').modal('hide');
        $('#scoreboardDiv').css('display', 'none');
        $('#exitButt').off('click');

        const btn = $(`<button class="action btn btn-success col bold" id='joinGameButt' type='button'>JOIN NEW GAME</button>`)
        anim(btn, 'buttonDiv', joinGameButtonListener);
    });
    
    socket.on('offerTour', name => {
        console.log("offerTour")
        handle = name;
        document.documentElement.scrollTop = 0;
    
        displayConsole();
    
        $('#takeTourButt').on('click', tour);
        $('#imGoodButt').on('click', () => {
            socket.emit('requestEntranceToRoom');           
        });

        $('#welcomeModal').on('shown.bs.modal', () => $('#imGoodButt').focus());
        $('#welcomeModal').modal('show');
    })

    socket.on('gameInProgress', (scoreboard, currentRound) => {
        const btn = $(`<p class="action staticMsg notTurnButt">Game is in progess . . .</p>`);
        anim(btn, 'buttonDiv');
        
        $('#playerIdentity').html('');
        showScoreboard(scoreboard.black, scoreboard.red, currentRound);
    });
    
    socket.on('admitPlayerGameInProgress', (players, name, scoreboard, currentRound) => {
        $('#buttonDiv').off('click');
        if (!handle) {
            handle = name;
        }
        $('#scoreboardDiv').css('display', 'none');
        $('#playerIdentity').html('');
    
        const welcomeMsg = `<p class="scrollPush text-center text-white bg-black bold">WELCOME TO THE ROOM!</p>`;
        insertMsg(welcomeMsg);

        const btn = $(`<p class="action staticMsg notTurnButt">Game is in progess . . .</p>`);
        anim(btn, 'buttonDiv');

        
        players.forEach(player => {
            const msg = `<p class="scrollPush text-center enterLeave">* * * ${player.name} joined the room * * *</p>`;
            insertMsg(msg);
        });
        
        populatePlayerDropdown(players);
        showScoreboard(scoreboard.black, scoreboard.red, currentRound);
        displayConsole();
    });

    socket.on('admitPlayerToRoom', (players, name, isGameFull) => {
        $('#buttonDiv').off('click');
        if (!handle) {
            handle = name;
        }
        $('#scoreboardDiv').css('display', 'none');
    
        const welcomeMsg = `<p class="scrollPush text-center text-white bg-black bold">WELCOME TO THE ROOM!</p>`;
        insertMsg(welcomeMsg);

        if (isGameFull) {
            const btn = $(`<p class="action staticMsg redPush">Game is currently full! Maximum 10 players</p>`)
            anim(btn, 'buttonDiv'); 
        }
        else {
            const btn = $(`<button class="action btn btn-success col bold" id='joinGameButt' type='button'>JOIN NEW GAME</button>`)
            anim(btn, 'buttonDiv', joinGameButtonListener);
        }
    
        players.forEach(player => {
            const msg = `<p class="scrollPush text-center enterLeave">* * * ${player.name} joined the room * * *</p>`;
            insertMsg(msg);
        });

        populatePlayerDropdown(players);
        displayConsole();
    });

    socket.on('admitReturningPlayerToRoom', (players, name, chat) => {
        console.log("admitReturningPlayerToRoom")
        $('#buttonDiv').off('click');
        if (!handle) {
            handle = name;
        }
        $('#scoreboardDiv').css('display', 'none');
        $('#chatBody').html('');
        $('#chatBody').append(chat.join(''));
        
        populatePlayerDropdown(players);
        displayConsole();
    });

    socket.on('admitReturningPlayerToGame', (name, room, chat, isPlaying) => {
        console.log("admitReturningPlayerToGame")

        $('#buttonDiv').off('click');
        if (!handle) {
            handle = name;
        }
        $('#scoreboardDiv').css('display', 'none');
        $('#chatBody').html('');
        $('#chatBody').append(chat.join(''));
        $('#chatBody')[0].scrollTop = $('#chatBody')[0].scrollHeight;

        $('html').css('height', '100%');
        $('body').css('height', '100%');
        $('#playerIdentity').html('');

        
        if (isPlaying) {
            const cardEl = $(`<img class="img-fluid identity" style="display:inline" src=${cards[room.players[name]['idCard']]} />`);
            $('#playerIdentity').append(cardEl);
        } 
        else {
            const btn = $(`<p class="action staticMsg notTurnButt">Game is in progess . . .</p>`);
            anim(btn, 'buttonDiv');
        }
        
        showScoreboard(room.game.scoreboard.black, room.game.scoreboard.red, room.game.currentRound + 1);
        populatePlayerDropdown(Object.values(room.players));
        displayConsole();
    }); 
    
    socket.on('aNewPlayerHasEnteredTheRoom', obj => {
        console.log("aNewPlayerHasEnteredTheRoom");
        const p = `<p id="chat${obj.handle}">${obj.handle}</p>`;
        $('#currentPlayers').append(p);

        insertMsg(obj.newPlayerMsg);
    });

    socket.on('playerHasReenteredTheRoom', player => {
        console.log("playerHasReenteredTheRoom")
        $('#chat'+player).remove();
        const p = `<p id="chat${player}">${player}</p>`;
        $('#currentPlayers').append(p);
    });
    
    socket.on('rmvPlayer', player => {
        console.log("rmvPlayer");
        $('#chat'+player).remove();

        const p = `<p id="chat${player}" class="text-muted">${player}</p>`;
        $('#currentPlayers').append(p);
    });

    socket.on('tooManyPlayers', () => {
        const btn = $(`<p class="action staticMsg redPush">Game is currently full! Maximum 10 players</p>`)
        anim(btn, 'buttonDiv'); 
    });

    socket.on('inviteToJoinGame', () => {
        const btn = $(`<button class="action btn btn-success col bold" id='joinGameButt' type='button'>JOIN NEW GAME</button>`)
        anim(btn, 'buttonDiv', joinGameButtonListener);
    })

    socket.on('notifyFirstTurn', () => {
        const btn = $(`<button class="action btn btn-success col bold" id="startGameButt">START GAME</button>`);
        anim(btn, 'buttonDiv', startGameButtListener);

        $('#startModal').modal('hide');
        $('#startOkButt').on('click', () => {
            $('#startModal').modal('hide');
        })
        $('#startModal').on('hidden.bs.modal', () => {
            $('#startOkButt').off('click');
        });
        $('#startModal').modal('show');
    })
    
    socket.on('idCard', (idCard, newGameMsg, redPlayersMsg) => {
        console.log({idCard});
        $('html').css('height', '100%');
        $('body').css('height', '100%');
        $('#playerIdentity').html('');
        const cardEl = $(`<img class="img-fluid identity" style="display:inline" src=${cards[idCard]} />`);
        $('#playerIdentity').append(cardEl);

        $('#joinGameButt').off('click');
        $('#startModal').modal('hide');
        
        showScoreboard(0, 0, 1);
        insertMsg(newGameMsg);
        insertMsg(redPlayersMsg);
    });
    
    socket.on('turn', () => {
        $('#roundButt').off('click');

        const turnBtn = $(`<button id="roundButt" class="action btn btn-success col bold text-center text-nowrap" type="button">IT'S YOUR TURN!</button>`);
        
        function roundListen () {
            $('#roundButt').on('click', function() {
                $('#roundButt').blur();
                socket.emit('getButtons');
            });
        }
        anim(turnBtn, 'buttonDiv', roundListen);
    
    });
    
    socket.on('notTurn', turn => {
        const btn = $(`<p class="action staticMsg notTurnButt">${turn}'s turn . . .</p>`);
        anim(btn, 'buttonDiv');
    });
    
    socket.on('specialRound', msg => {
        insertMsg(msg)
    });
    
    socket.on('propModal', (buttons, round, max) => {
        $('#userButts').empty();
        buttons.forEach(function(button) {
            $('#userButts').append(button);
        });
    
        $('#proposeModal').modal('show');
        
        const proposal = async (round, max) => {
            try {
                const checked = await checkcheck(round, max);
                $('#roundButt').off('click');
                const btn = $(`<p class="action staticMsg notTurnButt"> . . . </p>`);
                anim(btn, 'buttonDiv');
                $('#proposeModal').modal('hide');
                $('#yourTurn').css('display', 'none');
                socket.emit('sendProposal', checked);
            } 
            catch (error) {
                console.log(error)
            }
        }
    
        proposal(round, max); 
    });
    
    socket.on('voteLabels', labels => {
        $('#outcomeModal').off();
        $('#outcomeModal').modal('hide');
        $('#voteSubmit').off('click');
        $('#voteButt').off('click');
        const voteBtn = $(`<button id="voteButt" style="position:absolute" class="action btn btn-success col bold" type="button">CLICK TO VOTE</button>`);

        anim(voteBtn, 'buttonDiv');
    
        $('#yes').prop('checked', false);
        $('#no').prop('checked', false);
        $('#notYourTurn').css('display', 'none');
        $("#voteWarning").css("display","none");
        $('#proposedPlayers').html('');

        $('#proposedPlayers').append(labels.join(''));

        $('#voteButt').on('click', function() {
            $('#voteButt').blur();
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
                yea ? socket.emit('vote', 'yea') : socket.emit('vote', 'nay');
    
                const btn = $(`<p class="action staticMsg notTurnButt">Tallying the votes . . . </p>`);
                anim(btn, 'buttonDiv');
        
                $('#voteModal').modal('hide');
                $('#voteSubmit').off('click');
                $('#voteButt').off('click');
            } else {
                $("#voteWarning").css("display","block");
                $('#voteModal').animate({
                    scrollTop: `${$('#voteModal').prop('scrollHeight')}`
                });
            }
        });
    });

    socket.on('waitingOnVotes', () => {
        const btn = $(`<p class="action staticMsg notTurnButt">Tallying the votes . . . </p>`);
        anim(btn, 'buttonDiv');
    });
    
    socket.on('votePush', voteMsg => {
        insertMsg(voteMsg);
    });
    
    socket.on('votedUp', proposalApprovedMsg => {    
        const btn = $(`<p class="action staticMsg notTurnButt">Waiting for submissions . . . </p>`);
        insertMsg(proposalApprovedMsg);
        anim(btn, 'buttonDiv');
    });
    
    socket.on('votedDown', proposalRejectedMsg => {
        insertMsg(proposalRejectedMsg);
    });
    
    socket.on('roundModal', (roundCards) => {
        console.log({roundCards});
        $('#executeWarning').css('display', 'none');
        $('#executeButt').off('click');
        $('#pass').prop('checked', false);
        $('#fail').prop('checked', false);
        $('#blackCard').attr('src', `${cards[roundCards[0]]}`)
        $('#redCard').attr('src', `${cards[roundCards[1]]}`)
        $('#roundModal').modal('show');
        $('#executeButt').on('click', function() {
            if ($('input[name="executeRadio"]:checked').length > 0) {
                const selected = $('input[name="executeRadio"]:checked');
                if (selected.attr('id') === 'pass') {
                    socket.emit('roundResolve', roundCards[0]);
                } else if (selected.attr('id') === 'fail') {
                    socket.emit('roundResolve', roundCards[1]);
                } else {
                    console.log('Error');
                }
                $('#executeButt').off('click')
                $('#roundModal').modal('hide');
            } else {
                $('#executeWarning').css('display', 'block');
                $('#roundModal').animate({
                    scrollTop: `${$('#roundModal').prop('scrollHeight')}`
                })
            }
        });
    })
    
    socket.on('fail', (outcomeCards, score, currentRound, msg) => {
        const btn = $(`<p class="action staticMsg notTurnButt"> . . . </p>`);
        anim(btn, 'buttonDiv');
        const scoreEl = $(`<span id="redNum">${score}</span>`);
        $('#redNum').fadeOut('slow', function() {
            $(this).remove();
            $('#redScore').append(scoreEl.hide().fadeIn('slow'))
        });
        const title = $(`<h5 class="modal-title bold text-danger" id="roundResult">RED TEAM SCORES!</h5>`)
        $('#roundResult').replaceWith(title);
    
        showResult(outcomeCards, 'submissionCards');
        $('#outcomeModal').on('hidden.bs.modal', () => {
            socket.emit('cueNextTurn');
        });
    
        insertMsg(msg);
        
        const nextRoundEl = $(`<span id="roundNum">${currentRound + 1}</span>`)
        $('#roundNum').fadeOut('slow', function() {
            $(this).remove();
            $('#currentScore').append(nextRoundEl.hide().fadeIn('slow'))
        });
    });
    
    socket.on('pass', (outcomeCards, score, currentRound, msg) => {
        const btn = $(`<p class="action staticMsg notTurnButt"> . . . </p>`);
        anim(btn, 'buttonDiv');
        const scoreEl = $(`<span id="blackNum">${score}</span>`);
        $('#blackNum').fadeOut('slow', function() {
            $(this).remove()
            $('#blackScore').append(scoreEl.hide().fadeIn('slow'))
        });
    
        const title = $(`<h5 class="modal-title bold" id="roundResult">BLACK TEAM SCORES!</h5>`)
        $('#roundResult').replaceWith(title);
    
        showResult(outcomeCards, 'submissionCards');
        $('#outcomeModal').on('hidden.bs.modal', () => {
            socket.emit('cueNextTurn');
        });
    
        insertMsg(msg);
        
        const nextRoundEl = $(`<span id="roundNum">${currentRound + 1}</span>`)
        $('#roundNum').fadeOut('slow', function() {
            $(this).remove();
            $('#currentScore').append(nextRoundEl.hide().fadeIn('slow'))
        });
    });
    
    socket.on('winner', (color, outcomeCards, ids, msg) => {dfgdfg
        btn = $(`<button class="action btn btn-success col bold" id='joinGameButt' type='button'>JOIN NEW GAME</button>`)
        anim(btn, 'buttonDiv', joinGameButtonListener);

        const scoreEl = $(`<span id="${color}Num">3</span>`);
        $(`#${color}Num`).fadeOut('slow', function() {
            $(this).remove()
            $(`#${color}Score`).append(scoreEl.hide().fadeIn('slow'))
        });
    
        const winnerColor = color === 'black' ? 'text-black' : 'text-danger';
    
        const title = $(`<h5 class="modal-title bold ${winnerColor}" id="winnerTitle">${color.toUpperCase()} TEAM WINS!</h5>`)
        $('#winnerTitle').replaceWith(title);
    
        insertMsg(msg);
        showResult(outcomeCards, 'winnerCards');
        identityReveal(ids);
    });

    const displayConsole = () => {
        $('#enlistButt').off('click');
        $('#roomFull').css('display', 'none');
        $('#joinDiv').css('display', 'none');
        $('#nameWarning').css('display', 'none');
        $('#nameModal').modal('hide');
        $('#nameModal').off('click');
        $('#gameBody').fadeIn('slow', () => {
            if ($(window).width() < 576) {
                $('body').addClass('bg-dark');
            }
            if ($('#consoleDiv').prop('scrollHeight') > $(window).height()) {
                $('#consoleDiv').css('border-bottom-left-radius', '0');
                $('#consoleDiv').css('border-bottom-right-radius', '0');
            }
        });
        $('#chatBody')[0].scrollTop = $('#chatBody')[0].scrollHeight;
        $('#chatInput').focus();
    }

    const tour = () => {
        onTour = true;
        $('[data-toggle="tooltip"]').tooltip();
        $('#welcomeModal').modal('hide');
    
        const nextBtn = $(`<button id="tourButt" class="action btn btn-primary col bold" type="button">N E X T</button>`);
        const ellipsisBtn = $(`<p class="action staticMsg notTurnButt"> . . . </p>`);
        const clickBtn = $(`<button id="tourButt" class="action btn btn-success col bold" type="button">CLICK ME</button>`);
        const finishBtn = $(`<button id="tourButt" class="action btn btn-success col bold" type="button">FINISH TOUR</button>`);
    
        let count = 1;
    
        const tourStop = x => {
            switch (x) {
    
                case 2:
                    $('#chatDropdownDiv').tooltip('hide');
                    $('#chatDropdownDiv').on('hidden.bs.tooltip', () => {
                        $('#reload').tooltip('show');
                        $('#chatDropdownDiv').off('hidden.bs.tooltip');
                    });
                    setTimeout(() => {
                        tourButtListen();
                    }, 1500);
                    break;
    
                case 3:
                    $('#chatDropdownDiv').tooltip('hide');
                    $('#reload').on('hidden.bs.tooltip', () => {
                        $('#shareLinkDiv').tooltip('show');
                        $('#reload').off('hidden.bs.tooltip');
                    });
                    $('#reload').tooltip('hide');
                    setTimeout(() => {
                        tourButtListen();
                    }, 1500);
                    break;
    
                case 4:
                    anim(ellipsisBtn, 'buttonDiv');
    
                    const chatMsg1 = `<p class="scrollPush text-center text-white bg-black">You can talk to the room using the CHAT</p>`;
                    const chatMsg2 = `<p class="chat" style="margin-top: .3em"> <span class="bold mr-1">${handle}:</span> Hello room!<p>`;
                    const chatMsg3 = `<p class="scrollPush text-center text-white bg-black">Notifications will also appear here</p>`;
                    
                    $('#chatDropdownDiv').tooltip('hide');
                    $('#reload').tooltip('hide');
                    $('#shareLinkDiv').tooltip('hide');
                    $('#shareLinkDiv').on('hidden.bs.tooltip', () => {
                        setTimeout(() => {
                            insertMsg(chatMsg1);
                        }, 500);
                        setTimeout(() => {
                            insertMsg(chatMsg2);
                        }, 2000);
                        setTimeout(() => {
                            insertMsg(chatMsg3);
                            anim(nextBtn, 'buttonDiv', tourButtListen);
                        }, 4000);
                    });
                    break;
    
                case 5:
                    $('#shareLinkDiv').off('hidden.bs.tooltip')
                    $('#buttonDiv').tooltip('show');
                    $('#buttonDiv').on('shown.bs.tooltip', () => {
                        anim(clickBtn, 'buttonDiv');
                        $('#buttonDiv').off('shown.bs.tooltip')
                    })
                    setTimeout(() => {
                        tourButtListen();
                    }, 2500)
                    break;
    
                case 6:
                    $('#buttonDiv').tooltip('hide');
                    $('#buttonDiv').on('hidden.bs.tooltip', () => {
                        $('html').css('height', '100%');
                        $('body').css('height', '100%');
                        $('#scoreboardDiv').fadeIn('slow', () => {
                            $('#consoleDiv').animate({
                                scrollTop: `${$('#consoleDiv').prop('scrollHeight')}`
                            })
                            $('#scoreboard').tooltip('show');
                            anim(nextBtn, 'buttonDiv');
                            $('#buttonDiv').off('hidden.bs.tooltip');
                        });
                    })
                    setTimeout(() => {
                        tourButtListen();
                    }, 2500);
                    break;
    
                case 7:
                    $('#scoreboard').tooltip('hide');
                    $('#scoreboard').on('hidden.bs.tooltip', () => {
                        $('#idCard').tooltip('show');
                        $('#scoreboard').off('hidden.bs.tooltip');
                    });
    
                    $('#idCard').on('show.bs.tooltip', () => {
                        anim(finishBtn, 'buttonDiv')
                        $('#idCard').off('show.bs.tooltip');
                    })
    
                    setTimeout(() => {
                        tourButtListen();
                    }, 2500);
                
                    break;
    
                case 8:
                    socket.emit('requestEntranceToRoom');
                    onTour = false
                    $('[data-toggle="tooltip"]').tooltip('hide');
                    $('[data-toggle="tooltip"]').tooltip('disable');
                    // $('#chatBody').html('');
                    $('#chatInp').off('click');
                    break;
    
                default:
                    socket.emit('requestEntranceToRoom');
                    onTour = false
                    $('[data-toggle="tooltip"]').tooltip('hide');
                    $('[data-toggle="tooltip"]').tooltip('disable');
                    $('#chatInp').off('click');
                    // $('#chatBody').html('');
                    break;
            }
        }
    
        const tourButtListen = () => {
            $('#tourButt').on('click', () => {
                count += 1;
                tourStop(count);
                $('#tourButt').off('click');
            })
        }
    
        setTimeout(() => {
            $('#chatDropdownDiv').tooltip('show');
            $('#chatDropdownDiv').on('shown.bs.tooltip', () => {
                anim(nextBtn, 'buttonDiv', tourButtListen);
                $('#chatDropdownDiv').off('shown.bs.tooltip');
            })
        }, 1000);
    }

    const updateTotalNumberOfPlayers = numberOfPlayers => {
        $('#scoreboardDiv').fadeOut('slow');
        $('.modal').modal('hide');
        let btn;
    
        switch(true) {
    
            case numberOfPlayers === 0:
                // $('#chatBody').html('');
                break;
    
            case numberOfPlayers === 1:
                btn = $(`<p class="action redPush staticMsg">4 more players needed to play</p>`)
                anim(btn, 'buttonDiv');
                break;
    
            case numberOfPlayers > 1 && numberOfPlayers < 5:
                const n = 5 - numberOfPlayers;
                let x;
                n === 1 ? x = 'player' : x = 'players';
                btn = $(`<p class="action staticMsg redPush">${n} more ${x} needed to start</p>`);
                anim(btn, 'buttonDiv');
                break;
    
            case numberOfPlayers > 4 && numberOfPlayers < 11:
                btn = $(`<button class="action btn btn-success col bold" id='joinGameButt' type='button'>JOIN NEW GAME</button>`)
                anim(btn, 'buttonDiv', joinGameButtonListener);
                break;
            
            case numberOfPlayers > 10:
                btn = $(`<p class="action staticMsg redPush">There are ${numberOfPlayers - 10} too many players to start</p>`)
                anim(btn, 'buttonDiv');
                break;
            
            default:
                return;
        }
    }

    const insertMsg = msg => {
        const newMsg = $(msg);
        const check = ($('#chatBody')[0].scrollHeight - ($('#chatBody')[0].scrollTop + $('#chatBody')[0].offsetHeight) <= 2);

        if ($('#chatBody').children().last().hasClass('scrollPush') && !msg.includes('scrollPush')) {
            $('#chatBody').children().last().addClass("mb-2");
        }
    
        $('#chatBody').append(newMsg.hide().fadeIn('slow'));

        if(check) {
            $('#chatBody')[0].scrollTop = $('#chatBody')[0].scrollHeight;
        }
    }

    socket.on('chatRcv', message => {       
        insertMsg(message);
    });

    socket.on('morePlayersNeeded', num => {
        $('#startModal').modal('hide');
        const playerOrPlayers = num === 1 ? 'player' : 'players';
        const btn = $(`<p id="unjoin" class="staticMsg notTurnButt">${num} more ${playerOrPlayers} needed to start . . .</p>`);
        anim(btn, 'buttonDiv', unjoinGameButtonListener);
    });

    socket.on('waitingForFirstPlayerToStart', player => {
        const btn = $(`<p id="unjoin" class="staticMsg notTurnButt">Waiting for ${player} to start . . .</p>`);
        anim(btn, 'buttonDiv', unjoinGameButtonListener);
    })

    const showScoreboard = (black, red, currentRound) => {
        const btn = $(`<p class="action staticMsg notTurnButt">Game is in progess . . .</p>`);
        anim(btn, 'buttonDiv');

        $('#blackNum').html(black);
        $('#redNum').html(red);
        $('#roundNum').html(currentRound);
        $('#scoreboardDiv').fadeIn('slow');
    }

    const populatePlayerDropdown = players => {
        $('#currentPlayers').html('');
        players.forEach(player => {
            let dropdownItem;
            if (player.connected) {
                dropdownItem = `<p id="chat${player.name}">${player.name}</p>`
            } else {
                dropdownItem = `<p id="chat${player.name}" class="text-muted">${player.name}</p>`
            }
            $('#currentPlayers').append(dropdownItem);
        });
    }
    
    const joinGameButtonListener = () => {
        $('#scoreboardDiv').css('display', 'none');
        $('#joinGameButt').off('click')
        $('#joinGameButt').on('click', () => {
            socket.emit('joinGame');
        });
    }

    const unjoinGameButtonListener = () => {
        $('#unjoin').off('click')
        $('#unjoin').on('click', () => {
            socket.emit('unjoinGame');
            const btn = $(`<button class="action btn btn-success col bold" id='joinGameButt' type='button'>JOIN NEW GAME</button>`)
            anim(btn, 'buttonDiv', joinGameButtonListener);
        });
    }

    const startGameButtListener = () => {
        $('#startGameButt').off('click')
        $('#startGameButt').on('click', () => {
            socket.emit('startGame');
        });
    }

    $('#reload').on('click', () => {
        reloadModal();
    })
    
    const reloadModal = () => {
        $('#okButt').on('click', () => {
            socket.emit('reload');
            $('#reloadModal').modal('hide');
        })
        
        $('#cancelButt').on('click', () => {
            $('#reloadModal').modal('hide');
        })
        
        $('#reloadModal').on('hidden.bs.modal', () => {
            $('#okButt').off('click');
            $('#cancelButt').off('click');
        });
        
        $('#reloadModal').modal('show');
    }
    
    //takes array of cards and element id, populates element id with images of cards from array, reveals appropriate modal
    const showResult = (arr, id) => {
        $(`#${id}`).html('');
        arr.forEach(cardId => {
            const cardImg = `<div><img class="identityCardModal mx-auto" src=${cards[cardId]} /></div>`;
            $(`#${id}`).append(cardImg);
        });
        
        id === "submissionCards" ? $('#outcomeModal').modal('show') : $('#winnerModal').modal('show');
    }
    
    //takes object containing all player names and identity cards, removes client's entry, populates identity modal with all player's identities
    const getIdentities = obj => {
        $('#playerIdentities').html('');
        delete obj[handle];
        for (let player in obj) {
            const identityDiv = document.createElement('div');
            identityDiv.innerHTML = `
                <p class="text-center text-nowrap">${player}</p>
                <img class="identityCardModal mx-auto" src=${cards[obj[player]]} />
            `;
            $('#playerIdentities').append(identityDiv);
        }
    };
    
    const identityReveal = async (obj) => {
        await getIdentities(obj)
        $('#revealButt').off('click');
        $('#revealButt').on('click', function () {
            $('#winnerModal').on('hidden.bs.modal', () => {
                $('#identityModal').modal('show');
                $('#winnerModal').off();

            });
            $('#winnerModal').modal('hide');
        });
    
        $('#identityModal').on('hidden.bs.modal', () => {
            function exitListen () {
                $('#exitButt').on('click', () => {
                    $('#scoreboardDiv').css('display', 'none');
                    socket.emit('exitGame');
                    $('#identityModal').off();
                })
            }
            const btn = $(`<button class="action btn btn-success col bold" id="exitButt" type="button">EXIT GAME</button>`)
            anim(btn, 'buttonDiv', exitListen)   
        })   
    }

    $('#join').focus().click(() =>{ //socket.emit('checkRoomIsJoinable'));
        $('#nameModal').modal('show');
        $('#nameModal').on('shown.bs.modal', () => $('#nameInput').focus());
    });

    $('#enlistButt').on('click', () => {
        const name = $('#nameInput').val().trim();
        const re = /\S/g
        const containsNonWhiteSpaceCharacters = re.exec(name);
        if (name && containsNonWhiteSpaceCharacters) {
            socket.emit('checkNameIsAvailable', name);
        }
    });

    $('#nameInput').on('keyup', e => {
        if (e.keyCode === 13) { 
            $('#enlistButt').click() 
        }
    });

    $(window).resize(() => {
        if ($(window).width() < 576 && $('#gameBody').css('display') !== 'none') {
            $('body').addClass('bg-dark');
        } else {
            $('body').removeClass('bg-dark');
        }

        if ($('#consoleDiv').prop('scrollHeight') > $(window).height()) {
            $('#consoleDiv').css('border-bottom-left-radius', '0');
            $('#consoleDiv').css('border-bottom-right-radius', '0');
        } else {
            $('#consoleDiv').css('border-bottom-left-radius', '1%');
            $('#consoleDiv').css('border-bottom-right-radius', '1%');
        }

        const currHeight = $(window).height();
        const currWidth =  $(window).width();
    
        if (currHeight < $('#consoleBody').outerHeight() +  $('#headerBanner').outerHeight() && currWidth === lastWidth) { //virtual keyboard show
            $('html').css('height', 'auto');
            $('body').css('height', 'auto');
            $('#consoleBody').css('height', `${$(window).height()}`);
            document.documentElement.scrollTop = $('#headerBanner').offset().top + $('#headerBanner').outerHeight();
        }
    
        if (currHeight > lastHeight && currWidth === lastWidth) { //virtual keyboard hide
            $('html').css('height', '100%');
            $('body').css('height', '100%');
            $('#consoleBody').css('height', '55%');
            $('#consoleBody').css('height', `${$('#consoleBody').height()}`);
            document.documentElement.scrollTop = 0;
        }
    
        if (currHeight != lastHeight && currWidth != lastWidth) { //screen orientation change
            $('html').css('height', '100%');
            $('body').css('height', '100%');
            $('#consoleBody').css('height', '55%');
            $('#consoleBody').css('height', `${$('#consoleBody').height()}`);
            document.documentElement.scrollTop = 0;
        }

        $('#chatBody')[0].scrollTop = $('#chatBody')[0].scrollHeight; //scroll to end of chat window
    
        lastHeight = $(window).height();
        lastWidth = $(window).width();
    });

    $('#chatDropdownDiv').on('show.bs.dropdown', function(e){
        $('#chatDropdown').first().stop(true, true).slideDown();
    });
    
    $('#chatDropdownDiv').on('hide.bs.dropdown', function(e){
        if(e.clickEvent) {
            e.preventDefault();
        }
        $('#chatDropdown').first().stop(true, true).slideUp();
    });
    
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

    $('#chatInput').on('keyup', e => {
        if (e.keyCode === 13) {
            $('#chatSend').click()
        }
    });
    
    $('#chatSend').on('click', () => {
        const msg = $('#chatInput').val();
        if (msg.length) {
            socket.emit('chatSend', msg, onTour)
            $('#chatInput').val('');
            $('#chatInput').focus();
        }
    });
});