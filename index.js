const { synthesize, recognize } = require('./yandex/speechkit');
require('dotenv').config();
const request = require('request');
const { createDatabase } = require('./db/todo');

const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = process.env.BOT_TOKEN;
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
  bot.setWebHook(`${url}/bot${BOT_TOKEN}`);
}

const bot = new TelegramBot(BOT_TOKEN, options);
createDatabase();

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text) {
    console.log(`Recived msg id: ${chatId}`);
    console.log(msg);
    console.log("converting text to voice");
    convertTextToVoice(chatId, msg.text).catch(err => {
      console.error(err);
      bot.sendMessage(chatId, "Failed to call yandex speech API");
    });
  }



});

bot.on('voice', (msg) => {
  const chatId = msg.chat.id;

  console.log(`Recived msg id: ${chatId}`);
  console.log(msg);

  bot.getFile(msg.voice.file_id).then(data => {
    convertVoiceToText(chatId, data).catch(err => {
      console.error(err);
      bot.sendMessage(chatId, "Failed to call process voice msg");
    });
  }).catch(err => {
    console.error(err);
    bot.sendMessage(chatId, "Failed to call process voice msg");
  });

});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Welcome ${msg.chat.first_name}`);
});

async function convertTextToVoice(chatId, text) {
  await synthesize(text, YA_TOKEN, FOLDER_ID);
  bot.sendAudio(chatId, 'speech.ogg');
}

async function convertVoiceToText(chatId, data) {
  try {
    let uri = `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.file_path}`;
    voiceMessage = await request.get({ uri, encoding: null });
    text = await recognize(voiceMessage, YA_TOKEN, FOLDER_ID);
    bot.sendMessage(chatId, text);
  } catch (e) {
    console.error(e);
  }
}

