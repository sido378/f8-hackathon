const crypto = require('crypto');

const WEB_SECRET = process.env.WEB_SECRET;

module.exports = {
  encrypt: (text) => {
    const cipher = crypto.createCipher('aes-256-ctr', WEB_SECRET);
    let crypted = cipher.update(text.toString(), 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },
  decrypt: (text) => {
    const decipher = crypto.createDecipher('aes-256-ctr', WEB_SECRET);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  },
};
