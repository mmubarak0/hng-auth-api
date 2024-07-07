CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c hngauth_test;

CREATE DATABASE hngauth_test;

CREATE TABLE IF NOT EXISTS "User"(
        userId uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT
);

CREATE TABLE IF NOT EXISTS "Organisation"(
        orgId uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT
);

CREATE TABLE IF NOT EXISTS "user_organisation"(
        userId uuid REFERENCES "User"(userId) ON UPDATE CASCADE,
        orgId uuid REFERENCES "Organisation"(orgId) ON UPDATE CASCADE,
        CONSTRAINT "user-organisation_pkey" PRIMARY KEY (userId, orgId)
);

-- delete all data from the tables
TRUNCATE "User", "Organisation", "user_organisation";

-- Insert dummy data into the tables
-- Insert a new user into the tables
INSERT INTO "User"(firstname, lastname, email, password, phone) VALUES ('john', 'doe', 'john@email.com', '12345', '0113408779') RETURNING *;
INSERT INTO "User"(firstname, lastname, email, password, phone) VALUES ('jane', 'doe', 'jane@email.com', '12345', '0113408779') RETURNING *;

-- Insert a new organisation into the tables
INSERT INTO "Organisation"(name, description) VALUES ('john`s organisation', 'john`s organisation') RETURNING *;
INSERT INTO "Organisation"(name, description) VALUES ('jane`s organisation', 'jane`s organisation') RETURNING *;
INSERT INTO "Organisation"(name, description) VALUES ('HNG', 'HNG') RETURNING *;
INSERT INTO "Organisation"(name, description) VALUES ('I4G', 'I4G') RETURNING *;

-- add user to organisation
INSERT INTO "user_organisation"(userId, orgId) VALUES ('userId', 'orgId') RETURNING *;

-- Query to get userId, firstName, orgId and name for all users
SELECT "User".userId, "User".firstName, "Organisation".orgId, "Organisation".name
FROM "User"
JOIN "user_organisation" ON "User".userId = "user_organisation".userId
JOIN "Organisation" ON "user_organisation".orgId = "Organisation".orgId;
