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

## License

MIT
