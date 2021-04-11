const fetch = require('node-fetch');

// exports.synthesize = (text, YA_TOKEN, FOLDER_ID) => {
//   console.log(`chatId: ${chatId}`);


//   fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
//     method: 'post',
//     body: params,
//     headers: {
//       'Authorization': 'Bearer ' + YA_TOKEN,
//     },
//   }).then(res => {
//     console.log(`Yandex API response status: ${res.status}`);
//     if (res.status === 200) {

//       const writeStream = fs.createWriteStream('../octocat.ogg');
//       res.body.pipe(writeStream);

//       writeStream.on('error', function (err) {
//         console.log(err);
//       });

//     } else {
//       bot.sendMessage(chatId, "Failed to call yandex speech API");
//       console.log(res);
//     }
//   }).catch(err => {
//     console.error(err);
//     bot.sendMessage(chatId, "Failed to call yandex speech API");
//   });
// };

module.exports.synthesize = async function (text, YA_TOKEN, FOLDER_ID) {
  const { URLSearchParams } = require('url');
  const fs = require('fs');
  const params = new URLSearchParams();

  params.append('text', text);
  params.append('emotion', 'good');
  params.append('lang', 'en-US');
  params.append('folderId', FOLDER_ID);
  params.append('speed', '1.0');
  params.append('format', 'oggopus');

  return new Promise(async (resolve) => {
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

        }
      }).catch(err => {
        console.error(err);
      });
    }
    await sintezSpeech(YA_TOKEN, params);
  });
}
