import fastify, {FastifyInstance} from 'fastify'

import {AddressInfo} from 'net'
import {authRoutes} from './src/auth/routes'
import fastifyCookie from 'fastify-cookie'
import {merchantRoutes} from './src/merchant/routes'

const routes = authRoutes.concat(merchantRoutes)

export const PORT = 3000
export const options = {logger: true}
export const build = (options = {}) => {
  const server = fastify(options)
  server.register(fastifyCookie)

  for (const route of routes) {
    console.log(`${route.method} ${route.url}`)
    server.route(route)
  }

  return server
}

const serverInstance = build(options)

serverInstance.listen(PORT, (err: any) => {
  if (err) {
    serverInstance.log.error(err)
    throw new Error('something went wrong')
  }

  const {port} = serverInstance.server.address() as AddressInfo
  serverInstance.log.info(`server listening on ${port}`)
})
