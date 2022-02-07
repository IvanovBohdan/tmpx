module.exports = {
	port : process.env.EMAIL_PORT || 25,
	expressPort: process.env.PORT || 5000,
	host : process.env.HOST || "0.0.0.0",
	telegramBotToken : '5207295773:AAGhku402XgEPS1fs1rk0SzXOANCnnmNIts',
	adminBotToken : '5191180370:AAHPT-FyxNPFYzTijA7YLXaHMUYzQAZ0tD8',
	adminPassword : 'test',
	domain : 'tmpx.ml',
	allowedBoxQuantity : 10,
	maxAddressLife : 70,
	db: {
		user: 'jblmqcztkqptlj',
		password: '8c4df370cf0b220b22ea69805a10657ef3be39b09e352f7ba4d6906d89598c3d',
		host: 'ec2-54-247-137-184.eu-west-1.compute.amazonaws.com',
		port: 5432,
		database: 'dempogarv5hltj',
		ssl: {rejectUnauthorized: false}
	}
}