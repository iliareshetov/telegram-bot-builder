require('dotenv').config();
const fetch = require('node-fetch');
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
  // bot.sendMessage(chatId, msg.text);
  bot.sendVoice(chatId, 'octocat.ogg')

const api_key = 't1.9euelZqLzp7JlZPHmo-eyMzKkJ6Xze3rnpWazMfPj4rJyceNlpWdkpDKyZnl9PdHUxZ--e8_Bw683fT3BwIUfvnvPwcOvA.ToaBZFTbJjnvHO62LnzxLjplhdqZGoahnmdFOkDy4HJg0_KhB6J8D-k_f0fRjShP5SwhnWbBA0VZ4rZBGxEHBA';

const { URLSearchParams } = require('url');
const fs = require('fs');

const params = new URLSearchParams();
// const text = 'я хочу питсу'

params.append('text', msg.text);
params.append('voice', 'zahar');
params.append('emotion', 'good');
params.append('lang', 'ru-RU');
params.append('folderId', 'b1g2ft32qkv20gucaq7v');
params.append('speed', '1.0');
params.append('format', 'oggopus');

fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
        method: 'post',        
        body: params,
        headers: { 
            'Authorization': 'Bearer ' + api_key,
        },
    })
    .then(res => {
        console.log(res);
        // return res.json();
        const dest = fs.createWriteStream('./octocat.ogg');
        res.body.pipe(dest);
    })
    .catch(err => console.error(err));
  });