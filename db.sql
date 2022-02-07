create TABLE users(
	id INTEGER PRIMARY KEY,
	first_name VARCHAR(255),
	last_name VARCHAR(255),
	username VARCHAR(255),
	admin BOOLEAN
);

create TABLE mailboxes(
	id SERIAL PRIMARY KEY,
	address VARCHAR(255),
	password VARCHAR(255),
	creation_date TIMESTAMP,
	telegram_user INTEGER,
	FOREIGN KEY (telegram_user) REFERENCES users(id) ON DELETE CASCADE,
	expires TIMESTAMP;
);

create TABLE messages(
	id SERIAL PRIMARY KEY,
	subject TEXT,
	text_ TEXT,
	html TEXT,
	date_ TIMESTAMP,
	from_ VARCHAR(255),
	from_name VARCHAR(255),
	to_ INTEGER,
	FOREIGN KEY (to_) REFERENCES mailboxes(id) ON DELETE CASCADE
);

SELECT messages.* , mailboxes.address, mailboxes.password, telegram_user FROM messages left join mailboxes on messages.to_= mailboxes.id;

