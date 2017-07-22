require('dotenv').config();
module.exports = require('./anticaptcha')(process.env.ANTIGATE_KEY);