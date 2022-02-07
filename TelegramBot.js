const TelegramBot = require('node-telegram-bot-api')
const config = require('./config.js')
const Users = require('./dbControllers/usersController')
const Mailboxes = require('./dbControllers/mailboxesController')
const Messages = require('./dbControllers/messagesController')

const token = config.telegramBotToken

const bot = new TelegramBot(token, {polling: true});

const newEmail = async (msg) => {
  try {
    const chatID = msg.chat.id
    const existingBoxes = await Mailboxes.getMailboxesByUser(chatID)
    if(existingBoxes.length >= config.allowedBoxQuantity){
      return bot.sendMessage(chatID, `Максимальное количество email адресов ${config.allowedBoxQuantity}`)
    }
    const newBox = await Mailboxes.addMailbox(chatID)
    let buttons = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{
            text: "+10 минут",
            callback_data: JSON.stringify({type: 'time', time: 10, address: newBox.address})
          }, {text: "+30 минут", callback_data: JSON.stringify({type: 'time', time: 30, address: newBox.address})}],
          [{
            text: "Сколько осталось?",
            callback_data: JSON.stringify({type: 'time', time: -1, address: newBox.address})
          }],
          [{
            text: "Удалить адрес",
            callback_data: JSON.stringify({type: 'delete', address: newBox.address})
          }]
        ]
      })
    }
    bot.sendMessage(chatID, `Ваш новый email: ${newBox.address}@${config.domain}`, buttons)
  } catch(err){
    console.log(err);
  }
}

bot.setMyCommands([
  {command: '/newemail', description: 'Получить новый почтовый ящик.'},
  {command: '/myemails', description: 'Список последних email адресов.'},
])

bot.onText(/\/start/, async (msg, match) => {
  try {
    Users.addUser(msg.chat)
  } catch(err){
    console.log(err);
  }
})

bot.onText(/\/newemail/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, "Выберите домен", {reply_markup: JSON.stringify({
      inline_keyboard: [
        [{text: config.domain, callback_data: JSON.stringify({type: 'domain', domain: config.domain})}]
      ]
    })})
})

bot.onText(/\/myemails/, async (msg, match) => {
  try {
    const chatID = msg.chat.id
    const boxes = await Mailboxes.getMailboxesByUser(chatID)
    let buttons = {
      reply_markup: JSON.stringify({
        inline_keyboard: boxes.map( mailbox => [{text: `${mailbox.address}@${config.domain}`, callback_data: JSON.stringify({type: 'address', address: mailbox.address})}])
      })
    }
    console.log(boxes);
    bot.sendMessage(chatID, `Ваши последние email адреса`, buttons)
  } catch(err){
    console.log(err);
  }
})

bot.on('callback_query', async req => {
  try{
    const data = JSON.parse(req.data)
    const chatId = req.message.chat.id

    if(data.type == 'domain'){
      newEmail(req.message)
    }

    if(data.type == 'delete'){
      Mailboxes.deleteMailboxByAddress(data.address)
      bot.sendMessage(chatId, 'Адрес успешно удален!')
    }

    if (data.type == 'time') {
      if (data.time == -1) {
        let mailbox = await Mailboxes.getMailboxByAddress(data.address)

        if (mailbox.expires - new Date() <= 0) {
          return bot.sendMessage(chatId, `Срок действия адреса закончился!`, {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{
                  text: 'Восстановить адрес',
                  callback_data: JSON.stringify({type: 'time', time: 60, address: mailbox.address})
                }]
              ]
            })
          })
        } else {
          return bot.sendMessage(chatId, `Осталось ${Math.ceil((mailbox.expires - new Date()) / 1000 / 60)} мин.`)
        }

      } else {
        let mailbox = await Mailboxes.getMailboxByAddress(data.address)
        if (Math.ceil((mailbox.expires - new Date()) / 1000 / 60) + data.time > config.maxAddressLife) {
          return bot.sendMessage(chatId, 'Продление сейчас невозможно, попробуйте позже.')
        }
        await Mailboxes.updateExpireTime(mailbox, data.time)
        return bot.sendMessage(chatId, `Продлено на ${data.time} мин.`)
      }
    }

    if (data.type == 'address') {
      let buttons = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              {text: "+10 минут",callback_data: JSON.stringify({type: 'time', time: 10, address: data.address})},
              {text: "+30 минут", callback_data: JSON.stringify({type: 'time', time: 30, address: data.address})}
            ],
            [
              {
                text: "Сколько осталось?",
                callback_data: JSON.stringify({type: 'time', time: -1, address: data.address})
              }
            ],
            [
              {
                text: "Удалить адрес",
                callback_data: JSON.stringify({type: 'delete', address: data.address})
              }
            ]
          ]
        })
      }

      return bot.sendMessage(chatId, `${data.address}@${config.domain}`, buttons)
    }
  }catch(err){
    console.log(err)
  }

})
 

module.exports = bot



// const adminToken = config.adminBotToken

// const bot = new TelegramBot(token, {polling: true});