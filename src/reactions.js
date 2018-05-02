const chalk = require('chalk');
const admin = require('firebase-admin');
const _ = require('lodash/fp');

const helper = require('./helper.js');

const database = admin.database();

const SERVER_URL = process.env.SERVER_URL;

if (!SERVER_URL) {
  console.error(chalk.red('Missing server URL'));
  process.exit(1);
}

const sendHelp = (user) => {
  return Promise.resolve([
    helper.buttonMessage(
      `We understand group members sometimes have a need for privacy, so ` + 
      `I’m here to help you post anonymously.\n` + 
      `Some guidelines before you post:\n` +
      `1. Your post must have a reason to be anonymous.\n` + 
      `2. Make sure your post is in line with the rules of the group.\n` +
      `3. The post will pass a review process via our admins before being posted in the group.`,
      [
        {
          type: 'WEB_URL',
          title: 'Post anonymously',
          url: `${SERVER_URL}/facebook/`,
          webview_height_ratio: 'tall',
          messenger_extensions: true,
        }
      ]
    ),
  ]);
};

const sendGreeting = (user) => {
  return Promise.resolve([
    helper.quickRepliesMessage(
      `Hi, I’m voice 😊\n` + 
      `I’ll help give you a voice by posting anonymously to F8 Hackathon Anon`,
      [
        {
          "content_type":"text",
          "title":"Sounds good!",
          "payload":"getHelp",
        }
      ]
    ),
  ]);
};

const sendRules = (user) => {
  return Promise.resolve([
    helper.buttonMessage(
      `Some guidelines before you post:\n` +
      `1. Your post must have a reason to be anonymous.\n` + 
      `2. Make sure your post is in line with the rules of the group.\n` +
      `3. The post will pass a review process via our admins before being posted in the group.`,
      [
        {
          type: 'WEB_URL',
          title: 'Post anonymously',
          url: `${SERVER_URL}/facebook/`,
          webview_height_ratio: 'tall',
          messenger_extensions: true,
        },
      ]
    ),
  ]);
};

const sendFallbackMessage = (user) => {
  return Promise.resolve([
    helper.buttonMessage(
      `Sorry, I didn't get that. Please use the menu and buttons :) `,
      [
        {
          type: 'WEB_URL',
          title: 'Post anonymously',
          url: `${SERVER_URL}/facebook/`,
          webview_height_ratio: 'tall',
          messenger_extensions: true,
        },
        {
          type: 'POSTBACK',
          title: 'Rules',
          payload: 'getRules',
        }
      ]
    ),
  ]);
};

const messageDeleted = (user, post) => {
  return database.ref(`/posts/submitted/${post.id}`).set(null)
  .then(() => {
    return Promise.resolve([
      helper.textMessage(
        `Your submitted post has been deleted. You can always submit a new one!`
      )
    ])
  })
}

module.exports = {
  sendHelp,
  sendGreeting,
  sendRules,
  sendFallbackMessage,
  messageDeleted
};
