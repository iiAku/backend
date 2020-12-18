import fastify, {FastifyInstance} from 'fastify'

import {AddressInfo} from 'net'
import {RouteOptions} from 'fastify/types/route'
import fastifyCookie from 'fastify-cookie'
import fastifyCors from 'fastify-cors'
import {routes as organizationRoutes} from './organization/routes'
import {routes as shopRoutes} from './shop/routes'

const routes: RouteOptions[] = [...organizationRoutes, ...shopRoutes]

export const PORT = process.env.PORT || 3000
export const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1'
export const options = {logger: true}
export const build = (options = {}) => {
  const server = fastify(options)
  server.register(fastifyCookie)
  server.register(fastifyCors, {
    origin: (origin, cb) => {
      if (
        /localhost/.test(origin) ||
        /bobdashboard\.herokuapp\.com/.test(origin)
      ) {
        return cb(null, true)
      }
    },
    credentials: true
  })
  for (const route of routes) {
    console.log(`${route.method} ${route.url}`)
    server.route(route)
  }

  return server
}

const serverInstance = build(options)

serverInstance.listen(PORT, HOST, (err: any) => {
  if (err) {
    serverInstance.log.error(err)
    throw new Error('something went wrong')
  }

  const {port} = serverInstance.server.address() as AddressInfo
  serverInstance.log.info(`server listening on ${port}`)
})
