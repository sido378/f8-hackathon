const chalk = require('chalk');
const admin = require('firebase-admin');

const fbApiClient = require('./fb-api-client.js');

const database = admin.database();

const outgoingMessageWorker = (data, progress, resolve, reject) => {
  let promise = Promise.resolve();
  let notificationType = 'REGULAR';
  data.messages.forEach((message) => {
    promise = promise.then(() => {
      return fbApiClient.sendMessage(data.psid, message, Object.assign({notificationType}, data.messageOpts))
      .then((body) => {
        // set notificationType to NO_PUSH after first message
        if (!notificationType) notificationType = 'NO_PUSH';
      });
    });
  });
  promise
  .then((success) => {
    resolve();
  })
  .catch((error) => {
    console.log('Failed sending FB message:');
    console.dir(error, {depth: null});

    if (error.code == 200) {
      cleanupUser(data.psid).then((_) => resolve(error.message));
    } else {
      reject(JSON.stringify(error.message));
    }
  });
};

const cleanupUser = (psid) => {
  let updates = {};
  updates[`facebook/users/${psid}`] = null;
  return database.ref().update(updates);
};

module.exports = outgoingMessageWorker;
