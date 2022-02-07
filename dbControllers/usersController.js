const db = require('../db')

class Users{
  static async addUser(user, admin = false){
    const {id, first_name, last_name, username} = user;
    const oldUser = await db.query('SELECT * FROM users where id = $1',[id])
    if(oldUser.rows.length === 0){
      const newUser = await db.query('INSERT INTO users (id, first_name, last_name, username, admin) values ($1, $2, $3, $4, $5) RETURNING *', [id, first_name, last_name, username, admin])
      return newUser.rows[0]
    }else{
      return oldUser.rows[0]
    }
  }

  static async getUser(id){
    const user = await db.query('SELECT * FROM users where id = $1',[id])
    return user.rows[0]
  }

  static async makeAdmin(id, adminStatus = true){
    const user = await db.query('UPDATE users SET admin = $1 where id = $2 RETURNING *',[adminStatus, id])
    return user.rows[0]
  }

}

module.exports = Users
