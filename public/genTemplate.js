const pug = require('pug');
const {activeIds} = require('../server/activeRooms');
const idGen = require('../server/idGen');

const genTemplate = async () => {
    try{
        const newId = await idGen(activeIds);
        const compile = pug.compileFile(__dirname + '/homeTemplate.pug');
        
        if (newId) {
            const homeHtml = compile({gameId: newId});
            return homeHtml;
        } else {
            const homeHtml = compile({gameId: 'Enter a game ID'});
            return homeHtml;
        }
    } catch {
        console.log('GENTEMP 9: error');
    }
}

module.exports = genTemplate;