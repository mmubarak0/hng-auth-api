CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c hngauth;

CREATE DATABASE hngauth;

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

-- Insert a new user into the tables
INSERT INTO "User"(firstname, lastname, email, password, phone) VALUES ('man', 'an', 'man@email.com', '12345', '01134087
79') RETURNING *;

-- Insert a new organisation into the tables
INSERT INTO "Organisation"(name, description) VALUES ('HNG', 'HNG') RETURNING *;

-- add user to organisation
INSERT INTO "user_organisation"(userId, orgId) VALUES ('f7b3b3b4-0b3b-4b3b-8b3b-0b3b3b3b3b3b', 'f7b3b3b4-0b3b-4b3b-8b3b-0b3b3b3b3b3b') RETURNING *;

-- Query to get userId, firstName, orgId and name for all users
SELECT "User".userId, "User".firstName, "Organisation".orgId, "Organisation".name
FROM "User"
JOIN "user_organisation" ON "User".userId = "user_organisation".userId
JOIN "Organisation" ON "user_organisation".orgId = "Organisation".orgId;
