const apiai = require('apiai');
// для каждого пользователя будем использовать уникальный идентификатор сессии, но из-за того, что нам лень поднимать дб, мы будем его генерировать из 36 битного ключа, заменяя последние символы на id пользователя
// не делайте так
const uniqid = 'e4278f61-9437-4dff-a24b-aaaaaaaaaaaa';
const app = apiai(‘<...>’);
module.exports = (q, uid) => {
  // городим свой промис, так как библиотека стремная
  return new Promise((resolve, reject) => {
    uid = uid + ''
    // don’t touch, magic
    const cuniqid = uniqid.slice(0, uniqid.length - uid.length) + uid
    // запрос
    const request = app.textRequest(q, {
      sessionId: uniqid
    })
    // удача!
    request.on('response', (response) => {
      resolve(response)
    })
    // нееееееет!
    request.on('error', (error) => {
      reject(error);
    })
    // не знаю зачем, но надо
    request.end();
  })
}