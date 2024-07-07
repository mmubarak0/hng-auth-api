const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');


// User registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const fieldMap = new Map();
    fieldMap.set('firstName', firstName);
    fieldMap.set('lastName', lastName);
    fieldMap.set('email', email);
    fieldMap.set('password', password);

    // validate user input.
    // required fields = [firstName, lastName, email, password]
    const missing_fields = ["firstName", "lastName", "email", "password"].filter(field => !fieldMap.get(field));
    const missing_errors = [];
    if (missing_fields.length > 0) {
      missing_fields.forEach(f => {
        missing_errors.push({ field: f, message: `${f} is missing` })
      });
      res.status(422).json({ errors: missing_errors });
    }
    // unique fields = [email]
    const unique_fields = ["email"];
    const unique_errors = [];
    unique_fields.forEach(async field => {
      const tstuser = await pool.query("SELECT * FROM \"User\" WHERE email=$1", [fieldMap.get(field)]);
      if (tstuser.rows.length > 0) {
        unique_errors.push({ field: field, message: `${field} is already taken` });
      }
    });
    if (unique_errors.length > 0) {
      res.status(422).json({ errors: unique_errors });
    };

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user.
    const tstuser = await pool.query(
      "INSERT INTO \"User\"(firstname, lastname, email, password, phone) VALUES($1,$2,$3,$4,$5) RETURNING *;",
      [firstName, lastName, email, hashedPassword, phone]
    );
    const [user] = tstuser.rows;

    // create user organization.
    const orgName = `${user.firstname}'s Organisation`;
    const tstorg = await pool.query(
      "INSERT INTO \"Organisation\"(name, description) VALUES ($1, $2) RETURNING *;",
      [orgName, null]
    );
    const [organization] = tstorg.rows;

    // add user to his organization.
    await pool.query(
      "INSERT INTO \"user_organisation\"(userId, orgId) VALUES ($1,$2) RETURNING *;",
      [user.userid, organization.orgid]
    );

    // generate jwt token
    const token = jwt.sign({ userId: user.userid }, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRE_TIME,
    });

    // successful registration response.
    const result = {
      status: "success",
      message: "Registration successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userid,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          phone: user.phone,
        },
      },
    };
    res.status(201).json(result);
  } catch (error) {
    // unsuccessful registration response.
    try {
      const errorResult = {
        status: "Bad request",
        message: "Registration unsuccessful",
        statusCode: 422,
      };
      res.status(422).json(errorResult);
    } catch (error) {
      if (error.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.log(error);
      }
    }
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const fieldMap = new Map();
    fieldMap.set('email', email);
    fieldMap.set('password', password);

    // validate user input.
    // required fields = [email, password]
    const missing_fields = ["email", "password"].filter(field => !fieldMap.get(field));
    const missing_errors = [];
    if (missing_fields.length > 0) {
      missing_fields.forEach(f => {
        missing_errors.push({ field: f, message: `${f} is missing` })
      });
      res.status(422).json({ errors: missing_errors });
    }

    // find user by email.
    const tstuser = await pool.query("SELECT * FROM \"User\" WHERE email=$1", [email]);
    const [user] = tstuser.rows;

    // check if user doesn't exists.
    if (!user) {
      return res.status(401).json({ 
        status: 'Bad request',
        message: 'email or password is incorrect',
        statusCode: 401,
      });
    }

    // check if password is correct.
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        status: 'Bad request',
        message: 'email or password is incorrect',
        statusCode: 401,
      });
    }

    // generate jwt token
    const token = jwt.sign({ userId: user.userid }, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRE_TIME,
    });

    // successful login response.
    const result = {
      status: "success",
      message: "Login successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userid,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          phone: user.phone,
        },
      },
    };
    res.status(200).json(result);
  } catch (error) {
    // unsuccessful login response.
    try {
      const errorResult = {
        status: "Bad request",
        message: "Authentication failed",
        statusCode: 401,
      };
      res.status(401).json(errorResult);
    } catch (error) {
      if (error.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.log(error);
      }
    }
  }
});

module.exports = router;
