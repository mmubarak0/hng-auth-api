const request = require('supertest');
const app = require('../app');
const pool = require('../db');
const bcrypt = require('bcrypt');

let user_1, user_2, user_3;
let org_1, org_2, org_3;
let user_1_token, user_2_token, user_3_token;

// clear the database
function clearPool() {
  return pool.query('TRUNCATE "User", "Organisation", "user_organisation";');
}

// create user and org in the database
async function createUser(firstName, lastName, email, password, phone) {
  let user, org, user_token;

  // create a dummy user
  const tstuser_1 = await pool.query(
    'INSERT INTO "User" (firstName, lastName, email, password, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [firstName, lastName, email, await bcrypt.hash(password, 10), phone]
  );
  user = tstuser_1.rows[0];
  user.password = password;

  // create a dummy organisation
  const tstorg = await pool.query(
    'INSERT INTO "Organisation" (name, description) VALUES ($1, $2) RETURNING *',
    [`${user.firstname}'s organisation`, `${user.firstname}'s organisation description`]
  );
  org = tstorg.rows[0];

  // add dummy user to dummy organisation
  await pool.query(
    'INSERT INTO "user_organisation" (userId, orgId) VALUES ($1, $2) RETURNING *',
    [user.userid, org.orgid]
  );
  return [user, org];
}

// authenticate dummy users
async function generateToken(user) {
  const authenticate = await request(app).post('/auth/login').send({
    email: user.email,
    password: user.password,
  });
  return authenticate.body.data.accessToken;
}


beforeAll(async () => {
  // create a dummy user
  [user_1, org_1] = await createUser('kaito', 'kid', 'kaito@email.com', '12345', '1234567890');
  [user_2, org_2] = await createUser('conan', 'edogawa', 'conan@email.com', '12345', '1234567890');
  [user_3, org_3] = await createUser('ran', 'mouri', 'ran@email.com', '12345', '1234567890');

  // generate token
  user_1_token = await generateToken(user_1);
  user_2_token = await generateToken(user_2);
  user_3_token = await generateToken(user_3);
});

// POST /auth/register route
describe('POST /auth/register', () => {
  // successful registration
  test('responds with 201 successful registration', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Mody',
      lastName: 'Mu',
      email: 'mody@email.com',
      password: '12345',
      phone: '1234567890',
    });
    expect(res.statusCode).toEqual(201);
  });

  // test unique fileds
  test('responds with 422 email already exists', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Mody',
      lastName: 'Mu',
      email: 'mody@email.com',
      password: '12345',
      phone: '1234567890',
    });
    expect(res.statusCode).toEqual(422);
  });

  // missing required fields
  test('responds with 422 missing firstName', async () => {
    const res = await request(app).post('/auth/register').send({
      lastName: 'Mu',
      email: 'Mu@email.com',
      password: '12345',
      phone: '123456789',
    });
    expect(res.statusCode).toEqual(422);
  });
  test('responds with 422 missing lastName', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Mody',
      email: 'ody@email.com',
      password: '12345',
      phone: '123456789',
    });
    expect(res.statusCode).toEqual(422);
  });
  test('responds with 422 missing email', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Mody',
      lastName: 'Mu',
      password: '12345',
      phone: '123456789',
    });
    expect(res.statusCode).toEqual(422);
  });
  test('responds with 422 missing password', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Mody',
      lastName: 'Mu',
      email: 'mo@email.com',
      phone: '123456789',
    });
    expect(res.statusCode).toEqual(422);
  });

  // missing field is optional
  test('responds with 201 missing phone', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Man',
      lastName: 'Mu',
      email: 'man@email.com',
      password: '12345',
    });
    expect(res.statusCode).toEqual(201);
  });
});

