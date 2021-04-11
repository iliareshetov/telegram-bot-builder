const { synthesize } = require('./yandex/speechkit');
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.BOT_TOKEN;
const YA_TOKEN = process.env.IAM_TOKEN;
const FOLDER_ID = process.env.FOLDER_ID;
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

if (process.env.NODE_ENV !== 'development') {
  console.log('Running in production mode');
  // Heroku routes from port :443 to $PORT
  // Add URL of your app to env variable or enable Dyno Metadata
  // to get this automatically
  // See: https://devcenter.heroku.com/articles/dyno-metadata
  const url = process.env.APP_URL || 'https://<app-name>.herokuapp.com:443';
  // This informs the Telegram servers of the new webhook.
  // Note: we do not need to pass in the cert, as it already provided
  bot.setWebHook(`${url}/bot${TOKEN}`);
}

const bot = new TelegramBot(TOKEN, options);

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  console.log(`Recived msg id: ${chatId}`);
  console.log(msg);

  if (msg.text) {
    console.log("converting text to voice");
    convertTextToVoice(chatId, msg.text).catch(err => {
      console.error(err);
    });
  }

  if (msg.voice) {
    console.log("converting voice to text");
  }

});

async function convertTextToVoice(chatId, text) {

  const result = await synthesize(text, YA_TOKEN, FOLDER_ID);

  console.log(`Status: ${result}`);

  bot.sendAudio(chatId, 'speech.ogg');

}

