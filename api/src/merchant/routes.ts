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
 * @namespace Merchant
 * @path {POST} /merchant
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {string} name
 * @body {string} description
 * @body {string} siret
 * @body {string} address_line
 * @body {string} address_line2
 * @body {string} city
 * @body {string} state
 * @body {string} zip
 * @body {string} country
 */
const addMerchantHandler = async (request: any, reply: FastifyReply) => {
  const {uid} = request.auth
  const merchant = await prisma.merchant.create({
    data: {
      id: uuidv4(),
      ...request.body,
      User: {
        connect: {id: uid}
      }
    }
  })
  return reply.code(200).send({
    data: merchant,
    message: messages.merchant.MERCHANT_ADDED
  })
}

/**
 * Edit an existing merchant
 *
 * @namespace Merchant
 * @path {PUT} /merchant/:merchantId
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {string} name
 * @body {string} description
 * @body {string} siret
 * @body {string} address_line
 * @body {string} address_line2
 * @body {string} city
 * @body {string} state
 * @body {string} zip
 * @body {string} country
 */
const editMerchantHandler = async (request: any, reply: FastifyReply) => {
  const {uid} = request.auth
  const {merchantId} = request.params
  const merchant = await prisma.merchant.update({
    where: {
      uid_id: {
        id: merchantId,
        uid
      }
    },
    data: {
      ...request.body,
      User: {
        connect: {id: uid}
      }
    }
  })
  return reply.code(200).send({
    data: merchant,
    message: messages.merchant.MERCHANT_UPDATED
  })
}

/**
 * Delete an existing merchant
 *
 * @namespace Merchant
 * @path {DELETE} /merchant/:merchantId
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {string} name
 * @body {string} description
 * @body {string} siret
 * @body {string} address_line
 * @body {string} address_line2
 * @body {string} city
 * @body {string} state
 * @body {string} zip
 * @body {string} country
 */
const deleteMerchantHandler = async (request: any, reply: FastifyReply) => {
  const {uid} = request.auth
  const {merchantId} = request.params
  const merchant = await prisma.merchant.delete({
    where: {
      uid_id: {
        id: merchantId,
        uid
      }
    }
  })
  return reply.code(200).send({
    data: merchant,
    message: messages.merchant.MERCHANT_DELETED
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

const editMerchant = {
  schema: {
    body: {
      type: 'object',
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
    },
    params: {
      type: 'object',
      required: ['merchantId'],
      properties: {
        resetToken: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: editMerchantHandler,
  preHandler: authPreHandler
}

const deleteMerchant = {
  schema: {
    params: {
      type: 'object',
      required: ['merchantId'],
      properties: {
        resetToken: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: deleteMerchantHandler,
  preHandler: authPreHandler
}

// exported routes
export const merchantRoutes = [
  {method: 'POST', url: '/merchant', ...addMerchant},
  {method: 'PUT', url: '/merchant/:merchantId', ...editMerchant},
  {method: 'DELETE', url: '/merchant/:merchantId', ...deleteMerchant}
]
