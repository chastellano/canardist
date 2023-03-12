const newGame = `<p class="text-center text-white scrollPush bg-primary bold">NEW GAME</p>`;

const redPlayers = reds => `<p class="text-center text-white scrollPush bg-danger bold">THERE ARE ${reds} RED PLAYERS. WHO COULD THEY BE?</p>`;

const playerProposal = (name, proposedPlayers) => `<p class="scrollPush text-center bold enterLeave">${name} proposes ${proposedPlayers.join(', ')}</p>`;

const playerVote = (color, name, vote) => `<p class="${color} bold text-center scrollPush">${name} votes ${vote}</p>`;;

const proposalDecision = (name, decision) => `<p class="text-center scrollPush enterLeave bold">${name}'s proposal was ${decision}!</p>`;

const teamWinsRound = (color, team, currentRound) => `<p class="text-center text-white ${color} scrollPush bold">${team} TEAM WINS ROUND ${currentRound}!</p>`;

const teamWinsGame = (background, team) => `<p class="text-center text-white scrollPush ${background} bold">${team} TEAM WINS THE GAME!</p>`;

const specialRound = `<p class="scrollPush text-center bold enterLeave"><span class="text-danger">WARNING: </span>Red Team needs MORE THAN ONE red card to win Round 4.</p>`;

const playerChat = (name, message) => `<p class="chat"> <span class="bold mr-1">${name}:</span> ${message}<p>`;

const newPlayerJoined = name => `<p id="${name}Join" class="scrollPush text-center enterLeave">* * * ${name} joined the room * * *</p>`;

const resetGame = name => `<p class="scrollPush text-center bold enterLeave">${name} reset the game</p>`;

module.exports = {
    newGame,
    redPlayers,
    playerProposal,
    playerVote,
    proposalDecision,
    teamWinsRound,
    teamWinsGame,
    specialRound,
    playerChat,
    newPlayerJoined,
    resetGame
}