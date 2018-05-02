const chalk = require('chalk');

class MessagePipe {
  constructor(intentMappings) {
    this.intentMappings = intentMappings;

    // binding this to all instance methods
    this.enhance = this.enhance.bind(this);
    this.understand = this.understand.bind(this);
    this.enrich = this.enrich.bind(this);
    this.decide = this.decide.bind(this);
  }

  enhance(sender, message) {
    // console.log(chalk.green('Enhancing'), sender, message);

    // create pipedMsg object
    let pipedMsg = {
      sender: sender,
      text: message.text.toLowerCase(),
      confidence: 0,
    };
    return Promise.resolve(pipedMsg);
  }

  understand(pipedMsg) {
    // console.log(chalk.green('Understanding'), pipedMsg);

    let messageText = pipedMsg.text;

    return new Promise((resolve, reject) => {
      // start of request to NLP service

      let intent = null;
      let entities = [];
      // check for matching rules
      if (messageText.includes('/start')) {
        intent = 'getStarted';
      } else if (messageText.includes('help')) {
        intent = 'getHelp';
      } else if (messageText.includes('hi') ||
                 messageText.includes('hey') ||
                 messageText.includes('hello') ||
                 messageText.includes('hallo')) {
        intent = 'getStarted';
      }

      if (intent) {
        // if rule matched add intent && entities
        pipedMsg.intent = intent;
        pipedMsg.entities = entities;
        pipedMsg.confidence = 1;

        resolve(pipedMsg);
      } else {
        reject(pipedMsg);
      }
    });
  }

  enrich(pipedMsg) {
    // console.log(chalk.green('Enriching'), pipedMsg);

    // match intent with action from intentMappings
    pipedMsg.action = this.intentMappings[pipedMsg.intent];

    if (pipedMsg.action) {
      return Promise.resolve(pipedMsg);
    } else {
      console.warn(
        chalk.yellow('No matching action for intent'),
        pipedMsg
      );
      return Promise.reject(pipedMsg);
    }
  }

  decide(pipedMsg) {
    // console.log(chalk.green('Deciding'), pipedMsg);

    // bind sender and entities to action
    const action = pipedMsg.action.bind(
      null,
      pipedMsg.sender,
      ...pipedMsg.entities
    );


    if (pipedMsg.confidence > 0.4) {
      // if confidence is "high"
      // call the action and return the generated replies
      return action()
      .then((replies) => {
        pipedMsg.replies = replies.filter((reply) => reply) || [];
        return pipedMsg;
      });
    } else {
      console.warn(
        chalk.yellow('Not confident enough to execute action'),
        pipedMsg
      );
      return Promise.reject(pipedMsg);
    }
  }
}

module.exports = MessagePipe;
