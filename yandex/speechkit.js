const fetch = require('node-fetch');
const fs = require('fs');
const { URLSearchParams } = require('url');
const request = require('request-promise');

exports.synthesize = async function (text, YA_TOKEN, FOLDER_ID) {
  const params = new URLSearchParams();

  params.append('text', text);
  params.append('emotion', 'good');
  params.append('lang', 'en-US');
  params.append('folderId', FOLDER_ID);
  params.append('speed', '1.0');
  params.append('format', 'oggopus');

  return new Promise(async (resolve, reject) => {
    async function sintezSpeech(YA_TOKEN, params) {
      fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
        method: 'post',
        body: params,
        headers: {
          'Authorization': 'Bearer ' + YA_TOKEN,
        },
      }).then((res) => {
        console.log(`Yandex API response status: ${res.status}`);
        if (res.status === 200) {
          const writeStream = fs.createWriteStream('./speech.ogg');
          res.body.pipe(writeStream);
          writeStream.on('finish', function () {
            console.log('file downloaded');
            resolve('resolved');
          });
        } else {
          console.log(res);
          reject(new Error("Failed to call yandex speech API"));
        }
      }).catch(err => {
        console.error(err);
        reject(new Error("Failed to call yandex speech API"));
      });
    }
    await sintezSpeech(YA_TOKEN, params);
  });
}

exports.recognize = async function (body, YA_TOKEN, FOLDER_ID) {
  try {
    const response = await request.post({
      url: `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?topic=general&lang=en-US&folderId=${FOLDER_ID}`,
      headers: {
        'Authorization': 'Bearer ' + YA_TOKEN,
      },
      body
    });
    return JSON.parse(response).result;
  } catch (e) {
    console.error(e);
  }
}