import {
  deleteMe,
  forgotPassword,
  login,
  logout,
  logoutAll,
  register,
  resetPassword
} from './src/auth/routes'
import fastify, {FastifyInstance} from 'fastify'

import {AddressInfo} from 'net'
import fastifyCookie from 'fastify-cookie'

export const PORT = 3000
export const opts = {logger: true}
export const build = (opts = {}) => {
  const server = fastify(opts)
  server.register(fastifyCookie)

  server.route({method: 'POST', url: '/register', ...register})
  server.route({method: 'DELETE', url: '/logout', ...logout})
  server.route({method: 'DELETE', url: '/logout-all', ...logoutAll})
  server.route({method: 'POST', url: '/login', ...login})
  server.route({method: 'POST', url: '/forgot-password', ...forgotPassword})
  server.route({method: 'POST', url: '/reset-password', ...resetPassword})
  server.route({method: 'DELETE', url: '/me', ...deleteMe})
  return server
}

const serverInstance = build(opts)

serverInstance.listen(PORT, (err) => {
  if (err) {
    serverInstance.log.error(err)
    throw new Error('something went wrong')
  }

  const {port} = serverInstance.server.address() as AddressInfo
  serverInstance.log.info(`server listening on ${port}`)
})
