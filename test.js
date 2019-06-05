'use strict'

const {
  test,
  beforeEach,
  tearDown
} = require('tap')

const clean = require('mongo-clean')
const { MongoClient } = require('mongodb')
const Fastify = require('fastify')
const AuthMongoJwt = require('.')
const { createUser } = AuthMongoJwt

const url = 'mongodb://localhost:27017'
const database = 'tests'

let client

beforeEach(async function () {
  if (!client) {
    client = await MongoClient.connect(url, {
      w: 1,
      useNewUrlParser: true
    })
  }
  await clean(client.db(database))
})

tearDown(async function () {
  if (client) {
    await client.close()
    client = null
  }
})

// needed for testing your plugins
function config () {
  return {
    auth: {
      secret: 'thisisalongsecretjustfortests'
    },
    mongodb: {
      client,
      database
    }
  }
}

// automatically build and tear down our instance
function build (t) {
  const app = Fastify({
    logger: {
      level: 'error'
    }
  })

  // we use fastify-plugin so that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  app.register(AuthMongoJwt, config())

  // tear down our app after we are done
  t.tearDown(app.close.bind(app))

  return app
}

test('signup and login', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 200)
  t.match(JSON.parse(res1.body), { status: 'ok' })

  const res2 = await app.inject({
    url: '/login',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 200)
  t.match(JSON.parse(res2.body), { status: 'ok' })
})

test('signup without password', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 400)
  t.match(JSON.parse(res1.body), {
    statusCode: 400,
    error: 'Bad Request',
    message: 'body should have required property \'password\''
  })
})

test('signup without username', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      password: 'aaaaa'
    }
  })

  t.deepEqual(res1.statusCode, 400)
  t.match(JSON.parse(res1.body), {
    statusCode: 400,
    error: 'Bad Request',
    message: 'body should have required property \'username\''
  })
})

test('login wrong credentials', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 200)
  t.match(JSON.parse(res1.body), { status: 'ok' })

  const res2 = await app.inject({
    url: '/login',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'collina'
    }
  })

  t.deepEqual(res2.statusCode, 400)
  t.match(JSON.parse(res2.body), { status: 'not ok' })
})

test('double signup', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 200)
  t.match(JSON.parse(res1.body), { status: 'ok' })

  const res2 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res2.statusCode, 400)
  t.match(JSON.parse(res2.body), { status: 'not ok' })
})

test('signup and use token', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 200)
  const body1 = JSON.parse(res1.body)
  t.match(body1, { status: 'ok' })
  const token = body1.token
  t.ok(token)

  const res2 = await app.inject({
    url: '/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  t.deepEqual(res1.statusCode, 200)
  t.match(JSON.parse(res2.body), { username: 'matteo' })
})

test('signup and login', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/signup',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 200)
  t.match(JSON.parse(res1.body), { status: 'ok' })

  const res2 = await app.inject({
    url: '/login',
    method: 'POST',
    body: {
      username: 'matteo',
      password: 'matteo'
    }
  })

  t.deepEqual(res2.statusCode, 200)
  const body2 = JSON.parse(res2.body)
  t.match(body2, { status: 'ok' })

  const token = body2.token
  t.ok(token)

  const res3 = await app.inject({
    url: '/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  t.deepEqual(res3.statusCode, 200)
  t.match(JSON.parse(res3.body), { username: 'matteo' })
})

test('login without password', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/login',
    method: 'POST',
    body: {
      username: 'matteo'
    }
  })

  t.deepEqual(res1.statusCode, 400)
  t.match(JSON.parse(res1.body), {
    statusCode: 400,
    error: 'Bad Request',
    message: 'body should have required property \'password\''
  })
})

test('login without username', async (t) => {
  const app = build(t)

  const res1 = await app.inject({
    url: '/login',
    method: 'POST',
    body: {
      password: 'aaaaa'
    }
  })

  t.deepEqual(res1.statusCode, 400)
  t.match(JSON.parse(res1.body), {
    statusCode: 400,
    error: 'Bad Request',
    message: 'body should have required property \'username\''
  })
})

test('createUser returns a token', async (t) => {
  const app = build(t)

  const { token } = await createUser(app, { username: 'matteo', password: 'matteo' })

  const res3 = await app.inject({
    url: '/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  t.deepEqual(res3.statusCode, 200)
  t.match(JSON.parse(res3.body), { username: 'matteo' })
})

test('createUser returns inject', async (t) => {
  const app = build(t)

  const { inject } = await createUser(app)

  const res3 = await inject({
    url: '/me',
    method: 'GET'
  })

  t.deepEqual(res3.statusCode, 200)
  t.match(JSON.parse(res3.body), { username: 'matteo' })
})
