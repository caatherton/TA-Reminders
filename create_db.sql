
DROP DATABASE IF EXISTS taReminders;
CREATE DATABASE taReminders;

USE taReminders;

-- TA user information
CREATE TABLE TAs (
	uid INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(64),
	phone VARCHAR(32),
	email VARCHAR(64),
	PRIMARY KEY (uid)
);

-- admin user information
CREATE TABLE admins (
	uid INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(64),
	email VARCHAR(64),
	PRIMARY KEY (uid)
);

-- all letter days in schedule rotation
CREATE TABLE letterDays (
	uid INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(1) UNIQUE,
	PRIMARY KEY (uid)
);

-- assignments of which TAs hold hours on which letter days (relation between TAs and letterDays)
CREATE TABLE letterDayAssgn (
	uid INT NOT NULL AUTO_INCREMENT,
	taUID INT,
	letterUID INT,
	PRIMARY KEY (uid),
	FOREIGN KEY (taUID) REFERENCES TAs(uid) ON DELETE CASCADE,
	FOREIGN KEY (letterUID) REFERENCES letterDays(uid) ON DELETE CASCADE
);