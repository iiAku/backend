import * as Keyv from 'keyv'

import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {RouteOptions} from 'fastify/types/route'
import {authPreHandler} from '../utils'
import {config} from '../config'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const isDev = config.env === 'dev'
const prisma = new PrismaClient()
// Const keyv = new Keyv("redis://user:pass@localhost:6379")
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})

/**
 * Get a shop from user
 *
 * @namespace Shop
 * @path {GET} /shop/:shopId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getShopHandler = async (request: any, reply: FastifyReply) => {
  const {oid} = request.auth
  const {shopId} = request.params
  const shop = await prisma.shop.findUnique({
    where: {
      id_oid: {
        id: shopId,
        oid
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: null
  })
}

/**
 * Get all shop from user
 *
 * @namespace Shop
 * @path {GET} /shop
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getAllShopHandler = async (request: any, reply: FastifyReply) => {
  const {oid} = request.auth
  const shops = await prisma.shop.findMany({
    where: {oid}
  })
  return reply.code(200).send({
    data: shops,
    message: null
  })
}

/**
 * Add a new shop
 *
 * @namespace Shop
 * @path {POST} /shop
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
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
const addShopHandler = async (request: any, reply: FastifyReply) => {
  const {oid} = request.auth
  const shop = await prisma.shop.create({
    data: {
      id: uuidv4(),
      ...request.body,
      Organization: {
        connect: {id: oid}
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: messages.shop.SHOP_ADDED
  })
}

/**
 * Edit an existing shop
 *
 * @namespace Shop
 * @path {PUT} /shop/:shopId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
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
const editShopHandler = async (request: any, reply: FastifyReply) => {
  const {oid} = request.auth
  const {shopId} = request.params
  const shop = await prisma.shop.update({
    where: {
      id_oid: {
        id: shopId,
        oid
      }
    },
    data: {
      ...request.body,
      Organization: {
        connect: {id: oid}
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: messages.shop.SHOP_UPDATED
  })
}

/**
 * Delete an existing shop
 *
 * @namespace Shop
 * @path {DELETE} /shop/:shopId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
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
const deleteShopHandler = async (request: any, reply: FastifyReply) => {
  const {oid} = request.auth
  const {shopId} = request.params
  const shop = await prisma.shop.delete({
    where: {
      id_oid: {
        id: shopId,
        oid
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: messages.shop.SHOP_DELETED
  })
}

const getShop = {
  handler: getShopHandler,
  schema: {
    params: {
      type: 'object',
      required: ['shopId'],
      properties: {
        resetToken: {type: 'string', format: 'uuid'}
      }
    }
  },
  preHandler: authPreHandler
}

const getAllShops = {
  handler: getAllShopHandler,
  preHandler: authPreHandler
}

const addShop = {
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
  handler: addShopHandler,
  preHandler: authPreHandler
}

const editShop = {
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
      required: ['shopId'],
      properties: {
        resetToken: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: editShopHandler,
  preHandler: authPreHandler
}

const deleteShop = {
  schema: {
    params: {
      type: 'object',
      required: ['shopId'],
      properties: {
        resetToken: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: deleteShopHandler,
  preHandler: authPreHandler
}

// exported routes
export const routes: RouteOptions[] = [
  {method: 'GET', url: '/shop', ...getAllShops},
  {method: 'GET', url: '/shop/:shopId', ...getShop},
  {method: 'POST', url: '/shop', ...addShop},
  {method: 'PUT', url: '/shop/:shopId', ...editShop},
  {method: 'DELETE', url: '/shop/:shopId', ...deleteShop}
]
