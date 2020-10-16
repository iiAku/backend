import * as fastify from "fastify"
import * as fastifyCookie from "fastify-cookie"

import { login, logout, register } from "./services/auth/routes"

const server: fastify.FastifyInstance = fastify({ logger: true })

server.register(fastifyCookie)

server.route({
  method: "POST",
  url: "/register",
  schema: register.schema,
  preHandler: register.preHandler,
  handler: register.handler,
})

server.route({
  method: "POST",
  url: "/logout",
  preHandler: logout.preHandler,
  handler: logout.handler,
})

server.post("/login", { schema: { body: login.schema } }, login.handler)

server.listen(3000, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`server listening on ${server.server.address().port}`)
})
