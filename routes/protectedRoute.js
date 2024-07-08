const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/users/:id
router.get('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const tstuser = await pool.query("SELECT * FROM \"User\" WHERE userid=$1", [id]);
  const [user] = tstuser.rows;
  if (!user) {
    return res.status(404).json({ 
      status: 'Not found',
      message: 'User not found',
      statusCode: 404,
    });
  }
  res.status(200).json({
    status: 'success',
    message: 'User found',
    data: {
      userId: user.userid,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      phone: user.phone,
    },
  });
});

// GET /api/organisations
router.get('/organisations', verifyToken, async (req, res) => {
  const tstuser = await pool.query("SELECT * FROM \"User\" WHERE userid=$1", [req.userId]);
  const [user] = tstuser.rows;
  if (!user) {
    return res.status(404).json({ 
      status: 'Not found',
      message: 'User not found',
      statusCode: 404,
    });
  }
  // get all organisations the user is belongs to
  const query = `
    SELECT "User".userId, "Organisation".orgId, "Organisation".name, "Organisation".description
    FROM "User"
    JOIN "user_organisation" ON "User".userId = "user_organisation".userId
    JOIN "Organisation" ON "user_organisation".orgId = "Organisation".orgId
    WHERE "User".userId = $1;
  `;
  const tstorg = await pool.query(query, [user.userid]);
  const organisations = tstorg.rows;
  res.status(200).json({
    status: 'success',
    message: 'All organisations displayed the user is belongs to',
    data: {
      organisations: organisations.map(org => ({
        orgId: org.orgid,
        name: org.name,
        description: org.description,
      })),
    },
  });
});

// GET /api/organisations/:id
router.get('/organisations/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT "User".userId, "Organisation".orgId, "Organisation".name, "Organisation".description
    FROM "User"
    JOIN "user_organisation" ON "User".userId = "user_organisation".userId
    JOIN "Organisation" ON "user_organisation".orgId = "Organisation".orgId
    WHERE "User".userId = $1 AND "Organisation".orgid = $2;
  `;
  const tstorg = await pool.query(query, [req.userId, id]);
  const organisations = tstorg.rows;
  if (organisations.length === 0) {
    return res.status(404).json({ 
      status: 'Not found',
      message: 'Organisation not found',
      statusCode: 404,
    });
  }
  const [organisation] = organisations;
  res.status(200).json({
    status: 'success',
    message: 'Organisation found',
    data: {
      orgId: organisation.orgid,
      name: organisation.name,
      description: organisation.description,
    },
  });
});

// POST /api/organisations
//     ✕ responds with 201 successful create organisation (9 ms)
//     ✕ responds with 401 unauthorised access (4 ms)
//     ✕ responds with 422 missing name (3 ms)
router.post('/organisations', verifyToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(422).json({
      status: 'error',
      message: 'Missing name',
      statusCode: 422,
    });
  }
  const query = `
    INSERT INTO "Organisation" (name, description)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const tstorg = await pool.query(query, [name, description]);
  const [organisation] = tstorg.rows;
  res.status(201).json({
    status: 'success',
    message: 'Organisation created',
    data: {
      orgId: organisation.orgid,
      name: organisation.name,
      description: organisation.description,
    },
  });
});

// POST /api/organisations/:id/users
//     ✕ responds with 200 successful add user to organisation (8 ms)
//     ✕ responds with 401 unauthorised access (4 ms)
//     ✓ responds with 404 user not found (5 ms)
router.post('/organisations/:id/users', verifyToken, async (req, res) => {
  const { id } = req.params;
  const orgQuery = `
    SELECT * FROM "Organisation"
    WHERE orgId = $1;
  `;
  const ttorg = await pool.query(orgQuery, [id]);
  const organisations = ttorg.rows;
  if (organisations.length === 0) {
    return res.status(404).json({ 
      status: 'Not found',
      message: 'Organisation not found',
      statusCode: 404,
    });
  }
  const { userId } = req.body;
  const tstuser = await pool.query("SELECT * FROM \"User\" WHERE userid=$1", [userId]);
  const [user] = tstuser.rows;
  if (!user) {
    return res.status(404).json({ 
      status: 'Not found',
      message: 'User not found',
      statusCode: 404,
    });
  }
  const query = `
    INSERT INTO "user_organisation" (userId, orgId)
    VALUES ($1, $2)
    RETURNING *;
  `;
  await pool.query(query, [userId, id]);
  res.status(200).json({
    status: 'success',
    message: 'User added to organisation successfully',
  });
});


module.exports = router;
