import * as fastify from "fastify";

import { login, register } from "./services/auth/routes";

const server: fastify.FastifyInstance = fastify({ logger: true });

server.post(
  "/register",
  { schema: { body: register.schema } },
  register.handler
);

server.post("/login", { schema: { body: login.schema } }, login.handler);

server.listen(3000, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`server listening on ${server.server.address().port}`);
});
