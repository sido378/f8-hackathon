const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const FBMsgrWebhookhelper = require('@fb-msgr/webhook-express-helper');

const fbApiClient = require('./fb-api-client.js');
const helper = require('./helper.js');
const facebookQueue = require('./message-queue.js');

const MESSENGER_APP_SECRET = process.env.MESSENGER_APP_SECRET;
const MESSENGER_VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;


if (!MESSENGER_APP_SECRET || !MESSENGER_VERIFY_TOKEN) {
   console.error(chalk.red('Missing config values for messenger'));
   process.exit(1);
 }

const fbMsgrWebhookhelper = new FBMsgrWebhookhelper(
  process.env.MESSENGER_APP_SECRET,
  process.env.MESSENGER_VERIFY_TOKEN
);

const SERVER_URL = process.env.SERVER_URL;

if (!SERVER_URL) {
  console.error(chalk.red('Missing server URL'));
  process.exit(1);
}

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

if (!FIREBASE_DATABASE_URL) {
  console.error(chalk.red('Missing Firebase Config Values'));
  process.exit(1);
}

// firebase
admin.initializeApp({
  credential: admin.credential.cert('config/serviceAccountKey.json'),
  databaseURL: FIREBASE_DATABASE_URL,
}, 'voiceBotFacebookBot');

// admin.database.enableLogging(true);
let database = admin.database();

fbApiClient.setMessengerProfile({
  whitelisted_domains: [SERVER_URL],
}).then((_) => fbApiClient.setMessengerProfile(
    {
      get_started: {
        payload: 'getStarted',
      },
      persistent_menu: [
        {
          locale: 'default',
          composer_input_disabled: false,
          call_to_actions: [
            {
              type: 'WEB_URL',
              title: 'Submit anonymous post',
              url: `${SERVER_URL}/facebook/`,
              webview_height_ratio: 'tall',
              messenger_extensions: true,
            },
            {
              type: 'POSTBACK',
              title: 'Rules',
              payload: 'getRules',
            },
            {
              type: 'POSTBACK',
              title: 'Help',
              payload: 'getHelp',
            },
          ],
        },
      ],
    }
  )
).catch((error) => {
  console.warn(chalk.red('Failed setting Messenger Profile:'), error);
});

const app = express();

app.use(
  '/webhook',
  bodyParser.json({verify: fbMsgrWebhookhelper.verifyWebhookRequest})
);

app.get('/webhook', (req, res) => {
  return fbMsgrWebhookhelper.verifyWebhookSetup(req, res);
});

app.post('/webhook', (req, res) => {
  fbMsgrWebhookhelper.handleWebhookEvent(req, res, (messagingEvent) => {
    database.ref('facebook/queue/tasks').push({
      messagingEvent,
      _state: 'incomingTask_start',
    });
  });
});

app.use('/post', bodyParser.json());

app.post('/post', (req, res) => {
  console.log('req.body', req.body)
  const {authorId, headline, body} = req.body;

  fbApiClient.getUserProfile(authorId).then((profile) => {
    console.log('got profile?', profile)
    return database.ref('/posts/submitted').push({
      timestamp: new Date().getTime(),
      name: `${profile.first_name} ${profile.last_name}`,
      profile_pic: profile.profile_pic,
      ...req.body
    })
  }).then((newPostRef) => {
    return database.ref('facebook/queue/tasks').push({
      psid: authorId,
      messages: [
        helper.buttonMessage(
          `Thanks for your post. It is in review now.\n` + 
          `Be assured our community is here to support you.\n` + 
          `Our team will have a look at your post and let you know when ` +
          `it is posted.`,
          [
            {
              type: 'POSTBACK',
              title: 'Delete Post',
              payload: `delete_${newPostRef.key}`,
            },
            {
              type: 'POSTBACK',
              title: 'Help',
              payload: 'getHelp',
            },
          ]
        ),
      ],
      _state: 'replyTask_start',
    });
  }).then(() => {
    res.status(200).send('');
  }).catch((error) => {
    res.status(500).send('');
  });
})

// app.use('/', express.static(__dirname + '/frontend/www/'));

app.use((req, res, next) => {
  let referer = req.headers.referer;
  if (referer && referer.includes('facebook.com')) {
    res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
  } else if (referer && referer.includes('messenger.com')) {
    res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
  }
  next();
}).use('/', express.static(__dirname + '/frontend/www/'));

module.exports = app;