// POST /auth/login route
describe('POST /auth/login', () => {
  // successful login
  test('responds with 200 successful login', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'mody@email.com',
      password: '12345',
    });
    expect(res.statusCode).toEqual(200);
  });

  // missing required fields
  test('responds with 422 missing email', async () => {
    const res = await request(app).post('/auth/login').send({
      password: '12345',
    });
    expect(res.statusCode).toEqual(422);
  });
  test('responds with 422 missing password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'mody@email.com',
    });
    expect(res.statusCode).toEqual(422);
  });

  // wrong credentials
  test('responds with 401 wrong email', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'm@email.com',
      password: '12345',
    });
    expect(res.statusCode).toEqual(401);
  });
  test('responds with 401 wrong password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'mody@email.com',
      password: '1234',
    });
    expect(res.statusCode).toEqual(401);
  });
});

// GET /api/users/:id route
describe('GET /api/users/:id', () => {
  // successful get user This a protected route we need to pass the token
  test('responds with 200 successful get user', async () => {
    const res = await request(app).get(`/api/users/${user_1.userid}`)
      .set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(200);
  });

  // unauthorised access
  test('responds with 401 unauthorised access', async () => {
    const res = await request(app).get(`/api/users/${user_1.userid}`);
    expect(res.statusCode).toEqual(401);
  });

  // user not found
  test('responds with 404 user not found', async () => {
    const res = await request(app).get('/api/users/f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0')
      .set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(404);
  });
});

// GET /api/organisations route
describe('GET /api/organisations', () => {
  // successful get organisations this route is protected
  test('responds with 200 successful get organisations', async () => {
    const res = await request(app).get('/api/organisations')
      .set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(200);
  });

  // unauthorized access
  test('responds with 401 unauthorised access', async () => {
    const res = await request(app).get(`/api/organisations`);
    expect(res.statusCode).toEqual(401);
  });

  // all organisations displayed the user is belongs to
  test('responds with 200 all organisations displayed the user is belongs to', async () => {
    const res = await request(app).get('/api/organisations')
      .set('Authorization', `bearer ${user_1_token}`);
    expect(res.body.data.organisations.length).toEqual(1);
  });
});

// GET /api/organisations/:id route
describe('GET /api/organisations/:id', () => {
  // successful get organisation
  test('responds with 200 successful get organisation', async () => {
    const res = await request(app).get(`/api/organisations/${org_1.orgid}`)
      .set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(200);
  });

  // unauthorized access
  test('responds with 401 unauthorised access', async () => {
    const res = await request(app).get(`/api/organisations/${org_1.orgid}`);
    expect(res.statusCode).toEqual(401);
  });

  // organisation not found
  test('responds with 404 organisation not found', async () => {
    const res = await request(app).get('/api/organisations/f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0')
      .set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(404);
  });
});

// POST /api/organisations route
describe('POST /api/organisations', () => {
  // successful create organisation
  test('responds with 201 successful create organisation', async () => {
    const res = await request(app).post('/api/organisations').send({
      name: 'Mody Organisation',
      description: 'Mody Organisation Description',
    }).set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(201);
  });

  // unauthorized access
  test('responds with 401 unauthorised access', async () => {
    const res = await request(app).post('/api/organisations').send({
      name: 'Mody Organisation',
      description: 'Mody Organisation Description',
    });
    expect(res.statusCode).toEqual(401);
  });

  // missing required fields
  test('responds with 422 missing name', async () => {
    const res = await request(app).post('/api/organisations').send({
      description: 'Mody Organisation Description',
    }).set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(422);
  });
});

// POST /api/organisations/:id/users/ route
describe('POST /api/organisations/:id/users', () => {
  // successful add user to organisation
  test('responds with 200 successful add user to organisation', async () => {
    const res = await request(app).post(`/api/organisations/${org_1.orgid}/users`).send({
      userId: user_2.userid,
    }).set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(200);
  });

  // unauthorized access
  test('responds with 401 unauthorised access', async () => {
    const res = await request(app).post(`/api/organisations/${org_1.orgid}/users`).send({
      userId: user_2.userid,
    });
    expect(res.statusCode).toEqual(401);
  });

  // user not found
  test('responds with 404 user not found', async () => {
    const res = await request(app).post(`/api/organisations/${org_1.orgid}/users`).send({
      userId: 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
    }).set('Authorization', `bearer ${user_1_token}`);
    expect(res.statusCode).toEqual(404);
  });
});

afterAll(async () => {
  await clearPool();
  pool.end();
});
