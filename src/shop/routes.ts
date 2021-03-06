import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {RouteOptions} from 'fastify/types/route'
import {authPreHandler} from '../utils'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const prisma = new PrismaClient()

/**
 * Get a shop from organization
 *
 * @namespace Shop
 * @path {GET} /shop/:shopId
 * @query shopId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 *
 */
const getShopHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {shopId} = request.params
  const shop = await prisma.shop.findUnique({
    where: {
      id_organizationId: {
        id: shopId,
        organizationId
      }
    },
    include: {
      menus: true
    }
  })
  return reply.code(200).send({
    data: shop,
    message: null
  })
}

/**
 * Get all shop from organization
 *
 * @namespace Shop
 * @path {GET} /shop
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 *
 */
const getAllShopHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const shops = await prisma.shop.findMany({
    where: {organizationId},
    include: {
      menus: true
    }
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
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
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
  const {organizationId} = request.auth
  const shop = await prisma.shop.create({
    data: {
      id: uuidv4(),
      ...request.body,
      Organization: {
        connect: {id: organizationId}
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: messages.default.ADDED
  })
}

/**
 * Edit an existing shop
 *
 * @namespace Shop
 * @path {PUT} /shop/:shopId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
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
  const {organizationId} = request.auth
  const {shopId} = request.params
  const shop = await prisma.shop.update({
    where: {
      id_organizationId: {
        id: shopId,
        organizationId
      }
    },
    data: {
      ...request.body,
      Organization: {
        connect: {id: organizationId}
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: messages.default.UPDATED
  })
}

/**
 * Delete an existing shop
 *
 * @namespace Shop
 * @path {DELETE} /shop/:shopId
 * @query shopId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 */
const deleteShopHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {shopId} = request.params
  const shop = await prisma.shop.delete({
    where: {
      id_organizationId: {
        id: shopId,
        organizationId
      }
    }
  })
  return reply.code(200).send({
    data: shop,
    message: messages.default.DELETED
  })
}

const getShop = {
  handler: getShopHandler,
  schema: {
    params: {
      type: 'object',
      required: ['shopId'],
      properties: {
        shopId: {type: 'string', format: 'uuid'}
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
        shopId: {type: 'string', format: 'uuid'}
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
        shopId: {type: 'string', format: 'uuid'}
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
