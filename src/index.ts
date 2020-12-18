import {AddressInfo} from 'net'
import {RouteOptions} from 'fastify/types/route'
import fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import {routes as menuCategoryRoutes} from './menu/category'
import {routes as menuProductOptionRoutes} from './menu/option'
import {routes as menuProductRoutes} from './menu/product'
import {routes as menuRoutes} from './menu/routes'
import {routes as organizationRoutes} from './organization/routes'
import {routes as shopRoutes} from './shop/routes'

const routes: RouteOptions[] = [
  ...organizationRoutes,
  ...shopRoutes,
  ...menuCategoryRoutes,
  ...menuProductRoutes,
  ...menuProductOptionRoutes,
  ...menuRoutes
]

export const PORT = process.env.PORT || 3000
export const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1'
export const options = {logger: true}
export const build = (options = {}) => {
  const server = fastify(options)
  server.register(fastifyCors)
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
