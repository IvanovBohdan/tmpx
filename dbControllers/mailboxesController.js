const db = require('../db')
const config = require('../config.js')

class Mailboxes{

  static getNewAddress(count){
    const prefix = Mailboxes.getPassword(2).toLowerCase() + Math.floor(Math.random()*10).toString(26)
    const body = count.toString(26)

    return prefix+body
  }

  static getPassword(length) {
    let
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

  static async addMailbox(user=null){
    const res = await db.query('select id from mailboxes order by id desc limit 1')
    const count = parseInt(res.rows[0].id) + 1
    const newAddres = Mailboxes.getNewAddress(count)
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)
    const mailbox = await db.query('INSERT INTO mailboxes (address, password, creation_date, telegram_user, expires) values ($1, $2, $3, $4, $5) RETURNING *',
     [newAddres, Mailboxes.getPassword(6), new Date(), user, expires])
    return mailbox.rows[0]
  }

  static async getMailboxByAddress(address){
    try{
      address = address.split('@')[0]
      const mailbox = await db.query('SELECT * FROM mailboxes where address = $1', [address])
      return mailbox.rows[0]
    }catch(err){
      console.log(err)
    }
  }

  static async deleteMailboxByAddress(address){
    try{
      address = address.split('@')[0]
      await db.query('DELETE FROM mailboxes where address = $1', [address])
    }catch(err){
      console.log(err)
    }
  }

  static async getMailboxesByUser(user){
    const mailbox = await db.query('SELECT * FROM mailboxes where telegram_user = $1', [user])
    return mailbox.rows
  }

  static async updateExpireTime(mailbox, minutes){
    try{
      let {expires} = mailbox
      if (!expires) return
      expires = expires < new Date() ? new Date() : expires
      expires.setMinutes(expires.getMinutes() + minutes)
      let updated = await db.query('UPDATE mailboxes SET expires = $1 WHERE id = $2 RETURNING id, address, expires', [expires, mailbox.id])
      return updated.rows[0]
    }catch(err){
      console.log(err)
    }
  }

}

module.exports = Mailboxes
