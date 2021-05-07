module.exports = io => {

    const {rooms, activeIds} = require('./activeRooms');
    const { dealMission, populateThings, shuffle } = require('./helpers');

    class Game {
        constructor() {
            this.teamsTemp = {},
            this.deck = {},
            this.order = [],
            this.turn = null,
            this.next = null,
            this.idCards = [],
            this.idsObj = {},
            this.checked = [],
            this.vote = {},
            this.submissionArr = [],
            this.submissionCards = [],
            this.missions = [],
            this.scoreboard = {},
            this.currentMission = null,
            this.missionMax = null
        }
    }

    class Player {
        constructor(name, socket) {
            this.name = name;
            this.team = null;
            this.socket = socket;
            this.idCard = null;
            this.color = null;
            this.button = null;
            this.label = null;
        }
    }

    const re = /\/(.+)/

    io.on('connection', socket => {
        const url = new URL(socket.handshake.headers.referer);
        const gameId = re.exec(url.pathname)[1];
        // const gameId = gamePath.replace(/-/g, '_');
        const sock = socket.id;
        if (!activeIds.includes(gameId)) {
            activeIds.push(gameId);
        }
        console.log('SERVER 69: ' + activeIds);
        let handle;
        console.log('GAME ID: ' + gameId)
        console.log(`Player ${sock} has joined ${gameId}`);
        io.to(sock).emit('room', gameId)
        
        socket.on('knock', () => {
            const available = vacancyCheck(gameId);
            console.log('KNOCK ' + available);
            io.to(sock).emit('available', available, false);
        });

        socket.on('nameCheck', name => {
            // console.log(name)
            const available = vacancyCheck(gameId);
            
            if (available) {

                if (!rooms[gameId]) {
                    rooms[gameId] = {};
                    console.log('ROOM CREATED');
                }

                if (!rooms[gameId]['players']) {
                    rooms[gameId]['players'] = {};
                    console.log('PLAYERS CREATED');
                }

                if (rooms[gameId]['players'][name]) {
                    io.to(sock).emit('available', available, true);
                    console.log('DUPLICATE');

                } else {
                    socket.join(gameId);
                    rooms[gameId]['players'][name] = new Player(name, sock);
                    handle = name;
                    const players = Object.keys(rooms[gameId]['players']);
                    io.to(sock).emit('addPlayer', players, players.length, name);
                    io.to(sock).emit('revealStart', name);
                    toAllExcept('updatePlayer', gameId, [name, players.length], name);
                    console.log(`There are ${players.length} players in ${gameId}`, rooms);
                    console.log( `There are ${activeIds.length} active rooms: ${activeIds}`);
                    console.log('PLAYER CREATED');
                    return;
                }
                
            } else {
                io.to(sock).emit('available', false, false);
            }

            // console.log(rooms[gameId]['players']);
        });

        socket.on('disconnect', () => {
            if (!handle) {
                return;
            }

            if (rooms[gameId] && rooms[gameId]['players']) {
                let left;
                for (let player in rooms[gameId]['players']) {
                    if (rooms[gameId]['players'][player]['socket'] === sock) {
                        console.log('found!')
                        left = player;
                        delete rooms[gameId]['players'][player];
                    }
                }
                const num = Object.keys(rooms[gameId]['players']).length;
                if (num === 0) {
                    if (activeIds.indexOf(gameId) !== -1) {
                        const i = activeIds.indexOf(gameId);
                        activeIds.splice(i, 1);
                        console.log( `There are ${activeIds.length} active rooms: ${activeIds}`);
                    }
                    delete rooms[gameId];
                    console.log(rooms);
                    return;
                }
                io.to(gameId).emit('rmvPlayer', left, num);
                console.log(`${left} left, there are ${num} players in ${gameId}`);
            }
        
            if (rooms[gameId] && rooms[gameId]['game']) {
                rooms[gameId]['game'] = null;
            } 
            
            console.log(`Player ${sock} has left ${gameId}`)
        });

        socket.on('chatSend', (handle, msg) => {
            // console.log(sock)
            io.to(gameId).emit('chatRcv', [handle, msg]);
        });

        socket.on('reload', function () {
            if (rooms[gameId] && rooms[gameId]['game']) {
                rooms[gameId]['game'] = null;
            }
            const num = Object.keys(rooms[gameId]['players']).length;
            io.to(gameId).emit('breakout', num)
        });

        socket.on('startGame', () => {
            if (rooms[gameId].game) {
                return;
            }

            rooms[gameId]['game'] = new Game()
            const players = Object.keys(rooms[gameId]['players']);
            populateThings(rooms[gameId], players.length);

            const order = rooms[gameId].game.order;
            const turn = rooms[gameId].game.turn;
            const current = rooms[gameId].game.currentMission;
            order.forEach(player => {
                const playerSock = rooms[gameId]['players'][player]['socket'];
                const card = rooms[gameId]['players'][player]['idCard'];
                io.to(playerSock).emit('idCard', card)
                if (player === turn) {
                    io.to(playerSock).emit('turn', current, player);
                    console.log('current = ', current);
                } else {
                    io.to(playerSock).emit('notTurn', turn);
                }
            });
        });

        socket.on('getButtons', () => {
            const buttonArr = [];
            for (let player in rooms[gameId]['players']) {
                buttonArr.push(rooms[gameId]['players'][player]['button']);
            }
            const currentMission = rooms[gameId]['game']['currentMission'];
            const missionMax = rooms[gameId]['game']['missions'][currentMission];

            io.to(sock).emit('propModal', buttonArr, currentMission, missionMax);
        });

        socket.on('sendProposal', checked => {
            console.log(`249: ${checked.length} players have been checked ${checked}`);
            rooms[gameId]['game']['vote'] = {};
            rooms[gameId]['game']['checked'] = checked;

            const labelArr = [];
            checked.forEach(player => {
                const label = rooms[gameId]['players'][player]['label'];
                labelArr.push(label);
            })
            
            console.log(`Sending ${labelArr.length} labels`);
            io.to(gameId).emit('voteLabels', labelArr, checked, handle)
        });

        socket.on('vote', function(vote) {
            if (!Object.keys(rooms[gameId]['game']['vote']).length) {
                rooms[gameId]['game']['vote']['yeas'] = [];
                rooms[gameId]['game']['vote']['nays'] = [];
            }
            if (vote === 'yea') {
                rooms[gameId]['game']['vote']['yeas'].push(handle);
            } else {
                rooms[gameId]['game']['vote']['nays'].push(handle);
            }
            io.to(gameId).emit('votePush', handle, vote)
            
            const yeas = rooms[gameId]['game']['vote']['yeas'];
            const nays = rooms[gameId]['game']['vote']['nays'];
            const turn = rooms[gameId]['game']['turn'];
            const numPlayers = Object.keys(rooms[gameId]['players']).length;
            const numChecked = rooms[gameId]['game']['checked'].length;
            const currentMission = rooms[gameId]['game']['currentMission'];

            console.log('yeas: ' + yeas.length, ' nays: ' + nays.length, 'needed: ' + numPlayers);

            if (yeas.length + nays.length === numPlayers) {
                console.log('vote complete!')
                if (yeas.length > nays.length) {
                    io.to(gameId).emit('votedUp', turn);
                    console.log(`293 REDS BEFORE: ${rooms[gameId]['game']['deck']['red'].length}, BLACKS BEFORE: ${rooms[gameId]['game']['deck']['black'].length}`)
                    const missionCards = dealMission(numChecked, rooms[gameId]['game']['deck']);
                    console.log(`295 REDS AFTER: ${rooms[gameId]['game']['deck']['red'].length}, BLACKS AFTER: ${rooms[gameId]['game']['deck']['black'].length}`)
                    console.log('289: ' + missionCards)

                    for (let i = 0; i < numChecked; i++){
                        const player = rooms[gameId]['game']['checked'][i];
                        const playerSock = rooms[gameId]['players'][player]['socket'];
                        // console.log(missionCards[i]);
                        io.to(playerSock).emit('missionModal', missionCards[i]);
                    }

                } else {
                    io.to(gameId).emit('votedDown', turn);
                    const nextUp = nextTurn(gameId);
                    const nextSock = rooms[gameId]['players'][nextUp]['socket'];
                    console.log(nextUp + ' IS NEXT');

                    if (currentMission === 3 && numPlayers > 6) {
                        io.to(gameId).emit('specialRound');
                    }

                    io.to(nextSock).emit('turn', currentMission, nextUp);
                    toAllExcept('notTurn', gameId, nextUp, nextUp);
                }

                rooms[gameId]['game']['vote'] = {};
            } else {
                return;
            }

        });

        socket.on('missionResolve', (submission, card) => {
            console.log('SUBMISSION: ', submission, ' CARD: ', card);
            rooms[gameId]['game']['submissionCards'].push(card);
            rooms[gameId]['game']['submissionArr'].push(submission);
            
            const checked = rooms[gameId]['game']['checked'];
            const submissionArr = rooms[gameId]['game']['submissionArr'];
            const submissionCards = rooms[gameId]['game']['submissionCards'];
            const currentMission = rooms[gameId]['game']['currentMission'];
            const players = Object.keys(rooms[gameId]['players']);

            console.log('PLAYERS: ' + checked.length, 'VOTES: ' + submissionArr.length)
            console.log(submissionArr, submissionCards);

            if ( submissionArr.length === checked.length ) {
                console.log(`MISSON # ${currentMission} COMPLETED`);
                rooms[gameId]['game']['currentMission'] += 1;
                const nextMission = rooms[gameId]['game']['currentMission'];
                console.log(`NEXT MISSION IS # ${nextMission}`);
                shuffle(submissionCards);

                if (currentMission === 3 && players.length > 6) {
                    const nayVotes = submissionArr.filter(vote => vote === 'fail');
                    console.log('NAYS: ', nayVotes)
                    if (nayVotes.length > 1) {
                        console.log('TRUE');
                        const redScore = increment('red', gameId);
                        if (redScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'red', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('fail', submissionCards, redScore, nextMission);
                        }
                    } else {
                        console.log('FALSE')
                        const blackScore = increment('black', gameId);
                        if (blackScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'black', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('pass', submissionCards, blackScore, nextMission);
                        }
                    }
                } else {
                    if (submissionArr.includes('fail')) {
                        const redScore = increment('red', gameId);
                        if (redScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'red', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('fail', submissionCards, redScore, nextMission);
                        }
                    } else {
                        const blackScore = increment('black', gameId);
                        if (blackScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'black', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('pass', submissionCards, blackScore, nextMission);
                        }
                    }
                }

                console.log(`CURRENT SCORE: ${JSON.stringify(rooms[gameId]['game']['scoreboard'], null, 2)}`);

                if (rooms[gameId]['game']['scoreboard']['black'] > 2 || rooms[gameId]['game']['scoreboard']['red'] > 2) {
                    console.log('We have a winner!');
                    rooms[gameId]['game'] = null;
                    
                } else {
                    rooms[gameId]['game']['checked'] = []; 
                    rooms[gameId]['game']['submissionCards'] = [];
                    rooms[gameId]['game']['submissionArr'] = [];

                    const nextUp = nextTurn(gameId);
                    const nextSock = rooms[gameId]['players'][nextUp]['socket'];
                    console.log(nextUp + ' IS NEXT');

                    if (nextMission === 3 && players.length > 6) {
                        io.to(gameId).emit('specialRound');
                    }

                    io.to(nextSock).emit('turn', nextMission, nextUp);
                    toAllExcept('notTurn', gameId, nextUp, nextUp);
                }

            } else {
                console.log('Votes are still coming in . . .')
            }
        });
    });

    //checks if there is a room with id: gameId and if Game object has been generated
    function vacancyCheck (gameId) {
        if (rooms[gameId] && rooms[gameId]['game']) {
            return false;
        } else {
            return true;
        }
    }

    function toAllExcept (event, room, payload, exception) {
        if (rooms[room]['players']) {
            if (typeof exception === 'string') {
                for (let player in rooms[room]['players']) {
                    if (player === exception) {
                        continue;
                    }
                    const playerSock = rooms[room]['players'][player]['socket'];
                    io.to(playerSock).emit(event, payload);
                }   
            }
            else if (Array.isArray(exception)) {
                for (let player in rooms[room]['players']) {
                    if(exception.includes(player)) {
                    continue;
                    }
                    const playerSock = rooms[room]['players'][player]['socket'];
                    io.to(playerSock).emit(event, payload);
                }
            } 
            else {
                console.log('Exception must be either a user or an array of users')
            }
        } else {
            console.log(`ERROR: ${rooms[room]['players']} does not exist`)
        }
    }

    //sets Game.turn to next player in Game.order (loops at end), DOES NOT CHANGE GAME.CURRENTMISSION in case mission is voted down
    //returns next player
    function nextTurn (room) {
        const order = rooms[room]['game']['order'];
        const turn = rooms[room]['game']['turn'];
        let nextUp;
        console.log(turn + ' JUST FINISHED THEIR TURN')
        console.log('ORDER : ' + order)
        const pos = order.indexOf(turn);
        if (turn === order[order.length - 1]) {
            nextUp = order[0];
        } else {
            nextUp = order[pos + 1];
        }
        rooms[room]['game']['turn'] = nextUp;
        return nextUp;
    }

    //increments score for team in room, returns updated score
    function increment(team, room) {
        rooms[room]['game']['scoreboard'][team] = rooms[room]['game']['scoreboard'][team] + 1 || 1;
        return rooms[room]['game']['scoreboard'][team];
    }

}