const crypto = require('crypto');

module.exports = io => {

    const { rooms, activeIds } = require('./activeRooms');
    const { dealRound, buildGameObjects, shuffle, isSubmissionPass } = require('./helpers');
    const { newGame, redPlayers, playerChat, newPlayerJoined, playerProposal, playerVote, proposalDecision, teamWinsRound, teamWinsGame, specialRound, resetGame } = require('./messages');
    const randomId = () => crypto.randomBytes(8).toString("hex");

    let numberOfGameJoins = 0;

    class Game {
        constructor() {
            this.sessionIds = [];
            this.teamsTemp = {},
            this.deck = {},
            this.order = [],
            this.turn,
            this.next,
            this.idCards = [],
            this.playersOnCurrentMission = [],
            this.vote = { yeas: [], nays: []},
            this.missionCards = {},
            this.submissions = {},
            this.playersPerRound = [],  
            this.scoreboard = {black: 0, red: 0},
            this.currentRound
        }

        get roundMax() {
            return this.playersPerRound[this.currentRound];
        }

        get numberOfPlayers() {
            return this.sessionIds.length
        }

        get allowableFails() {
            return this.currentRound === 3 && this.numberOfPlayers > 6 ? 1 : 0;   
        }
    }

    class Player {
        constructor(sessionId, socketId, name) {
            this.sessionId = sessionId;
            this.socketId = socketId;
            this.isInCurrentGame = null;
            this.name = name;
            this.connected = true;
            this.team = null;
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
        let handle;

        io.to(socket.id).emit("checkForExistingSession");

        socket.on('existingSession', sessionId => {
            if (sessionId) {
                socket.sessionId = sessionId;

                if (rooms[gameId]){
                    const playersWithMatchingSession = Object.values(rooms[gameId]['players']).filter(p => p.sessionId === sessionId)
                    const isReturningPlayer =  playersWithMatchingSession.length > 0;

                    if(isReturningPlayer) {
                        handle = playersWithMatchingSession[0].name;
                        const gameInProgress = rooms[gameId] && rooms[gameId]['game'] && Object.keys(rooms[gameId]['game']).length > 0;

                        socket.join(gameId);
                        rooms[gameId]['players'][handle]['connected'] = true;
                        rooms[gameId]['players'][handle]['socketId'] = socket.id;
                        const playerChat = restorePlayerChat(handle, rooms[gameId]['chat']);

                        if (!gameInProgress) {
                            io.to(socket.id).emit("admitReturningPlayerToRoom", Object.values(rooms[gameId]['players']), handle, playerChat);
                            emitRoomStateToReturningPlayer(handle, socket.id, gameId);
                        }
                        else {
                            const playerIsInCurrentGame = rooms[gameId]['game']['sessionIds'].includes(sessionId);
                            io.to(socket.id).emit("admitReturningPlayerToGame", handle, rooms[gameId], playerChat, playerIsInCurrentGame);

                            if(playerIsInCurrentGame) {
                                emitGameStateToReturningPlayer(handle, socket.id, gameId);
                            }
                        }

                        emitToAllExcept('playerHasReenteredTheRoom', gameId, handle, handle);
                    }
                }
            }
            else {
                const newSessionId = randomId()
                socket.sessionId = newSessionId;
                io.to(socket.id).emit("assignNewSession", newSessionId);
            }
        });

        socket.on('checkNameIsAvailable', requestedName => {
                console.log(rooms[gameId]);
                if (!rooms[gameId]) {
                    console.log("null");
                    rooms[gameId] = { players: {}, sessionIds: [], game: {}, chat: [], joins: [] }
                }

                if (rooms[gameId]['players'][requestedName]) {
                    io.to(socket.id).emit('nameIsUnavailable');
                } else {
                    handle = requestedName;
                    io.to(socket.id).emit('offerTour', handle);
                }
        });
        
        socket.on('requestEntranceToRoom', () => {
            socket.join(gameId);
            rooms[gameId]['players'][handle] = new Player(socket.sessionId, socket.id, handle);
            
            const players = Object.values(rooms[gameId]['players']);
            const isGameInProgress = rooms[gameId]['game'] && Object.keys(rooms[gameId]['game']).length > 0;
            const isGameFull = rooms[gameId]['joins'] && rooms[gameId]['joins'].length > 9;
            
            if (isGameInProgress) {
                io.to(socket.id).emit('admitPlayerGameInProgress', players, handle, rooms[gameId]['game']['scoreboard'], rooms[gameId]['game']['currentRound']);
            } 
            else {
                io.to(socket.id).emit('admitPlayerToRoom', players, handle, isGameFull);
            }
            
            const newPlayerMsg = newPlayerJoined(handle);
            archiveMessage(gameId, newPlayerMsg);
            emitToAllExcept('aNewPlayerHasEnteredTheRoom', gameId, {handle, newPlayerMsg}, handle);
        });

        socket.on('disconnect', () => {
            numberOfGameJoins = 0 

            if (handle && rooms[gameId] && rooms[gameId]['players'] && rooms[gameId]['players'][handle]) {
                rooms[gameId]['players'][handle]['connected'] = false;
                const numRemainingConnectedPlayers = Object.values(rooms[gameId]['players']).filter(p => p.connected).length;

                if (numRemainingConnectedPlayers === 0) {
                    if (activeIds.indexOf(gameId) !== -1) {
                        const i = activeIds.indexOf(gameId);
                        activeIds.splice(i, 1);
                    }
                    delete rooms[gameId];
                    return;
                }

                io.to(gameId).emit('rmvPlayer', handle);
            }          
        });

        socket.on('chatSend', (msg, onTour) => {
            const playerMessage = playerChat(handle, msg);
            archiveMessage(gameId, playerMessage);

            onTour 
                ? io.to(socket.id).emit('chatRcv', playerMessage)
                : io.to(gameId).emit('chatRcv', playerMessage);
            
        });

        socket.on('reload', function () {
            rooms[gameId]['joins'] = [];
            delete rooms[gameId]['game'];
            for (let player in rooms[gameId]['players']) {
                rooms[gameId]['players'][player]['isInCurrentGame'] = false;
            }

            const resetGameMsg = resetGame(handle);
            archiveMessage(gameId, resetGameMsg);
            io.to(gameId).emit('exitGame', resetGameMsg);
        });

        socket.on('joinGame', () => {         
            const previousJoins = rooms[gameId]['joins'].length;

            if (previousJoins === 10) {
                return io.to(socket.id).emit('tooManyPlayers');
            }

            if (rooms[gameId]['game'] && Object.keys(rooms[gameId]['game']).length > 0){
                return io.to(socket.id).emit('gameInProgress', rooms[gameId]['game']['scoreboard'], rooms[gameId]['game']['currentRound'] + 1);
            }

            if (!rooms[gameId]['joins'].includes(handle)) {
                rooms[gameId]['joins'].push(handle)
            }

            const currentPlayersJoined = rooms[gameId]['joins'];
        
            if (currentPlayersJoined.length < 5) {
                for (let player of currentPlayersJoined) {
                    io.to(rooms[gameId]['players'][player]['socketId']).emit('morePlayersNeeded', 5 - currentPlayersJoined.length);
                }
            }
            
            else if (previousJoins === 4 && currentPlayersJoined.length === 5) {
                const firstTurn = shuffle(rooms[gameId]['joins'])[0];
                const turnSocket = rooms[gameId]['players'][firstTurn]['socketId'];
                io.to(turnSocket).emit('notifyFirstTurn');
                for (let player of currentPlayersJoined) {
                    if (player === firstTurn) continue;
                    io.to(rooms[gameId]['players'][player]['socketId']).emit('waitingForFirstPlayerToStart', firstTurn)
                }
            }

            else if (previousJoins === 9 && currentPlayersJoined.length === 10) {
                io.to(socket.id).emit('waitingForFirstPlayerToStart', rooms[gameId]['joins'][0]);
                const unjoinedPlayers = Object.keys(rooms[gameId]['players']).filter(p => !currentPlayersJoined.includes(p));
                for (let player of unjoinedPlayers) {
                    io.to(rooms[gameId]['players'][player]['socketId']).emit('tooManyPlayers');
                }
            }

            else if (currentPlayersJoined.length > 4) {
                io.to(socket.id).emit('waitingForFirstPlayerToStart', rooms[gameId]['joins'][0]);
            } 
        });

        socket.on('unjoinGame', () => {
            const previousJoins = rooms[gameId]['joins'].length;
            const index = rooms[gameId]['joins'].indexOf(handle);
            if (index > -1) rooms[gameId]['joins'].splice(index, 1);
            const currentPlayersJoined = rooms[gameId]['joins'];

            if (currentPlayersJoined.length < 5) {
                for (let player of currentPlayersJoined) {
                    io.to(rooms[gameId]['players'][player]['socketId']).emit('morePlayersNeeded', 5 - currentPlayersJoined.length);
                }
            } else if (previousJoins === 10 && currentPlayersJoined.length < 10) {
                const unjoinedPlayers = Object.keys(rooms[gameId]['players']).filter(p => !currentPlayersJoined.includes(p));
                for (let player of unjoinedPlayers) {
                    io.to(rooms[gameId]['players'][player]['socketId']).emit('inviteToJoinGame');
                }
            }
        });

        socket.on('startGame', () => {
            rooms[gameId]['game'] = new Game();
            let sessionIdsInGame = [];
            for (let player of Object.values(rooms[gameId]['players'])) {
                if (rooms[gameId]['joins'].includes(player.name)){
                    sessionIdsInGame.push(player.sessionId);
                    rooms[gameId]['players'][player.name].isInCurrentGame = true;
                }
                else {
                    io.to(player.socketId).emit('gameInProgress', {black: 0, red: 0}, 1);
                }
            };
            rooms[gameId]['game']['sessionIds'].push(...sessionIdsInGame);
            buildGameObjects(rooms[gameId]);
            rooms[gameId]['joins'] = [];
            
            //remove players array from game, let exist in activePlayers array, only track player PK's in rooms[gameId]['game'][sessions] ? ? ?\
            const order = rooms[gameId].game.order;
            const turn = rooms[gameId].game.turn;
            const current = rooms[gameId].game.currentRound;
            const redPlayersMsg = redPlayers(rooms[gameId]['game']['teamsTemp']['reds']);
            order.forEach(player => {
                const playerSock = rooms[gameId]['players'][player]['socketId'];
                const card = rooms[gameId]['players'][player]['idCard'];
                io.to(playerSock).emit('idCard', card, newGame, redPlayersMsg);
                if (player === turn) {
                    io.to(playerSock).emit('turn', current, player);
                } else {
                    io.to(playerSock).emit('notTurn', turn);
                }
            });

            archiveMessage(gameId, newGame);
            archiveMessage(gameId, redPlayersMsg);
        })

        socket.on('getButtons', () => {                            
            const playerButtons = Object.values(rooms[gameId]['players']).filter(p => p.isInCurrentGame).map(p => p.button);
            const currentRound = rooms[gameId]['game']['currentRound'];
            const roundMax = rooms[gameId]['game']['roundMax'];

            io.to(socket.id).emit('propModal', playerButtons, currentRound, roundMax);
        });

        socket.on('sendProposal', playersOnCurrentMission => {
            rooms[gameId]['game']['vote'] = {yeas: [], nays: []};
            rooms[gameId]['game']['playersOnCurrentMission'] = playersOnCurrentMission;
            
            const labels = getMissionLabels(gameId, playersOnCurrentMission);
            const playersInGame = Object.values(rooms[gameId]['players']).filter(p => {
                return rooms[gameId]['game']['sessionIds'].includes(p.sessionId)
            })
            
            const proposalMessage = playerProposal(handle, playersOnCurrentMission)
            archiveMessage(gameId, proposalMessage);

            io.to(gameId).emit('chatRcv', proposalMessage);

            for (let player of playersInGame) {
                io.to(player.socketId).emit('voteLabels', labels);
            }
        });

        socket.on('vote', vote => {
            if (vote === 'yea') {
                rooms[gameId]['game']['vote']['yeas'].push(handle); 
            } else {
                rooms[gameId]['game']['vote']['nays'].push(handle);
            }

            const color = vote === 'yea' ? 'greenVote' : 'redVote';
            const voteMessage = playerVote(color, handle, vote);
            archiveMessage(gameId, voteMessage);
            io.to(gameId).emit('votePush', voteMessage);
            
            const yeas = rooms[gameId]['game']['vote']['yeas'];
            const nays = rooms[gameId]['game']['vote']['nays'];
            const turn = rooms[gameId]['game']['turn'];
            const numberOfPlayers = rooms[gameId]['game']['numberOfPlayers'];
            const currentRound = rooms[gameId]['game']['currentRound'];
            
            if (yeas.length + nays.length === numberOfPlayers) {
                if (yeas.length > nays.length) {
                    const proposalApprovalMsg = proposalDecision(turn, "approved");
                    archiveMessage(gameId, proposalApprovalMsg);
                    io.to(gameId).emit('votedUp', proposalApprovalMsg);
                    const numberOfPlayersOnMission = rooms[gameId]['game']['playersOnCurrentMission'].length;
                    const missionCards = dealRound(numberOfPlayersOnMission, rooms[gameId]['game']['deck']);

                    for (let i = 0; i < numberOfPlayersOnMission; i++){
                        const player = rooms[gameId]['game']['playersOnCurrentMission'][i];
                        const playerSock = rooms[gameId]['players'][player]['socketId'];
                        rooms[gameId]['game']['missionCards'][player] = missionCards[i]
                        io.to(playerSock).emit('roundModal', missionCards[i]);
                    }

                } else {
                    const proposalRejectedMsg = proposalDecision(turn, "voted down");
                    archiveMessage(gameId, proposalRejectedMsg);
                    io.to(gameId).emit('votedDown', proposalRejectedMsg);
                    rooms[gameId]['game']['vote'] = {yeas: [], nays: []};

                    const nextUp = nextTurn(gameId);
                    const nextSock = rooms[gameId]['players'][nextUp]['socketId'];

                    io.to(nextSock).emit('turn', currentRound, nextUp);
                    emitToAllExcept('notTurn', gameId, nextUp, nextUp);
                }
            }
        });

        socket.on('roundResolve', card => {
            rooms[gameId]['game']['submissions'][handle] = card;
            
            const numberOfPlayersOnMission = rooms[gameId]['game']['playersOnCurrentMission'].length;
            const submittedCards = Object.values(rooms[gameId]['game']['submissions']);

            if ( submittedCards.length === numberOfPlayersOnMission ) {
                const fails = submittedCards.filter(card => !isSubmissionPass(card)).length;
                fails > rooms[gameId]['game']['allowableFails'] ? teamScores(gameId, 'red') : teamScores(gameId, 'black');
                
                rooms[gameId]['game']['currentRound'] += 1;
                
                if (rooms[gameId]['game']['scoreboard']['black'] > 2 || rooms[gameId]['game']['scoreboard']['red'] > 2) {
                    delete rooms[gameId]['game'];
                    for (let player in rooms[gameId]['players']) {
                        rooms[gameId]['players'][player]['isInCurrentGame'] = false;
                    }
                } else {
                    rooms[gameId]['game']['playersOnCurrentMission'] = []; 
                    rooms[gameId]['game']['submissions'] = {};
                    rooms[gameId]['game']['vote'] = {yeas: [], nays: []};
                    rooms[gameId]['game']['missionCards'] = {};

                    nextTurn(gameId);

                    if (rooms[gameId]['game']['allowableFails'] === 1) {
                        archiveMessage(gameId, specialRound);
                        io.to(gameId).emit('specialRound', specialRound);
                    }
                }
            }
        });

        socket.on('cueNextTurn', () => {
            if (rooms[gameId] && rooms[gameId]['game']) {
                const nextRound = rooms[gameId]['game']['currentRound'];
                const nextUp = rooms[gameId]['game']['turn']
                const nextSocketId = rooms[gameId]['players'][nextUp]['socketId'];
            
                if (socket.id === nextSocketId) {
                    io.to(socket.id).emit('turn', nextRound, nextUp)
                } else {
                    io.to(socket.id).emit('notTurn', nextUp);
                }
            }
        })
    });

    const archiveMessage = (gameId, message) => {
        if (!rooms[gameId]['chat']){
            rooms[gameId]['chat'] = [];
        }

        rooms[gameId]['chat'].push(message);
        if(rooms[gameId]['chat'].length > 50) {
            rooms[gameId]['chat'].shift();
        }
    }

    const emitToAllExcept = (event, gameId, payload, exception) => {
        if (rooms[gameId] && rooms[gameId]['players']) {
            if (typeof exception === 'string') {
                for (let player in rooms[gameId]['players']) {
                    if (player === exception) {
                        continue;
                    }
                    const playerSock = rooms[gameId]['players'][player]['socketId'];
                    io.to(playerSock).emit(event, payload);
                }   
            }
            else if (Array.isArray(exception)) {
                for (let player in rooms[gameId]['players']) {
                    if(exception.includes(player)) {
                        continue;
                    }
                    const playerSock = rooms[gameId]['players'][player]['socketId'];
                    io.to(playerSock).emit(event, payload);
                }
            }
        }
    }

    const getMissionLabels = (gameId, players) => {
        const labels = [];
        players.forEach(player => {
            const label = rooms[gameId]['players'][player]['label'];
            labels.push(label);
        });
        return labels;
    }

    const teamScores = (gameId, team) => {
        const score = rooms[gameId]['game']['scoreboard'][team] += 1;
        const submittedCards = shuffle(Object.values(rooms[gameId]['game']['submissions']));
        const currentRound = rooms[gameId]['game']['currentRound'] + 1;
        const color = team === 'black' ? 'bg-black' : 'bg-danger';
        
        if (score > 2) {
            const idCards = {};
            Object.values(rooms[gameId]['players']).filter(p => p.isInCurrentGame).forEach(p => {
                idCards[p.name] = p.idCard;
            });

            const winnerMsg = teamWinsGame(color, team.toUpperCase());
            archiveMessage(gameId, winnerMsg);
            io.to(gameId).emit('winner', team, submittedCards, idCards, winnerMsg);
        } else {
            const missionResult = team === 'black' ? 'pass' : 'fail';
            const roundWinnerMsg = teamWinsRound(color, team.toUpperCase(), currentRound)
            archiveMessage(gameId, roundWinnerMsg);
            io.to(gameId).emit(missionResult, submittedCards, score, currentRound, roundWinnerMsg);
        }
    }

    //sets Game.turn to next player in Game.order (loops at end), DOES NOT CHANGE Game.currentRound in case round is voted down
    //returns next player
    const nextTurn = room => {
        const order = rooms[room]['game']['order'];
        const turn = rooms[room]['game']['turn'];
        const pos = order.indexOf(turn);

        const nextUp = turn === order[order.length - 1] 
            ? order[0]
            : order[pos + 1];
     
        rooms[room]['game']['turn'] = nextUp;
        return nextUp;
    }

    const restorePlayerChat = (handle, roomChat) => {
        let playerChat;
        for(let i = 0 ; i < roomChat.length ; i++ ) {
            if (roomChat[i].includes(handle + "Join"))
            {
                playerChat = roomChat.slice(i + 1);
                break;
            } else {
                playerChat = roomChat;
            }
        }

        return playerChat;
    }

    const emitRoomStateToReturningPlayer = (name, socketId, gameId) => {
        currentJoins = rooms[gameId]['joins'];
        const isGameFull = currentJoins && currentJoins.length > 9;
        const isJoined = currentJoins && currentJoins.includes(name);

        if (isJoined) {
            if (currentJoins.length > 4) {
                if (currentJoins[0] === name) {
                    io.to(socketId).emit('notifyFirstTurn');
                }
                else {
                    io.to(socketId).emit('waitingForFirstPlayerToStart', currentJoins[0]);
                }
            }
            else {
                io.to(socketId).emit('morePlayersNeeded', 5 - currentJoins.length);
            }
        }
        else if (isGameFull) {
            io.to(socketId).emit('tooManyPlayers');
        }
        else {
            io.to(socketId).emit('inviteToJoinGame');
        }
    }

    const emitGameStateToReturningPlayer = (name, socketId, gameId) => {
        const isPlayersTurn = rooms[gameId]['game']['turn'] === name;
        const proposalSubmitted = rooms[gameId]['game']['playersOnCurrentMission'].length > 0;
        
        //player needs to submit proposal
        if (!proposalSubmitted) {
            isPlayersTurn ? io.to(socketId).emit('turn') : io.to(socketId).emit('notTurn', rooms[gameId]['game']['turn']);
        }
        else {
            const yeas =  rooms[gameId]['game']['vote']['yeas'];
            const nays = rooms[gameId]['game']['vote']['nays'];
            
            const allPlayersHaveVoted = yeas.length + nays.length === rooms[gameId]['game']['numberOfPlayers'];
            
            if (!allPlayersHaveVoted) {
                if(yeas.includes(name) || nays.includes(name)){
                    io.to(socketId).emit('waitingOnVotes');
                } 
                //player needs to vote on the submitted proposal
                else {
                    const playersOnCurrentMission = rooms[gameId]['game']['playersOnCurrentMission'];
                    const labels = getMissionLabels(gameId, playersOnCurrentMission);
                    // const proposalMessage = playerProposal(rooms[gameId]['game']['turn'], playersOnCurrentMission);
                    io.to(socketId).emit('voteLabels', labels, null);
                }
            }
            else {
                const playerIsOnMission = rooms[gameId]['game']['playersOnCurrentMission'].includes(name);
                const playerHasSubmitted = Object.keys(rooms[gameId]['game']['submissions']).includes(name);
                
                //player needs to submit mission card
                if(playerIsOnMission && !playerHasSubmitted){
                    io.to(socketId).emit('roundModal', rooms[gameId]['game']['missionCards'][name]);
                }
            }
        }
    }
}