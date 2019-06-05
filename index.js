'use strict'

const fp = require('fastify-plugin')
const routes = require('./routes')
const JWT = require('fastify-jwt')
const Mongo = require('fastify-mongodb')

module.exports = fp(async function (app, opts) {
  if (!app.mongo) {
    app.register(Mongo, opts.mongo || opts.mongodb)
  }

  app.register(JWT, Object.assign(
    {},
    { secret: process.env.JWT_SECRET },
    opts.auth
  ))

  app.register(routes, {
    prefix: opts.prefix
  })
})

async function createUser (app, body = { username: 'matteo', password: 'matteo' }) {
  let res = await app.inject({
    url: '/signup',
    method: 'POST',
    body
  })

  const token = JSON.parse(res.body).token

  // null because we create a closure on them
  // free up resources
  res = null

  return { token, inject }

  function inject (opts) {
    opts = opts || {}
    opts.headers = opts.headers || {}
    opts.headers.authorization = `Bearer ${token}`

    return app.inject(opts)
  }
}

module.exports.createUser = createUser
