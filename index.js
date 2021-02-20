require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.BOT_TOKEN;
let options;

if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode');
  options = {
    polling: true
  };
} else {
  options = {
    webHook: {
      // Port to which you should bind is assigned to $PORT variable
      // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
      port: process.env.PORT
      // you do NOT need to set up certificates since Heroku provides
      // the SSL certs already (https://<app-name>.herokuapp.com)
      // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
    }
  };
}

const bot = new TelegramBot(TOKEN, options);

if (process.env.NODE_ENV !== 'development') {
  // Heroku routes from port :443 to $PORT
  // Add URL of your app to env variable or enable Dyno Metadata
  // to get this automatically
  // See: https://devcenter.heroku.com/articles/dyno-metadata
  const url = process.env.APP_URL || 'https://<app-name>.herokuapp.com:443';
  // This informs the Telegram servers of the new webhook.
  // Note: we do not need to pass in the cert, as it already provided
  bot.setWebHook(`${url}/bot${TOKEN}`);
}


bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  console.log(`Recived msg id: ${msg.chat.id}`);
  console.log(msg);

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});