const request = require('request-promise')

const uri = `https://api.wit.ai/speech`
const apikey = '<...>' // получаем ключ доступа на wit.ai

module.exports = async (body) => {
  // отправляем post запрос с буфером аудио
  const response = await request.post({
    uri,
    headers: {
      'Accept': 'audio/x-mpeg-3',
      'Authorization': `Bearer ` + apikey,
      'Content-Type': 'audio/mpeg3',
      'Transfer-Encoding': 'chunked'
    },
    body
  })
  // парсим ответ и отдаем результат расшифровки
  return JSON.parse(response)._text
}