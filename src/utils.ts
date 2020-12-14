import * as Keyv from 'keyv'

import {validate, version} from 'uuid'

import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {config} from './config'
import {messages} from './messages'

const prisma = new PrismaClient()
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})

export const isUUID = (uuid: string, uuidVersion: number) =>
  validate(uuid) && version(uuid) === uuidVersion

export const emailExist = async (email: string) => {
  const userWithEmail = await prisma.organization.findUnique({
    where: {
      email
    }
  })
  if (userWithEmail !== null) {
    return true
  }

  return false
}

export const authPreHandler = async (request: any, reply: FastifyReply) => {
  if (
    !request.cookies ||
    !(config.AUTH_COOKIE_NAME in request.cookies) ||
    !isUUID(request.cookies[config.AUTH_COOKIE_NAME], 4)
  ) {
    return reply.code(401).send({message: messages.auth.INVALID_COOKIE})
  }

  const {token} = request.cookies
  let auth = await keyv.get(token)

  if (!auth) {
    const userFromToken = await prisma.auth.findUnique({
      where: {id: token},
      include: {Organization: true}
    })
    if (!userFromToken) {
      return reply.code(403).send({message: messages.auth.EXPIRED_COOKIE})
    }

    auth = userFromToken
  }

  await keyv.set(token, auth, 120 * 1000)
  request.auth = auth
}

// export const flatItems = (obj: any) => {
//   Object.keys(obj).forEach((key) => {
//     if (typeof obj[key] === 'object' && obj[key] != null) {
//       if (Array.isArray(obj[key])) {
//         obj[key] = obj[key].map((x) => ({...Object.values(x).pop()}))
//       }
//       flatItems(obj[key])
//     }
//   })
//   return obj
// }
