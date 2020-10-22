import {
  deleteMe,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword
} from './services/auth/routes'
import fastify, {FastifyInstance} from 'fastify'

import {AddressInfo} from 'net'
import fastifyCookie from 'fastify-cookie'

const server: FastifyInstance = fastify({logger: true})

server.register(fastifyCookie)

server.route({method: 'POST', url: '/register', ...register})
server.route({method: 'POST', url: '/logout', ...logout})
server.route({method: 'POST', url: '/login', ...login})
server.route({method: 'POST', url: '/forgot-password', ...forgotPassword})
server.route({method: 'POST', url: '/reset-password', ...resetPassword})
server.route({method: 'DELETE', url: '/me', ...deleteMe})

server.listen(3000, (err) => {
  if (err) {
    server.log.error(err)
    throw new Error('something went wrong')
  }

  const {port} = server.server.address() as AddressInfo
  server.log.info(`server listening on ${port}`)
})
