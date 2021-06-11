import baseUrl from './baseUrl.js'
const socket = io.connect(baseUrl);
import { anim, cards, checkcheck, insertMsg } from './helpers.js';

let onTour;
let currentPlayers = {};
let handle = '';
let exited = true;
let lastHeight = $(window).height();
let lastWidth = $(window).width();

$(document).ready(function() {
    
    $('#join').focus();
    
    $('#join').click(() => {
        socket.emit('knock');
    });
    
    // $(function() {
    //     const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    //     $("html, body").css({"height":h});
    // });
    
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
            // console.log('SCROLLTOP: ' + document.documentElement.scrollTop)
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
    
    })
    
    
    socket.on('available', (bool, duplicate) => {
        if (bool === true) {
            nameModal();
            if (duplicate === true) {
                // console.log('DUPLICATE')
                $('#nameWarning').css('display', 'block');
                $('#nameModal').animate({
                    scrollTop: `${$('#nameModal').prop('scrollHeight')}`
                })
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
            const re = /\S/g
            const nonWhiteSpaceCheck = re.exec($('#nameInput').val());
            if ($('#nameInput').val() && nonWhiteSpaceCheck) {
                const name = $('#nameInput').val()
                socket.emit('nameCheck', name);    
                return;
            } else {
                // console.log('Enter your name');
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
            socket.emit('chatSend', msg, onTour)
            $('#chatInput').val('');
            $('#chatInput').focus();
        }
    });
    
    socket.on('chatRcv', msgArr => {
        let msg;
        
        if ($('#chatBody').children().last().hasClass('scrollPush')) {
            // console.log('true')
            msg = $(`
                <p class="chat" style="margin-top: .3em"> <span class="bold mr-1">${msgArr[0]}:</span> ${msgArr[1]}<p>
            `) 
        } else {
            msg = $(`
                <p class="chat"> <span class="bold mr-1">${msgArr[0]}:</span> ${msgArr[1]}<p>
            `)
        }
        
        insertMsg(msg, 'chatBody');
    });
    
    $('#reload').on('click', () => {
        if (onTour) {
            reloadModal();
        } else {
            socket.emit('checkReload');
        }
    })
    
    socket.on('showReloadModal', () => {
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
    
    socket.on('breakout', (num, handle) => {
        const chatMsg = $(`
            <p class="scrollPush text-center bold enterLeave">${handle} exited the game</p>
        `)
        insertMsg(chatMsg, 'chatBody');
        $('#reloadModal').modal('hide');
        $('#scoreboardDiv').css('display', 'none');
        $('#exitButt').off('click');
        checkNumPlayers(num);
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
    
    socket.on('tour', name => {
        handle = name;
        document.documentElement.scrollTop = 0;
    
        const p = `
            <p id="chat${name}">${name}</p>
        `
    
        $('#currentPlayers').append(p)
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
    
        $('#takeTourButt').on('click', tour);
        $('#imGoodButt').on('click', () => {
            socket.emit('letMeIn');
        })
        $('#welcomeModal').modal('show');
    })
    
    const tour = () => {
        onTour = true;
        $('#chatInp').on('click', (e) => {
            e.preventDefault();
        })
        $('[data-toggle="tooltip"]').tooltip();
        $('#welcomeModal').modal('hide');
    
        const nextBtn = $(`
            <button id="tourButt" class="action btn btn-primary col bold" type="button">N E X T</button>
        `);
        const ellipsisBtn = $(`
            <p class="action staticMsg notTurnButt"> . . . </p>
        `);
        const clickBtn = $(`
            <button id="tourButt" class="action btn btn-success col bold" type="button">CLICK ME</button>
        `);
        const finishBtn = $(`
            <button id="tourButt" class="action btn btn-success col bold" type="button">FINISH TOUR</button>
        `);
    
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
    
                    const chatMsg1 = $(`
                        <p class="scrollPush text-center text-white bg-black">You can talk to the room using the CHAT</p>
                    `)
                    const chatMsg2 = $(`
                        <p class="chat" style="margin-top: .3em"> <span class="bold mr-1">${handle}:</span> Hello room!<p>
                    `)
                    const chatMsg3 = $(`
                        <p class="scrollPush text-center text-white bg-black">Notifications will also appear here</p>
                    `)
                    
                    $('#chatDropdownDiv').tooltip('hide');
                    $('#reload').tooltip('hide');
                    $('#shareLinkDiv').tooltip('hide');
                    $('#shareLinkDiv').on('hidden.bs.tooltip', () => {
                        setTimeout(() => {
                            insertMsg(chatMsg1, 'chatBody');
                        }, 500);
                        setTimeout(() => {
                            insertMsg(chatMsg2, 'chatBody');
                        }, 2000);
                        setTimeout(() => {
                            insertMsg(chatMsg3, 'chatBody');
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
                    socket.emit('letMeIn');
                    onTour = false
                    $('[data-toggle="tooltip"]').tooltip('hide');
                    $('[data-toggle="tooltip"]').tooltip('disable');
                    $('#chatBody').html('');
                    $('#chatInp').off('click');
                    break;
    
                default:
                    socket.emit('letMeIn');
                    onTour = false
                    $('[data-toggle="tooltip"]').tooltip('hide');
                    $('[data-toggle="tooltip"]').tooltip('disable');
                    $('#chatInp').off('click');
                    $('#chatBody').html('');
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
    
    socket.on('addPlayer', (players, num, name) => {
        $('#chatInput').focus();
        $('#buttonDiv').off('click');
        if (!handle) {
            handle = name;
        }
        $('#scoreboardDiv').css('display', 'none');
        $('#currentPlayers').html('');
        $('#chatBody').html('');
    
        const welcomeMsg = $(`
            <p class="scrollPush text-center text-white bg-black bold">WELCOME TO THE ROOM!</p>
        `);
        insertMsg(welcomeMsg, 'chatBody');
    
        players.forEach(player => {
            currentPlayers[player] = currentPlayers[player] || {};
            const p = `
                <p id="chat${player}">${player}</p>
            `
            $('#currentPlayers').append(p)
            const msg = $(`
                <p class="scrollPush text-center enterLeave">* * * ${player} joined the room * * *</p>
            `);
            insertMsg(msg, 'chatBody');
        });
    
        checkNumPlayers(num);
        // console.log(`There are ${num} players in the room`)
    });
    
    socket.on('updatePlayer', arr => {
        const name = arr[0];
        const num = arr[1];
        const p = $(`
            <p id="chat${name}">${name}</p>
        `);
        $('#currentPlayers').append(p.hide().fadeIn('fast'));
        const msg = $(`
            <p class="scrollPush text-center enterLeave">* * * ${name} joined the room * * *</p>
        `);
    
        insertMsg(msg, 'chatBody');
        if (exited) {
            checkNumPlayers(num);
        }
    });
    
    socket.on('rmvPlayer', (left, num) => {
        $('#scoreboardDiv').fadeOut('slow');
        $('.modal').modal('hide');
        delete currentPlayers[left];
        const el = $('#chat'+left);
        el.remove();
        // console.log('num!', num)
        checkNumPlayers(num);
        if (left === null) {
            return;
        }
        const msg = $(`
            <p class="scrollPush text-center enterLeave">* * * ${left} left the room * * *</p>
        `);
        insertMsg(msg, 'chatBody')
        // console.log(`There are ${num} players in the room`);
    });
    
    const checkNumPlayers = num => {
        // console.log(num + " people in the room")
        $('#scoreboardDiv').fadeOut('slow');
        $('.modal').modal('hide');
        let msg, btn;
    
        switch(true) {
    
            case num === 0:
                $('#chatBody').html('');
                break;
    
            case num === 1:
                btn = $(`
                    <p class="action redPush staticMsg">4 more players needed to play</p>
                `)
                anim(btn, 'buttonDiv');
                break;
    
            case num > 1 && num < 5:
                const n = 5 - num;
                let x;
                n === 1 ? x = 'player' : x = 'players';
                btn = $(`
                    <p class="action staticMsg redPush">${n} more ${x} needed to start</p>
                `);
                anim(btn, 'buttonDiv');
                break;
    
            case num > 4 && num < 11:
                btn = $(`
                    <button class="action btn btn-success col bold" id='startGameButt' type='button'>JOIN NEW GAME</button>
                `)
            
                function startListen () {
                    $('#startGameButt').off('click')
                    $('#startGameButt').on('click', function () {
                        $('#readyButt').on('click', () => {
                            socket.emit('startGame');
                            $('#startModal').modal('hide');
                            const btn = $(`
                                <p class="staticMsg notTurnButt">Waiting for all players to join . . . </p>
                            `);
                            anim(btn, 'buttonDiv');
                        })
                        $('#notYetButt').on('click', () => {
                            $('#startModal').modal('hide');
                        })
                        $('#startModal').on('hidden.bs.modal', () => {
                            $('#readyButt').off('click');
                            $('#notYetButt').off('click');
                        });
                        $('#startModal').modal('show');
                    });
                }
                
                anim(btn, 'buttonDiv', startListen);
                break;
            
            case num > 10:
                btn = $(`
                    <p class="action staticMsg redPush">There are ${num - 10} too many players to start</p>
                `)
                anim(btn, 'buttonDiv');
                break;
            
            default:
                // console.log('HUH?')
                return;
        }
    }
    
    socket.on('idCard', (idCard, reds) => {
        $('html').css('height', '100%');
        $('body').css('height', '100%');
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
        $('#startModal').modal('hide');
    
        const chatMsg1 = $(`
            <p class="text-center text-white scrollPush bg-primary bold">NEW GAME</p>
        `);
    
        const chatMsg2 = $(`
            <p class="text-center text-white scrollPush bg-danger bold">THERE ARE ${reds} RED PLAYERS. WHO COULD THEY BE?</p>
        `)
    
        insertMsg(chatMsg1, 'chatBody');
        insertMsg(chatMsg2, 'chatBody');
    });
    
    socket.on('turn', (current, name) => {
        $('#roundButt').off('click');
        current+=1;
        // console.log('name: ', name)
        // console.log(current);
    
        const turnBtn = $(`
            <button id="roundButt" class="action btn btn-success col bold text-center text-nowrap" type="button">IT'S YOUR TURN!</button>
        `);
        
        function roundListen () {
            $('#roundButt').on('click', function() {
                $('#roundButt').blur();
                socket.emit('getButtons');
            });
        }
        anim(turnBtn, 'buttonDiv', roundListen);
    
    });
    
    socket.on('notTurn', turn => {
        const btn = $(`
            <p class="action staticMsg notTurnButt">${turn}'s turn . . .</p>
        `);
        anim(btn, 'buttonDiv');
    });
    
    socket.on('specialRound', function () {
        const chatMsg = $(`
            <p class="scrollPush text-center bold enterLeave"><span class="text-danger">WARNING: </span>Red Team needs MORE THAN ONE red card to win Round 4.</p>
        `)
        insertMsg(chatMsg, 'chatBody')
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
                const btn = $(`
                    <p class="action staticMsg notTurnButt"> . . . </p>
                `);
                anim(btn, 'buttonDiv');
                $('#proposeModal').modal('hide');
                $('#yourTurn').css('display', 'none');
                socket.emit('sendProposal', checked);
            } catch (error) {
                // console.log(error)
            }
        }
    
        proposal(round, max); 
    });
    
    socket.on('voteLabels', (labels, checked, name) => {
        $('#outcomeModal').off();
        $('#outcomeModal').modal('hide');
        $('#voteSubmit').off('click');
        $('#voteButt').off('click');
        // console.log('331: ' + checked);
        const newChecked = checked.map(name => name.toUpperCase()) //.splice(-1, 0, '&'); //capitalizes names, places '&' between last two
        // console.log('332: ' + newChecked);
    
        const chatMsg = $(`
            <p class="scrollPush text-center bold enterLeave">${name} proposes ${newChecked.join(', ')}</p>
        `)
        const voteBtn = $(`
            <button id="voteButt" style="position:absolute" class="action btn btn-success col bold" type="button">CLICK TO VOTE</button>
        `);
    
        insertMsg(chatMsg, 'chatBody');
        anim(voteBtn, 'buttonDiv');
    
        $('#notYourTurn').css('display', 'none');
        $('#yes').prop('checked', false);
        $('#no').prop('checked', false);
        $("#voteWarning").css("display","none");
        $('#proposedPlayers').html('');
    
        labels.forEach(function(label) {
            $('#proposedPlayers').append(label);
        });
    
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
                if (yea) {
                    // console.log('yea vote!')
                    socket.emit('vote', 'yea');
                } else {
                    // console.log('nay vote!');
                    socket.emit('vote', 'nay');
                }
    
                const btn = $(`
                    <p class="action staticMsg notTurnButt">Tallying the votes . . . </p>
                `);
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
    
        const btn = $(`
            <p class="action staticMsg notTurnButt">Waiting for submissions . . . </p>
        `);
    
        insertMsg(chatMsg, 'chatBody');
        anim(btn, 'buttonDiv');
    });
    
    socket.on('votedDown', player => {
        const chatMsg = $(`
            <p class="text-center scrollPush enterLeave bold">${player}'s proposal was voted down!</p>
        `)
        insertMsg(chatMsg, 'chatBody');
    });
    
    socket.on('roundModal', (roundCards) => {
        $('#executeWarning').css('display', 'none');
        $('#executeButt').off('click');
        // console.log(roundCards)
        $('#pass').prop('checked', false);
        $('#fail').prop('checked', false);
        const black = roundCards[0];
        const red = roundCards[1]
        $('#blackCard').attr('src', `${cards[black]}`)
        $('#redCard').attr('src', `${cards[red]}`)
        $('#roundModal').modal('show');
        $('#executeButt').on('click', function() {
            // console.log('execute pressed')
            if ($('input[name="executeRadio"]:checked').length > 0) {
                const selected = $('input[name="executeRadio"]:checked');
                if (selected.attr('id') === 'pass') {
                    // console.log('BLACK: ', black)
                    socket.emit('roundResolve','pass', black);
                } else if (selected.attr('id') === 'fail') {
                    // console.log('RED: ', red);
                    socket.emit('roundResolve','fail', red);
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
    
    socket.on('fail', (outcomeCards, score, currRound) => {
        const btn = $(`
            <p class="action staticMsg notTurnButt"> . . . </p>
        `);
        anim(btn, 'buttonDiv');
        const nextRound = currRound + 1;
        const scoreEl = $(`<span id="redNum">${score}</span>`);
        $('#redNum').fadeOut('slow', function() {
            $(this).remove();
            $('#redScore').append(scoreEl.hide().fadeIn('slow'))
        });
        const title = $(`
            <h5 class="modal-title bold text-danger" id="roundResult">RED TEAM SCORES!</h5>
        `)
        $('#roundResult').replaceWith(title);
    
        showResult(outcomeCards, 'submissionCards');
        $('#outcomeModal').on('hidden.bs.modal', () => {
            // console.log('hidden!')
            socket.emit('cueNextTurn');
        });
    
        const chatMsg = $(`
                <p class="text-center text-white bg-danger scrollPush bold">RED TEAM WINS ROUND ${currRound}!</p>
        `);
        insertMsg(chatMsg, 'chatBody');
        
        const nextRoundEl = $(`<span id="roundNum">${nextRound}</span>`)
        $('#roundNum').fadeOut('slow', function() {
            $(this).remove();
            $('#currentScore').append(nextRoundEl.hide().fadeIn('slow'))
        });
    });
    
    socket.on('pass', (outcomeCards, score, currRound) => {
        const btn = $(`
            <p class="action staticMsg notTurnButt"> . . . </p>
        `);
        anim(btn, 'buttonDiv');
        const nextRound = currRound + 1;
        const scoreEl = $(`<span id="blackNum">${score}</span>`);
        $('#blackNum').fadeOut('slow', function() {
            $(this).remove()
            $('#blackScore').append(scoreEl.hide().fadeIn('slow'))
        });
    
        const title = $(`
            <h5 class="modal-title bold" id="roundResult">BLACK TEAM SCORES!</h5>
        `)
        $('#roundResult').replaceWith(title);
    
        showResult(outcomeCards, 'submissionCards');
        $('#outcomeModal').on('hidden.bs.modal', () => {
            // console.log('hidden!')
            socket.emit('cueNextTurn');
        });
    
        const chatMsg = $(`
                <p class="text-center text-white scrollPush bg-black bold">BLACK TEAM WINS ROUND ${currRound}!</p>
            `);
        insertMsg(chatMsg, 'chatBody');
        
        const nextRoundEl = $(`<span id="roundNum">${nextRound}</span>`)
        $('#roundNum').fadeOut('slow', function() {
            $(this).remove();
            $('#currentScore').append(nextRoundEl.hide().fadeIn('slow'))
        });
    });
    
    socket.on('winner', (color, outcomeCards, ids) => {
        exited = false;
        const btn = $(`
            <p class="action staticMsg notTurnButt"> . . . </p>
        `);
        anim(btn, 'buttonDiv');
        const scoreEl = $(`<span id="${color}Num">3</span>`);
        $(`#${color}Num`).fadeOut('slow', function() {
            $(this).remove()
            $(`#${color}Score`).append(scoreEl.hide().fadeIn('slow'))
        });
    
        const caps = color.toUpperCase();
        let winnerColor;
        let winnerBackground
        if (caps === "BLACK") {
                winnerColor = 'text-black'
                winnerBackground = 'bg-black'
            } else {
                winnerColor = 'text-danger'
                winnerBackground = 'bg-danger'
        }
    
        const title = $(`
            <h5 class="modal-title bold ${winnerColor}" id="winnerTitle">${caps} TEAM WINS!</h5>
        `)
        $('#winnerTitle').replaceWith(title);
    
        const chatMsg = $(`
                <p class="text-center text-white scrollPush ${winnerBackground} bold">${caps} TEAM WINS THE GAME!</p>
            `);
        insertMsg(chatMsg, 'chatBody');
    
        showResult(outcomeCards, 'winnerCards');
        identityReveal(ids)
        return;
    });
    
    socket.on('returnToRoom', num => {
        checkNumPlayers(num);
    })
    
    
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
        // console.log('IDOBJ: ', obj)
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
                    exited = true;
                    $('#scoreboardDiv').css('display', 'none');
                    socket.emit('exitGame');
                    $('#identityModal').off();
                })
            }
            const btn = $(`
                <button class="action btn btn-success col bold" id="exitButt" type="button">EXIT GAME</button>
            `)
            anim(btn, 'buttonDiv', exitListen)   
        })
    
        
    }
});