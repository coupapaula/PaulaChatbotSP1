const express = require('express');
const application = express();
const bodyParser = require('body-parser')
const Utils = require('./modules/Utils');
const log = require('cf-nodejs-logging-support');
const moment = require('moment');
const req = require('request');

var port = process.env.PORT || 5000;

application.use(bodyParser.json())
application.use(express.urlencoded({ extended: true }));

application.get( '/', (req, res) => res.send ('Hello World !!'));
application.listen(port, () => {
    console.log('Server is running on port 5000')
}
)