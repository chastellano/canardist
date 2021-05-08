const express = require('express');
const fs = require('fs');
const https = require('https');
const listeners = require('./server/listeners');
const socket = require('socket.io');
const homeRouter = require('./server/homeRouter');

const app = express();
const server = app.listen(process.env.PORT || 3000, function(){
    console.log('listening on port 3000');
});

app.set('secPort', 3443);

const options = {
    key: fs.readFileSync(__dirname+'/bin/server.key'),
    cert: fs.readFileSync(__dirname+'/bin/server.cert')
}

const secureServer = https.createServer(options, app);

secureServer.listen(process.env.PORT || app.get('secPort'), () => {
    console.log('Secure server listening on port 3443');
});

app.all('*', (req, res, next) => {
    if (req.secure) {
        return next();
    } else {
        console.log(`Redirecting to: https://${req.hostname}:${app.get('secPort')}${req.url}`);
        res.redirect(`https://${req.hostname}:${app.get('secPort')}${req.url}`);
    }
})


app.use('/', homeRouter);
app.use(express.static('./public'));
app.use('/:gameId', (express.static('./public/game.html')));

const io = socket(secureServer);

listeners(io);