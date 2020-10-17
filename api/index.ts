import * as fastify from 'fastify'
import * as fastifyCookie from 'fastify-cookie'

import {
  deleteMe,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword
} from './services/auth/routes'

import {AddressInfo} from 'net'

const server: fastify.FastifyInstance = fastify({logger: true})

server.register(fastifyCookie)

server.route({
  method: 'POST',
  url: '/register',
  schema: register.schema,
  preHandler: register.preHandler,
  handler: register.handler
})

server.route({
  method: 'POST',
  url: '/logout',
  preHandler: logout.preHandler,
  handler: logout.handler
})

server.route({
  method: 'POST',
  url: '/login',
  schema: login.schema,
  handler: login.handler
})

server.route({
  method: 'POST',
  url: '/forgot-password',
  schema: forgotPassword.schema,
  handler: forgotPassword.handler
})

server.route({
  method: 'POST',
  url: '/reset-password',
  schema: resetPassword.schema,
  handler: resetPassword.handler
})

server.route({
  method: 'DELETE',
  url: '/me',
  preHandler: deleteMe.preHandler,
  handler: deleteMe.handler
})

server.listen(3000, (err) => {
  if (err) {
    server.log.error(err)
    throw new Error('something went wrong')
  }

  server.log.info(`server listening on ${server.server.address().port}`)
})
