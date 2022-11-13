const express = require('express');
const listeners = require('./server/listeners');
const socket = require('socket.io');
const homeRouter = require('./server/homeRouter');

const app = express();
const server = app.listen(process.env.PORT || 3000, function(){
    console.log('listening on port 3000');
});

app.all('*', (req, res, next) => {
    if (req.header('host') == 'localhost:3000') {
        return next();
    }
    if (req.header('x-forwarded-proto') == 'https' || req.secure) {
        return next();
    } else {
        console.log(`Redirecting to: https://${req.header('host')}${req.url}`);
        res.redirect(`https://${req.header('host')}${req.url}`);
    }
})


app.use('/', homeRouter);
app.use(express.static('./public'));
app.use('/:gameId', (express.static('./public/game.html')));

const io = socket(server);

listeners(io);