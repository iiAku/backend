import fastify, {FastifyInstance} from 'fastify'

import {AddressInfo} from 'net'
import {authRoutes} from './src/auth/routes'
import fastifyCookie from 'fastify-cookie'
import {merchantRoutes} from './src/merchant/routes'

const routes = authRoutes.concat(merchantRoutes)

export const PORT = 3000
export const opts = {logger: true}
export const build = (opts = {}) => {
  const server = fastify(opts)
  server.register(fastifyCookie)

  for (const route of routes) {
    server.route(route)
  }
  return server
}

const serverInstance = build(opts)

serverInstance.listen(PORT, (err: any) => {
  if (err) {
    serverInstance.log.error(err)
    throw new Error('something went wrong')
  }

  const {port} = serverInstance.server.address() as AddressInfo
  serverInstance.log.info(`server listening on ${port}`)
})
