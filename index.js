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
