'use strict'

const securePassword = require('secure-password')
const DUPLICATE_KEY_ERROR = 11000

module.exports = async function (app, opts) {
  const users = app.mongo.db.collection('users')
  const pwd = securePassword()

  // Ensure that there is an index on username
  // so we do not store duplicated entries
  await users.createIndex({
    username: 1
  }, { unique: true })

  app.post('/signup', {
    schema: {
      body: {
        type: 'object',
        properties: {
          username: {
            type: 'string'
          },
          password: {
            type: 'string'
          }
        },
        required: ['username', 'password']
      }
    }
  }, async function (req, reply) {
    const { username, password } = req.body

    const hashedPassword = await pwd.hash(Buffer.from(password))
    try {
      await users.insertOne({ username, hashedPassword })
    } catch (err) {
      if (err.code === DUPLICATE_KEY_ERROR) {
        reply.code(400).send({ status: 'not ok' })
        return
      }
      throw err
    }

    const token = await reply.jwtSign({ username })

    return { status: 'ok', token }
  })

  app.get('/me', {
    beforeHandler: async (request, reply) => {
      await request.jwtVerify()
    }
  }, async function (req, reply) {
    return req.user
  })

  app.post('/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          username: {
            type: 'string'
          },
          password: {
            type: 'string'
          }
        },
        required: ['username', 'password']
      }
    }
  }, async function (req, reply) {
    const { username, password } = req.body

    const user = await users.findOne({ username })

    const res = await pwd.verify(Buffer.from(password), user.hashedPassword.buffer)

    if (res === securePassword.INVALID_UNRECOGNIZED_HASH) {
      throw new Error('invalid unrecognized hash')
    } else if (res === securePassword.INVALID) {
      reply.code(400)
      return { status: 'not ok' }
    } else if (res === securePassword.VALID_NEEDS_REHASH) {
      req.log.info({ username }, 'password needs rehashing')
      const hashedPassword = await pwd.hash(Buffer.from(password))
      await users.update({ _id: user._id }, { hashedPassword })
    }

    const token = await reply.jwtSign({ username })

    return { status: 'ok', token }
  })
}
