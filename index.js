const SMTPServer = require("smtp-server").SMTPServer
const simpleParser = require("mailparser").simpleParser
const config = require('./config.js')
const bot = require('./TelegramBot.js')
const Users = require('./dbControllers/usersController')
const Mailboxes = require('./dbControllers/mailboxesController')
const Messages = require('./dbControllers/messagesController')
const app = require('./express_server')
let {adminBot, getForwardList} = require('./AdminBot')
const PORT = config.port || 25
const HOST = config.host || "0.0.0.0"

function sendTextToTelegram(chat_id, message, bot = bot){
    console.log(chat_id)
  const {from, to, subject, date, html, text, id, mailbox} = message
  let template = `${from.name}\nОт кого: ${from.address}\nКому: ${to}\n\n${subject}\n\n${text}\n\n${date.toLocaleString()}\n`
  if(html){
    template += `HTML письмо: http://${config.domain}/letter?id=${id}&pass=${mailbox.password}`
  }
  bot.sendMessage(chat_id, template)
}

function onData(stream, session, callback){
  simpleParser(stream, {})
    .then(async parsed => {
      try{
        console.log(parsed.from.value);
        let message = {
          from: parsed.from.value[0],
          to: parsed.to.value[0].address,
          subject: parsed.subject || 'Без темы',
          date: parsed.date,
          text: parsed.text || '',
          html: parsed.html,
          textAsHtml: parsed.textAsHtml
        }
        let mailbox = await Mailboxes.getMailboxByAddress(message.to)
        message = {...message, mailbox}
        console.log(message)
        if(mailbox){
          let msg_id = await Messages.addMessage(message)
          message.id = msg_id
            console.log(mailbox.telegram_user)
          if(mailbox.telegram_user)sendTextToTelegram(mailbox.telegram_user, message, bot)
          getForwardList().forEach(forward => {
              if(forward.email == message.from.address)sendTextToTelegram(forward.user, message, adminBot)
          })
          callback()
        }
      } catch(err){
        callback()
      }
      
    })
    .catch(err => {
      console.log(err)
      callback(err)
    })
}

async function onRcptTo({address}, session, callback) {
    let mailbox = await Mailboxes.getMailboxByAddress(address)
    if (!mailbox) {
        callback(new Error(`Address ${address} is not existing receiver!`))
    }
    else {
        if(mailbox.expires < new Date()){
          callback(new Error(`${address} is not currently receiving the messages!`))
        }else{
          callback();
        }
    }
}

const server = new SMTPServer({
  size: 1024 * 1024,
  onRcptTo,
  onData,
  authOptional: true,
  disabledCommands: ['AUTH'],
  //logger: true
});

server.listen(PORT, HOST, () => {
    console.log(`Server is working on host: ${HOST}, port ${PORT}...`);
})

app.listen(config.expressPort)

