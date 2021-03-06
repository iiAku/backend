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
    !(config.AUTH_HEADER_NAME in request.headers) ||
    !isUUID(request.headers[config.AUTH_HEADER_NAME], 4)
  ) {
    return reply.code(401).send({message: messages.auth.INVALID_TOKEN})
  }

  const token = request.headers[config.AUTH_HEADER_NAME]
  let auth = await keyv.get(token)

  if (!auth) {
    const userFromToken = await prisma.auth.findUnique({
      where: {id: token},
      include: {Organization: true}
    })
    if (!userFromToken) {
      return reply.code(403).send({message: messages.auth.EXPIRED_TOKEN})
    }

    auth = userFromToken
  }

  await keyv.set(token, auth, 120 * 1000)
  request.auth = auth
}

const flatten = (object: any, currentValue: any = {}, i = 0) => {
  const from = object
  const reduced = Object.entries(object).reduce((r, [key, value]) => {
    if (typeof value === 'object' && !Array.isArray(object[key]) && i <= 0) {
      flatten(value, r, i++)
    } else {
      currentValue[key] = value
    }

    return r
  }, currentValue)
  return reduced
}

export const flatItems = (object: any) => {
  Object.keys(object).forEach((key) => {
    if (typeof object[key] === 'object' && object[key] !== null) {
      if (!Array.isArray(object[key])) {
        const content = object[key]
        object[key] = flatten(content)
      }

      flatItems(object[key])
    }
  })
  return object
}
