const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser

const PORT = 25
const HOST = "192.168.89.255"

const server = new SMTPServer({
  onData(stream, session, callback) {
    parser(stream, {}, (err, parsed) => {
      if (err)
        console.log("Error:" , err)
      
      console.log(parsed)
      stream.on("end", callback)
    })
    
  },
  disabledCommands: ['AUTH']
});

server.listen(PORT, HOST, () => {
    console.log('obj');
})