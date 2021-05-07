const express = require('express');
const genTemplate = require('../public/genTemplate');

const homeRouter = express.Router();

homeRouter.route('/')

.get(async (req, res, next) => {
    try{
        const home = await genTemplate();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end(home);
    } catch(error) {
        next(error);
    }
});

module.exports = homeRouter;