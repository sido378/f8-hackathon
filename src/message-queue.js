const chalk = require('chalk');
const admin = require('firebase-admin');
const Queue = require('firebase-queue');
const _ = require('lodash');

const incomingMessageWorker = require('./incoming-message-worker.js');
const outgoingMessageWorker = require('./outgoing-message-worker.js');

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

if (!FIREBASE_DATABASE_URL) {
  console.error(chalk.red('Missing Firebase Config Values'));
  process.exit(1);
}

// firebase
admin.initializeApp({
  credential: admin.credential.cert('config/serviceAccountKey.json'),
  databaseURL: FIREBASE_DATABASE_URL,
}, 'voiceBotFacebookQueue');

const database = admin.database();
const queueRef = database.ref('facebook/queue');

const specsRef = queueRef.child('specs');

const specs = {
  incomingSpec: {
    start_state: 'incomingTask_start',
    in_progress_state: 'incomingTask_in_progress',
    error_state: 'incomingTask_error',
    retries: 0,
    timeout: 10000,
  },
  replySpec: {
    start_state: 'replyTask_start',
    in_progress_state: 'replyTask_in_progress',
    error_state: 'replyTask_error',
    retries: 0,
    timeout: 10000,
  },
  broadcastSpec: {
    start_state: 'broadcastTask_start',
    in_progress_state: 'broadcastTask_in_progress',
    error_state: 'broadcastTask_error',
    retries: 0,
    timeout: 10000,
  },
};

_.forIn(specs, (spec, specName) => {
  specsRef.child(specName).set(spec);
});

const replyTaskQueue = new Queue(
  queueRef,
  {numWorkers: 10, specId: 'replySpec'},
  outgoingMessageWorker
);

const broadcastTaskQueue = new Queue(
  queueRef,
  {numWorkers: 10, specId: 'broadcastSpec'},
  outgoingMessageWorker
);

const incomingTaskQueue = new Queue(
  queueRef,
  {numWorkers: 10, specId: 'incomingSpec'},
  incomingMessageWorker
);

module.exports = {
  shutdown: () => {
    return Promise.all([
      replyTaskQueue.shutdown(),
      broadcastTaskQueue.shutdown(),
      incomingTaskQueue.shutdown(),
    ]).then(() => {
      console.log('Finished Facebook message queues shutdown');
    });
  },
};
