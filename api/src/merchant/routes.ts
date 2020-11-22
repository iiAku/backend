import * as Keyv from 'keyv'

import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {authPreHandler} from '../utils'
import {config} from '../config'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const isDev = config.env === 'dev'
const prisma = new PrismaClient()
// Const keyv = new Keyv("redis://user:pass@localhost:6379")
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})

/**
 * Add a new merchant
 *
 * @name Merchant
 * @path {POST} /merchant
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {String} email Email used for registration
 * @body {String} password Password used for registration
 */
const addMerchantHandler = async (request: any, reply: FastifyReply) => {
  const {uid} = request.auth
  const insert = {
    uid,
    id: uuidv4(),
    ...request.body
  }
  console.log(insert)
  prisma.merchant.create({
    data: {}
  })
  const merchant = await prisma.merchant.create({
    data: {
      uid: uid,
      id: uuidv4(),
      name: 'Coca Cola',
      description: 'A company selling bottles',
      siret: '1293848484747',
      address_line: '20 rue des coquelicots',
      address_line_2: '',
      city: 'Paris',
      state: 'Ile-de-france',
      zip: '75011',
      country: 'France'
    }
  })
  return reply.code(200).send({
    data: merchant,
    message: messages.merchant.MERCHANT_ADDED
  })
}

const addMerchant = {
  schema: {
    body: {
      type: 'object',
      required: [
        'name',
        'description',
        'siret',
        'address_line',
        'city',
        'state',
        'zip',
        'country'
      ],
      properties: {
        name: {type: 'string'},
        description: {type: 'string'},
        siret: {type: 'string'},
        address_line: {type: 'string'},
        address_line_2: {type: 'string'},
        city: {type: 'string'},
        state: {type: 'string'},
        zip: {type: 'string'},
        country: {type: 'string'}
      }
    }
  },
  handler: addMerchantHandler,
  preHandler: authPreHandler
}

// exported routes
export const merchantRoutes = [
  {method: 'POST', url: '/merchant', ...addMerchant}
  // {method: 'PUT', url: '/merchant', ...editMerchant}
  // {method: 'DELETE', url: '/merchant', ...addMerchant},
]
