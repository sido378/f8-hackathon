const dotenv = require('dotenv');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const admin = require('firebase-admin');

dotenv.load();

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

if (!FIREBASE_DATABASE_URL) {
  console.error(chalk.red('Missing Firebase Config Values'));
  process.exit(1);
}

// firebase
admin.initializeApp({
  credential: admin.credential.cert('config/serviceAccountKey.json'),
  databaseURL: FIREBASE_DATABASE_URL,
});

const bot = require('./bot.js');

const SERVER_URL = process.env.SERVER_URL;

const PORT = process.env.PORT || 5000;

if (!PORT) {
  console.error(chalk.red('Missing server port'));
  process.exit(1);
}

if (!SERVER_URL) {
  console.error(chalk.red('Missing server URL'));
  process.exit(1);
}

// initializing express app
let app = express();
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(express.static('src/public'));

app.use('/facebook/', bot);

const server = http.createServer(app).listen(PORT);
console.log(`Bot server running at port ${PORT}.`);

module.exports = {
  shutdown: () => {
    return new Promise((resolve, reject) => {
      server.close(() => {
        resolve();
      });
    });
  },
};
