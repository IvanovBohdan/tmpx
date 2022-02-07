const TelegramBot = require('node-telegram-bot-api')
const config = require('./config.js')
const Users = require('./dbControllers/usersController')
const Mailboxes = require('./dbControllers/mailboxesController')
const Messages = require('./dbControllers/messagesController')

const adminToken = config.adminBotToken

const bot = new TelegramBot(adminToken, {polling: true})

let forwardList = []

bot.setMyCommands([
    {command: '/getadmin', description: 'Получить статус админа(по паролю)'},
    {command: '/getjson', description: 'Список писем по указаному адресу.'},
    {command: '/listen', description: 'Трансляция почты от указанных отправителей.'},
    {command: '/stoplisten', description: 'Отмена трансляции почты.'},
    {command: '/delletters', description: 'Удаление писем старше Х часов назад.'},
])

async function accessControl(id){
    let user = await Users.getUser(id)
    if(!user?.admin){
        bot.sendMessage(id,'Доступ запрещен!')
        return false
    }else{
        return true
    }
}

bot.onText(/\/start/, async (msg, match) => {
    let user = await Users.addUser(msg.chat, false)
})

bot.onText(/\/getadmin (.+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        const password = match[1]
        let user = await Users.getUser(msg.chat)
        if(user.admin)return bot.sendMessage(chatId,'Вы уже имеете статус админа!')
        if(!user.admin && password == config.adminPassword){
            await Users.makeAdmin(chatId)
            bot.sendMessage(chatId,'Вы получили статус админа!')
        }else{
            bot.sendMessage(chatId,'Неверный пароль!')
        }
    } catch(err){
        console.log(err);
    }
})

bot.onText(/\/getjson (.+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        const email = match[1]
        if (!await accessControl(chatId)) return
        let messages = await Messages.getMessagesBySender(email)
        messages = messages.map(message => {
            return {
                id: message.id,
                mailbox_id: message.to_,
                from_name: message.from_name,
                from: message.from_,
                to: `${message.address}@${config.domain}`,
                subject: message.subject,
                text: message.text_,
                html: message.html,
                password: message.password,
                link: `http://${config.domain}/letter?id=${message.id}&pass=${message.password}`,
                telegram_id: message.telegram_user,
                date: message.date_
            }
        })
        let buffer = Buffer.from(JSON.stringify(messages, null, 4))
        const fileOptions = {
            filename: `${email}-${Date.now()}.json`,
            contentType: 'application/json',
        };
        bot.sendDocument(chatId, buffer, {}, fileOptions);
    } catch(err){
        console.log(err);
    }
})

bot.onText(/\/listen (.+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        const emailList = match[1].split(' ')
        if (!await accessControl(chatId)) return
        forwardList = [...forwardList, ...emailList.map(email => {return {user: chatId, email}})]
        bot.sendMessage(chatId, "Пересылка почты активна!")
    } catch(err){
        console.log(err);
    }
})

bot.onText(/\/stoplisten/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        if (!await accessControl(chatId)) return
        forwardList = []
        bot.sendMessage(chatId, "Пересылка почты деактивирована!")
    } catch(err){
        console.log(err);
    }
})

bot.onText(/\/listening/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        if (!await accessControl(chatId)) return
        forwardList = []
        bot.sendMessage(chatId, "Пересылка почты деактивирована!")
    } catch(err){
        console.log(err);
    }
})

bot.onText(/\/delletters (.+)/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        if (!await accessControl(chatId)) return
        let today = new Date()
        let hours = Number(match[1])
        let deletionDate = new Date(today - 1000 * 60 * 60 * hours)
        Messages.deleteMessagesOlderThen(deletionDate)
        bot.sendMessage(chatId, `Вся почта старше чем ${deletionDate.toLocaleString()} была удалена.`)
    } catch(err){
        console.log(err);
    }
})

bot.onText(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, async (msg, match) => {
    try {
        const chatId = msg.chat.id
        if (!await accessControl(chatId)) return
        bot.sendMessage(chatId, `${match[0]}`,{
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{text: 'Прослушивать', callback_data: '/listen'}],
                    [{text: 'Убрать из прослушиваемых', callback_data: '/stoplisten'}],
                    [{text: 'get JSON', callback_data: '/json'}],
                ]
            })
        })
    } catch(err){
        console.log(err);
    }
})

bot.on('callback_query', async msg => {
    let email = msg.message.text
    const chatId = msg.message.chat.id
    console.log(msg.data)
    if (!await accessControl(chatId)) return
    if(msg.data == '/listen'){
        try {
            forwardList.push(email)
            bot.sendMessage(chatId, "Пересылка почты активна!")
        } catch(err){
            console.log(err);
        }
    }

    if(msg.data == '/stoplisten'){
        try {
            forwardList = forwardList.filter(forward => forward != email)
            bot.sendMessage(chatId, `Адрес ${email} дален из прослушивания!`)
        } catch(err){
            console.log(err);
        }
    }

    if(msg.data == '/json'){
        try{
            let messages = await Messages.getMessagesBySender(email)
            messages = messages.map(message => {
                return {
                    id: message.id,
                    mailbox_id: message.to_,
                    from_name: message.from_name,
                    from: message.from_,
                    to: `${message.address}@${config.domain}`,
                    subject: message.subject,
                    text: message.text_,
                    html: message.html,
                    password: message.password,
                    link: `http://${config.domain}/letter?id=${message.id}&pass=${message.password}`,
                    telegram_id: message.telegram_user,
                    date: message.date_
                }
            })
            let buffer = Buffer.from(JSON.stringify(messages, null, 4))
            const fileOptions = {
                filename: `${email}-${Date.now()}.json`,
                contentType: 'application/json',
            };
            bot.sendDocument(chatId, buffer, {}, fileOptions);
        } catch(err){
            console.log(err);
        }
    }


})

// bot.on('message', msg => {
//     const chatId = msg.chat.id
//     bot.sendMessage(chatId, 'Recives111')
// })


module.exports = {adminBot: bot, getForwardList(){return forwardList}}





// const bot = new TelegramBot(token, {polling: true});