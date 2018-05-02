const chalk = require('chalk');
const fbMsgrIncomingHelper = require('@fb-msgr/incoming-message-helper');
const admin = require('firebase-admin');

const fbApiClient = require('./fb-api-client.js');
const reactions = require('./reactions.js');
const MessagePipe = require('./message-pipe.js');
const security = require('./util/security.js');

const database = admin.database();

const intentMappings = {
  getRules: reactions.sendRules,
  getHelp: reactions.sendHelp,
  getStarted: reactions.sendGreeting,
  deleteMessage: reactions.messageDeleted,
  foo: reactions.sendFallbackMessage,
};

const msgPipe = new MessagePipe(intentMappings);

const messageTasksRef = database.ref('facebook/queue/tasks');
const queueMessages = (psid, messages) => {
  return messageTasksRef.push({
    psid,
    messages,
    _state: 'replyTask_start',
  });
};

// persist facebook user
const persistUser = (psid) => {
  if (!psid) return Promise.reject();
  return Promise.resolve({psid})
  // return database.ref(`facebook/users/${psid}`)
  // .once('value')
  // .then((snapshot) => {
  //   let user = snapshot.val();
  //   if (!user) {
  //     return fbApiClient.getUserProfile(psid).then((profile) => {
  //       profile.notifications = true;
  //       profile.psid = psid;
  //       return database.ref(`facebook/users/${psid}`).set(profile)
  //       .then(() => {
  //         return profile;
  //       });
  //     });
  //   } else {
  //     return user;
  //   }
  // });
};

const handleTextMessage = (payload) => {
  console.log(
    chalk.green('Received message: \n'),
    JSON.stringify(payload, null, 2)
  );

  let psid = payload.sender.id;

  return persistUser(psid).then((user) => {
    return msgPipe.enhance(user, payload.message)
    .then(msgPipe.understand)
    .then(msgPipe.enrich)
    .then(msgPipe.decide)
    .then((pipedMsg) => {
      return queueMessages(pipedMsg.sender.psid, pipedMsg.replies);
    })
    .catch((pipedMsg) => {
      console.warn(
        chalk.yellow('Parsing failed for'),
        pipedMsg
      );

      // TODO: persist messages that failed parsing
      // sending fallback action
      reactions.sendFallbackMessage(user)
      .then((replies) => queueMessages(user.psid, replies));
    });
  });
};

const handleQuickReply = (payload) => {
  console.log(
    chalk.green('Received message: \n'),
    JSON.stringify(payload, null, 2)
  );

  let postback = payload.message.quick_reply.payload;
  let psid = payload.sender.id;
  let intent = null;
  let entities = [];
  let match = null;
  intent = postback;

  return persistUser(psid).then((user) => {
    return msgPipe.enrich({
      sender: user,
      intent,
      entities,
      postback: postback,
      confidence: 1,
    })
    .then((pipedMsg) => msgPipe.decide(pipedMsg))
    .then((pipedMsg) => {
      return queueMessages(pipedMsg.sender.psid, pipedMsg.replies);
    })
    .catch((pipedMsg) => {
      console.warn(chalk.red(`Received unknown postback`), pipedMsg);
    });
  });
};

const handlePostback = (payload) => {
  console.log(
    chalk.green('Received postback: \n'),
    JSON.stringify(payload, null, 2)
  );

  let postback = payload.postback.payload;
  let psid = payload.sender.id;
  let intent = null;
  let entities = [];
  let match = null;

  return persistUser(psid).then((user) => {
    if (match = postback.match(/^delete_(.+)$/)) {
      intent = 'deleteMessage'
      entities.push({id: match[1]})
    } else {
      intent = postback;
    }
    return msgPipe.enrich({
      sender: user,
      intent,
      entities,
      postback: postback,
      confidence: 1,
    })
    .then((pipedMsg) => msgPipe.decide(pipedMsg))
    .then((pipedMsg) => {
      return queueMessages(pipedMsg.sender.psid, pipedMsg.replies);
    })
    .catch((pipedMsg) => {
      console.warn(chalk.red(`Received unknown postback`), pipedMsg);
    });
  });
};

const handleWebPostback = (payload) => {
  console.log(
    chalk.green('Received postback from web: \n'),
    JSON.stringify(payload, null, 2)
  );

  const postback = payload.payload;
  const psid = payload.psid;

  let intent = null;
  let entities = [];
  let match = null;
  return persistUser(psid).then((user) => {
    if (match = postback.match(/^delete_(.+)$/)) {
      console.log("match??", match)
      intent = 'deleteMessage'
      entities.push({id: match[1]})
    } else {
      console.log("match??", postback)
      intent = postback;
    }
    console.log("intent", intent);

    return msgPipe.enrich({
      sender: user,
      intent,
      entities,
      postback: postback,
      confidence: 1,
    })
    .then((pipedMsg) => msgPipe.decide(pipedMsg))
    .then((pipedMsg) => {
      return queueMessages(pipedMsg.sender.psid, pipedMsg.replies);
    })
    .catch((pipedMsg) => {
      console.warn(chalk.red(`Received unknown postback`), pipedMsg);
    });
  });
};

const incomingMessageWorker = (data, progress, resolve, reject) => {
  const messagingEvent = data.messagingEvent;

  let promise;
  if (fbMsgrIncomingHelper.isQuickReply(messagingEvent)) {
    promise = handleQuickReply(messagingEvent)
  } else if (fbMsgrIncomingHelper.isTextMessage(messagingEvent)) {
    promise = handleTextMessage(messagingEvent);
  } else if (fbMsgrIncomingHelper.isPostback(messagingEvent)) {
    promise = handlePostback(messagingEvent);
  } else if (fbMsgrIncomingHelper.isAttachment(messagingEvent)) {
    promise = Promise.resolve();
  } else {
    promise = handleWebPostback(messagingEvent);
  }

  promise
  .then(resolve)
  .catch(reject);
};

module.exports = incomingMessageWorker;
