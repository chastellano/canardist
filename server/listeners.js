module.exports = io => {

    const {rooms, activeIds} = require('./activeRooms');
    const { dealRound, populateThings, shuffle } = require('./helpers');
    let starts = 0;

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
            this.rounds = [],
            this.scoreboard = {},
            this.currentRound = null,
            this.roundMax = null
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
        const remoteId = socket.request.connection.remoteAddress
        const url = new URL(socket.handshake.headers.referer);
        const gameId = re.exec(url.pathname)[1];
        const sock = socket.id;

        io.to(sock).emit('idCheck', remoteId);
        
        if (!activeIds.includes(gameId)) {
            activeIds.push(gameId);
        }
        let handle;
        io.to(sock).emit('room', gameId)
        
        socket.on('knock', () => {
            const available = vacancyCheck(gameId);
            io.to(sock).emit('available', available, false);
        });

        socket.on('nameCheck', name => {
            const available = vacancyCheck(gameId);
            
            if (available) {

                if (!rooms[gameId]) {
                    rooms[gameId] = {};
                }

                if (!rooms[gameId]['players']) {
                    rooms[gameId]['players'] = {};
                }

                if (rooms[gameId]['players'][name]) {
                    io.to(sock).emit('available', available, true);

                } else {
                    handle = name;
                    io.to(sock).emit('tour', handle);
                }
                
            } else {
                io.to(sock).emit('available', false, false);
            } 
        });
        
        socket.on('letMeIn', () => {
            socket.join(gameId);
            rooms[gameId]['players'][handle] = new Player(handle, sock);
            
            const players = Object.keys(rooms[gameId]['players']);
            io.to(sock).emit('addPlayer', players, players.length, handle);
            toAllExcept('updatePlayer', gameId, [handle, players.length], handle);
            return;
        });

        socket.on('disconnect', () => {
            starts = 0
            if (!handle) {
                return;
            }

            if (rooms[gameId] && rooms[gameId]['players']) {
                let left;
                for (let player in rooms[gameId]['players']) {
                    if (rooms[gameId]['players'][player]['socket'] === sock) {
                        left = player;
                        delete rooms[gameId]['players'][player];
                    }
                }
                const num = Object.keys(rooms[gameId]['players']).length;
                if (num === 0) {
                    if (activeIds.indexOf(gameId) !== -1) {
                        const i = activeIds.indexOf(gameId);
                        activeIds.splice(i, 1);
                    }
                    delete rooms[gameId];
                    return;
                }
                io.to(gameId).emit('rmvPlayer', left, num);
            }
        
            if (rooms[gameId] && rooms[gameId]['game']) {
                rooms[gameId]['game'] = null;
            }             
        });

        socket.on('chatSend', (msg, onTour) => {
            if (onTour) {
                io.to(sock).emit('chatRcv', [handle, msg]);
            } else {
                io.to(gameId).emit('chatRcv', [handle, msg]);
            }
        });

        socket.on('checkReload', () => {
            if (rooms[gameId] && rooms[gameId]['game']) {
                io.to(sock).emit('showReloadModal');
            }
        })

        socket.on('reload', function () {
            if (rooms[gameId] && rooms[gameId]['game']) {
                rooms[gameId]['game'] = null;
                const num = Object.keys(rooms[gameId]['players']).length;
                io.to(gameId).emit('breakout', num, handle)
            } else {
                return;
            }
        });

        socket.on('startGame', () => {
            starts += 1
            const players = Object.keys(rooms[gameId]['players']);

            if (starts === players.length){
                starts = 0;
                rooms[gameId]['game'] = new Game()
                populateThings(rooms[gameId], players.length);
    
                const order = rooms[gameId].game.order;
                const turn = rooms[gameId].game.turn;
                const current = rooms[gameId].game.currentRound;
                order.forEach(player => {
                    const playerSock = rooms[gameId]['players'][player]['socket'];
                    const card = rooms[gameId]['players'][player]['idCard'];
                    io.to(playerSock).emit('idCard', card, rooms[gameId]['game']['teamsTemp']['reds'])
                    if (player === turn) {
                        io.to(playerSock).emit('turn', current, player);
                    } else {
                        io.to(playerSock).emit('notTurn', turn);
                    }
                });
            } else {
                return;
            }

        });

        socket.on('getButtons', () => {
            const buttonArr = [];
            for (let player in rooms[gameId]['players']) {
                buttonArr.push(rooms[gameId]['players'][player]['button']);
            }
            const currentRound = rooms[gameId]['game']['currentRound'];
            const roundMax = rooms[gameId]['game']['rounds'][currentRound];

            io.to(sock).emit('propModal', buttonArr, currentRound, roundMax);
        });

        socket.on('sendProposal', checked => {
            rooms[gameId]['game']['vote'] = {};
            rooms[gameId]['game']['checked'] = checked;

            const labelArr = [];
            checked.forEach(player => {
                const label = rooms[gameId]['players'][player]['label'];
                labelArr.push(label);
            })
            
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
            const currentRound = rooms[gameId]['game']['currentRound'];

            if (yeas.length + nays.length === numPlayers) {
                if (yeas.length > nays.length) {
                    io.to(gameId).emit('votedUp', turn);
                    const roundCards = dealRound(numChecked, rooms[gameId]['game']['deck']);

                    for (let i = 0; i < numChecked; i++){
                        const player = rooms[gameId]['game']['checked'][i];
                        const playerSock = rooms[gameId]['players'][player]['socket'];
                        io.to(playerSock).emit('roundModal', roundCards[i]);
                    }

                } else {
                    io.to(gameId).emit('votedDown', turn);
                    const nextUp = nextTurn(gameId);
                    const nextSock = rooms[gameId]['players'][nextUp]['socket'];

                    if (currentRound === 3 && numPlayers > 6) {
                        io.to(gameId).emit('specialRound');
                    }

                    io.to(nextSock).emit('turn', currentRound, nextUp);
                    toAllExcept('notTurn', gameId, nextUp, nextUp);
                }

                rooms[gameId]['game']['vote'] = {};
            } else {
                return;
            }

        });

        socket.on('roundResolve', (submission, card) => {
            rooms[gameId]['game']['submissionCards'].push(card);
            rooms[gameId]['game']['submissionArr'].push(submission);
            
            const checked = rooms[gameId]['game']['checked'];
            const submissionArr = rooms[gameId]['game']['submissionArr'];
            const submissionCards = rooms[gameId]['game']['submissionCards'];
            const currentRound = rooms[gameId]['game']['currentRound'];
            const players = Object.keys(rooms[gameId]['players']);

            if ( submissionArr.length === checked.length ) {
                rooms[gameId]['game']['currentRound'] += 1;
                const nextRound = rooms[gameId]['game']['currentRound'];
                shuffle(submissionCards);

                if (currentRound === 3 && players.length > 6) {
                    const nayVotes = submissionArr.filter(vote => vote === 'fail');
                    if (nayVotes.length > 1) {
                        const redScore = increment('red', gameId);
                        if (redScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'red', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('fail', submissionCards, redScore, nextRound);
                        }
                    } else {
                        const blackScore = increment('black', gameId);
                        if (blackScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'black', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('pass', submissionCards, blackScore, nextRound);
                        }
                    }
                } else {
                    if (submissionArr.includes('fail')) {
                        const redScore = increment('red', gameId);
                        if (redScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'red', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('fail', submissionCards, redScore, nextRound);
                        }
                    } else {
                        const blackScore = increment('black', gameId);
                        if (blackScore > 2) {
                            const idsObj = rooms[gameId]['game']['idsObj'];
                            io.to(gameId).emit('winner', 'black', submissionCards, idsObj);
                        } else {
                            io.to(gameId).emit('pass', submissionCards, blackScore, nextRound);
                        }
                    }
                }
                
                if (rooms[gameId]['game']['scoreboard']['black'] > 2 || rooms[gameId]['game']['scoreboard']['red'] > 2) {
                    rooms[gameId]['game'] = null;
                    
                } else {
                    rooms[gameId]['game']['checked'] = []; 
                    rooms[gameId]['game']['submissionCards'] = [];
                    rooms[gameId]['game']['submissionArr'] = [];

                    nextTurn(gameId);

                    if (nextRound === 3 && players.length > 6) {
                        io.to(gameId).emit('specialRound');
                    }
                }

            }
        });

        socket.on('cueNextTurn', () => {
            if (rooms[gameId] && rooms[gameId]['game']) {
                const nextRound = rooms[gameId]['game']['currentRound'];
                const nextUp = rooms[gameId]['game']['turn']
                const nextSock = rooms[gameId]['players'][nextUp]['socket'];
            
                if (socket.id === nextSock) {
                    io.to(socket.id).emit('turn', nextRound, nextUp)
                } else {
                    io.to(socket.id).emit('notTurn', nextUp);
                }
            }
        })

        socket.on('exitGame', () => {
            const num = Object.keys(rooms[gameId]['players']).length;
            io.to(socket.id).emit('returnToRoom', num)
        })
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
        if (rooms[room] && rooms[room]['players']) {
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
        }
    }

    //sets Game.turn to next player in Game.order (loops at end), DOES NOT CHANGE Game.currentRound in case round is voted down
    //returns next player
    function nextTurn (room) {
        const order = rooms[room]['game']['order'];
        const turn = rooms[room]['game']['turn'];
        let nextUp;
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