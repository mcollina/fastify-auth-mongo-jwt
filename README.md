# fastify-auth-mongo-jwt

Sample user-management (signup, login) with Fastify and JWT, on top of
[MongoDB](https://www.mongodb.com).

This plugin sends credentials in plain text, and it implies that
HTTPS is used to protect the application.

## Install

```
npm i @matteo.collina/fastify-auth-mongo-jwt
```

## Usage

```js
'use strict'

const Fastify = require('fastify')
const AuthMongoJwt = require('@matteo.collina/fastify-auth-mongo-jwt')

const app = Fastify()

app.register(AuthMongoJwt, {
  auth: {
    secret: 'thisisalongsecretjustfortests'
  },
  mongodb: {
    url: 'mongodb://mongo/mydb',
    w: 1,
    useNewUrlParser: true
  }
})

app.register(async function (app, opts) {
  app.addHook('preHandler', function (req, reply) {
    return req.jwtVerify()
  })

  app.get('/username', async function (req, reply) {
    return req.user.username
  })
}, { prefix: '/protected' })
```

## REST routes

This fastify plugin offers the following routes.

### POST /signup

Accepts the following body:

```json
{
  "username": 'a unique thing',
  "password": 'a long password'
}
```

It will return a JWT token, encapsulated with an object:

```json
{
  "status": 'ok',
  "token": 'a jwt token'
}
```

### GET /me

Requires the `Authorization: Bearer TOKEN` header.
Returns the current user if the token is valid

```json
{
  "username": 'a unique thing'
}
```

### POST LOGIN

Accepts the following body:

```json
{
  "username": 'a unique thing',
  "password": 'a long password'
}
```

It will return a JWT token, encapsulated with an object:

```json
{
  "status": 'ok',
  "token": 'a jwt token'
}
```

## API

It adds the same decorators of
[fastify-jwt](https://github.com/fastify/fastify-jwt).

### createUser(app, { username, password })

Utility function to help writing unit tests against this module. It
returns a JWT `token` for the given user and an `inject` function to
call HTTP endpoint with that token.

Example:

```js
const Fastify = require('fastify')
const AuthMongoJwt = require('@matteo.collina/fastify-auth-mongo-jwt')
const { createUser } = AuthMongoJwt

async function run () {
  const app = Fastify({
    logger: {
      level: 'error'
    }
  })

  app.register(AuthMongoJwt, {
    auth: {
      secret: 'thisisalongsecretjustfortests'
    },
    mongodb: {
      url: 'mongodb://mongo/mydb',
      w: 1,
      useNewUrlParser: true
    }
  })

  app.register(async function (app, opts) {
    app.addHook('preValidation', function (req, reply) {
      return req.jwtVerify()
    })

    app.get('/username', async function (req, reply) {
      return req.user.username
    })
  }, { prefix: '/protected' })

  const {
    token, // this is the JWT token
    inject // utility function to inject with that token
  } = await createUser(app)

  const res = await inject({
    url: '/username',
    method: 'GET'
  })

  console.log(JSON.parse(res.body))
}

run()
```

## License

MIT
