const vk = require('api.vk.com')
const request = require('request-promise')
const Bot = require('node-vk-bot-api')

const asr = require('./asr')
const assistent = require('./assistent')
const token = require('./token');

// оборачиваем в промис старенький модуль для работы с api
const api = (method, options) => {
  return new Promise((resolve, reject) => {
    vk(method, options, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

// создаем экземпляр бота
const bot = new Bot({ token })

// вешаем событие на входящие сообщение
bot.on(async (object) => {
  // для простоты создадим один catcher ошибок, и при появлении онных будем отвечать пользователю о неудаче
  try {
    //асинхронно помечаем прочитанность и устанавливаем статус печатанья
    api('messages.setActivity', { access_token: token, type: 'typing', user_id: object.user_id })
    api('messages.markAsRead', { access_token: token, message_ids: object.message_id })
    
//переменная, в которую попадет uri аудиосообщения
    let uri

    // проверяем наличие прикрепленных сущностей 
    if (object.attachments.length != 0) {
      // получаем подробную информацию о сообщении
      const [msg] = (await api('messages.getById', { access_token: token, message_ids: object.message_id, v: 5.67 })).items
      // проверяем, прикреплена ли вообще аудио запись
      if (msg.attachments[0].type != 'audio' || msg.attachments[0].type != 'doc' || msg.attachments[0].doc.type != 5) {
        uri = null
      }
      // выковырываем uri
      try {
        if (msg.attachments[0].type === 'doc') uri = msg.attachments[0].doc.preview.audio_msg.link_mp3
        else if (msg.attachments[0].type === 'audio') uri = msg.attachments[0].audio.url
      } catch (e) {
        uri = null
      }

      // обрабатываем пересланное голосовое сообщение
    } else if (object.forward != null) {
      try {
        uri = object.forward.attachments[0].doc.preview.audio_msg.link_mp3
      }
      catch (e) {
        uri = null
      }
    } else {
      uri = null
    }
    // ошибка авторских прав на аудиозапись
    if (uri === '') {
      throw ('Не могу послушать это аудио')
    }
    if (uri == null) {
      // если есть текстовое cообщение, отправляем в dialogflow
      if (object.body != '') {
        const { speech } = (await assistent(object.body, object.user_id)).result.fulfillment
        object.reply(speech)
        return
      }
      else {
        throw ('Мы не нашли голосовых сообщений. Отправь нам свой голос или перешли его')
      }
    }
    // получаем буфер с аудио
    const audio = await request.get({ uri, encoding: null })
    let phrase
    try {
      phrase = await asr(audio)
    }
    catch (e) {
      console.error('asr error', e)
      throw ('сбой в распознавании речи')
    }
    // отправляем результат
    if (phrase != null) {
      object.reply(phrase, (err, mesid) => { });
    } else {
      throw ('Не удалось распознать')
    }
  } catch (error) {
    // логируем ошибку и отвечаем пользователю
    console.error(error)
    object.reply('string' == typeof error ? error : 'Произошла непонятная ошибка. Я не знаю, что делать!')
  }
})

// не забываем про главное, включаем long pong.
bot.listen()