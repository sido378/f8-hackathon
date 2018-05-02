const chalk = require('chalk');
const FBMsgrApiClient = require('@fb-msgr/messenger-api');

// messenger-bot initialization
const MESSENGER_PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

if (!MESSENGER_PAGE_ACCESS_TOKEN) {
  console.error(chalk.red('Missing config values for messenger'));
  process.exit(1);
}

const fbMsgrApiClient =
  new FBMsgrApiClient(process.env.MESSENGER_PAGE_ACCESS_TOKEN);

module.exports = fbMsgrApiClient;
