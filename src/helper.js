const security = require('./util/security.js');

const BOT_URL = process.env.BOT_URL;
const SERVER_URL = process.env.SERVER_URL;

const buttonTemplate = () => {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: '',
        buttons: [],
      },
    },
  };
};

const genericTemplate = () => {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [],
      },
    },
  };
};

module.exports = {
  genericMessage: (elements) => {
   let message = genericTemplate();
    message.attachment.payload.elements = elements;
    return message;
  },
  buttonMessage: (text, buttons) => {
    let message = buttonTemplate();
    message.attachment.payload.text = text;
    message.attachment.payload.buttons = buttons.filter((x) => x);

    return message;
  },
  textMessage: (text) => {
    return {text};
  },
  quickRepliesMessage: (text, quickReplies) => {
    return {
      text, 
      quick_replies: quickReplies,
    }
  }
};
