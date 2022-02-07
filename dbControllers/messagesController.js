const db = require('../db')

class Messages{
  static async addMessage(message){
    let {from, to, subject, date, text, html, mailbox, textAsHtml} = message
    html = html || textAsHtml || `<p>${text}</p>`
    let msg_id = await db.query('INSERT INTO messages (subject, text_, html, date_, from_, from_name, to_) values ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [subject, text, html, date, from.address, from.name, mailbox.id])
    return msg_id.rows[0].id
  }

  static async getMessageById(id){
    let message = await db.query('SELECT messages.* , mailboxes.address, mailboxes.password, telegram_user FROM messages left join mailboxes on messages.to_= mailboxes.id WHERE messages.id = $1',[id])
    return message.rows[0]
  }

  static async getMessagesBySender(email){
    let messages = await db.query('SELECT messages.* , mailboxes.address, mailboxes.password, telegram_user FROM messages left join mailboxes on messages.to_= mailboxes.id WHERE messages.from_ = $1',[email])
    return messages.rows
  }

  static async getMessageByMailbox(id){
    let message = await db.query('SELECT messages.* , mailboxes.address, mailboxes.password, telegram_user FROM messages left join mailboxes on messages.to_= mailboxes.id WHERE messages.to_ = $1',[id])
    return message.rows
  }

  static async deleteMessagesOlderThen(date){
    let messages = await db.query('DELETE FROM messages where(date_ < $1)',[date])
    return messages.rows
  }

}

module.exports = Messages