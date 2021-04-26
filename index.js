require('dotenv').config();
const axios = require('axios').default;
const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = process.env.BOT_TOKEN;
const FOLDER_ID = process.env.FOLDER_ID;
const YANDEX_OAUTH_TOKEN = process.env.YANDEX_OAUTH_TOKEN;
const { URLSearchParams } = require('url');
const fs = require('fs');
const pool = require("./db")
let options;
let iam;

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

// _ _  _ _ ___ _ ____ _    _ ___  ____ ___ _ ____ _  _ 
// | |\ | |  |  | |__| |    |   /  |__|  |  | |  | |\ | 
// | | \| |  |  | |  | |___ |  /__ |  |  |  | |__| | \| 

initDb();
generateIAMtoken();
setInterval(isTokenValid, 360000);
const bot = new TelegramBot(BOT_TOKEN, options);


// ___ ____ _    ____ ____ ____ ____ _  _    ___  ____ ___    _    _ ____ ___ ____ _  _ ____ ____ ____ 
//  |  |___ |    |___ | __ |__/ |__| |\/|    |__] |  |  |     |    | [__   |  |___ |\ | |___ |__/ [__  
//  |  |___ |___ |___ |__] |  \ |  | |  |    |__] |__|  |     |___ | ___]  |  |___ | \| |___ |  \ ___] 

bot.on('message', (msg) => {
  console.log('Recived msg id: ', msg);

  if (msg.text.toLowerCase().indexOf('start') !== -1) {
    bot.sendMessage(msg.chat.id, "Hello dear user");
  } else if (msg.text.toLowerCase().indexOf('listall') !== -1) {
    listCurrentUserTasks(msg);
  } else if (msg.text) {
    convertTextToVoice(msg, msg.text);
  } else if (msg.voice) {
    convertVoiceToText(msg, msg.voice.file_id);
  }
});

// _  _ _ ____ ____ ____ _    _    ____ _  _ ____ ____ _  _ ____ 
// |\/| | [__  |    |___ |    |    |__| |\ | |___ |  | |  | [__  
// |  | | ___] |___ |___ |___ |___ |  | | \| |___ |__| |__| ___] 

async function convertTextToVoice(msg, text) {

  if (iam) {

    try {

      const start = Date.now();
      const params = new URLSearchParams();

      params.append('text', text);
      params.append('emotion', 'good');
      params.append('lang', 'en-US');
      params.append('folderId', FOLDER_ID);

      const { data, config } = await axios.post('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
        params.toString(),
        {
          headers: {
            'Authorization': `Bearer ${iam.iamToken}`,
          },
          responseType: 'stream',
        }
      );

      console.log('INFO req config: ', config);

      const duration = Date.now() - start;
      console.log(`INFO: executed convertVoiceToText() in ${duration} milliseconds`);

      const writeStream = fs.createWriteStream('./text_to_voice.ogg');
      data.pipe(writeStream);

      writeStream.on('finish', function () {
        console.log('INFO: Downloaded speech.ogg from yandex');
        bot.sendAudio(msg.chat.id, 'text_to_voice.ogg');
      });

    } catch (error) {
      console.error(error);
      bot.sendMessage(msg.chat.id, 'Something went wrong, please try again later.');
    }

  } else {
    bot.sendMessage(msg.chat.id, 'Have no valid NLP service token, please try again later.');
  }
}

async function convertVoiceToText(msg, file_id) {
  if (iam) {

    try {

      const start = Date.now();

      const fileInfo = await bot.getFile(file_id);
      console.log('api telegram getFile response', fileInfo);

      const telegramResponse = await axios.get(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`,
        {
          responseType: 'stream',
        });

      const yandexResponse = await axios.post(`https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?topic=general&lang=en-US&folderId=${FOLDER_ID}`,
        telegramResponse.data,
        {
          headers: {
            'Authorization': `Bearer ${iam.iamToken}`,
            'Content-Type': 'multipart/form-data'
          },
        });

      console.log('yandexResponse ', yandexResponse.data);

      result = yandexResponse.data.result;

      const duration = Date.now() - start;
      console.log(`executed convertVoiceToText() in ${duration} milliseconds`);

      if (isNotTaskRelatedMsg(result.toLowerCase(), msg)) bot.sendMessage(msg.chat.id, result ? result : 'recived empty msg');

    } catch (error) {
      console.error(error);
      bot.sendMessage(msg.chat.id, 'Something went wrong, please try again later.');
    }

  } else {
    bot.sendMessage(msg.chat.id, 'Have no valid NLP service token, please try again later.');
  }
}

function isTokenValid() {
  if (!iam) {
    generateIAMtoken();
  } else {
    const currentTime = new Date(Date.now()).toISOString();
    let diff = new Date(new Date(iam.expiresAt) - new Date(currentTime)).getHours();

    console.log('iam: ', iam)
    console.log(`Cheking if token is valid, currentTime: ${currentTime} iam.expiresAt: ${iam.expiresAt}, diff: ${diff}`);

    if (diff < 3) {
      // NOTE: The IAM token lifetime doesn't exceed 12 hours
      // Request new token every ~ 10 hours
      iam = generateIAMtoken();
    }
  }
}

async function generateIAMtoken() {
  try {

    const { data } = await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens',
      {
        'yandexPassportOauthToken': YANDEX_OAUTH_TOKEN,
      });

    iam = data;
  } catch (error) {
    console.error(error);
  }
}

function isNotTaskRelatedMsg(text, msg) {

  const regexNew = /new/;
  const regexUpdate = /update/;
  const regexDelete = /delete/;

  if (null !== text.match(regexNew)) {
    console.log(text.match(regexNew));
    let formatedText = text.replace('create', '').replace('new', '').replace('task', '');
    createNew(msg, formatedText);
    return false;
  } else if (null !== text.match(regexUpdate)) {
    console.log(text.match(regexUpdate));
    return false;
  } else if (null !== text.match(regexDelete)) {
    console.log(text.match(regexDelete));
    return false;
  } else {
    return true;
  }
}

async function initDb() {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS nlp_todo_bot');
    await pool.query('CREATE TABLE IF NOT EXISTS nlp_todo_bot.todo(taskid INT GENERATED BY DEFAULT AS IDENTITY, userid BIGINT NOT NULL, username text NOT NULL, todotask text NOT NULL)');
    console.log('INFO: successfully initialized database')
  } catch (error) {
    console.log(error);
  }
}

async function listCurrentUserTasks(msg) {
  const res = await pool.getAllUserTasks(msg.from.id);
  bot.sendMessage(msg.chat.id, res ? res : 'Something went wrong');
}

async function createNew(msg, formatedText) {
  const res = await pool.createNewTask(msg.from.id, msg.from.username, formatedText.trim());
  bot.sendMessage(msg.chat.id, res ? res : 'Something went wrong');
}