let express = require('express')
let app = express()
let cors = require('cors')
const config = require('./config')
const path = require('path')
const Mailboxes = require('./dbControllers/mailboxesController')
const Messages = require('./dbControllers/messagesController')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'static')))

app.get('/', (req, res) => {
    res.send('hello world')
})

app.get('/get-email', async (req, res) => {
    try {
        const newBox = await Mailboxes.addMailbox(null)
        newBox.domain = config.domain
        res.json({
            mailbox: newBox,
        })
    } catch(err){
        console.log(err);
    }
})

app.post('/get-messages', async (req, res) => {
    try{
        const {address, password, id} = req.body
        console.log('body:', req.body)
        const mailbox =  await Mailboxes.getMailboxByAddress(address)
        if(!mailbox)return res.status(404).send(new Error('Oooups...'))
        if(password != mailbox.password)return res.status(401).send('Unauthorized!')
        const messages = await Messages.getMessageByMailbox(id)
        res.json(messages)
    }catch(err){
        res.status(404).send(new Error('Oooups...'))
        console.log(err);
    }
})

app.get('/letter', async (req, res) => {
    try{
        let {id, pass} = req.query
        if(!id)res.status(404).send('Not exist!')
        if(!pass)res.status(404).send('Not exist!')
        let message = await Messages.getMessageById(id)
        console.log(message);
        if(!message)res.status(404).send('Not exist!')
        if(pass == message.password){
            let {html} = message
            res.render('index', {...message, to: `${message.address}@${config.domain}`})
        }else{
            res.status(401).send('Unauthorized!')
        }
    } catch(err){
        console.log(err);
        res.status(500).send()
    }
})

app.post('/time', async (req, res) => {
    try{
        console.log(req.body)
        let data = req.body
        if(data.time <= 30){
            let mailbox = await Mailboxes.getMailboxByAddress(data.address)
            if (Math.ceil((mailbox.expires - new Date()) / 1000 / 60) + data.time > config.maxAddressLife) {
                res.status(400).json( 'Продление сейчас невозможно, попробуйте позже.')
            }
            let updated = await Mailboxes.updateExpireTime(mailbox, data.time)
            console.log(updated, 'kkkkkkk')
            res.json( {id: updated.id, expires: updated.expires})
        }else{
            res.status(400).json( 'Продление сейчас невозможно, попробуйте позже.')
        }
    }catch(err){
        console.log(err)
    }
})

module.exports = app