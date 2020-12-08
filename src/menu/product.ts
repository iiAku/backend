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
 * Get a menu-product from user
 *
 * @namespace MenuProduct
 * @path {GET} /menu-product/:productId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getProductHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {productId} = request.params
  const menuProduct = await prisma.menuProduct.findUnique({
    where: {
      id_organizationId: {
        organizationId,
        id: productId
      }
    }
  })

  return reply.code(200).send({
    data: menuProduct,
    message: null
  })
}

/**
 * Get all menu-product from user
 *
 * @namespace MenuProduct
 * @path {GET} /menu-product
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getAllProductHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuCategories = await prisma.menuProduct.findMany({
    where: {organizationId: organizationId}
  })
  return reply.code(200).send({
    data: menuCategories,
    message: null
  })
}

/**
 * Add a new menu-product
 *
 * @namespace MenuProduct
 * @path {POST} /menu-product
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const addProductHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuProduct = await prisma.menuProduct.create({
    data: {
      id: uuidv4(),
      ...request.body,
      Organization: {
        connect: {id: organizationId}
      }
    }
  })
  return reply.code(200).send({
    data: menuProduct,
    message: messages.default.ADDED
  })
}

/**
 * Edit an existing menu-product
 *
 * @namespace MenuProduct
 * @path {PUT} /menu-product/:productId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const editProductHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {productId} = request.params
  const menuProduct = await prisma.menuProduct.update({
    where: {
      id_organizationId: {
        id: productId,
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
    data: menuProduct,
    message: messages.default.UPDATED
  })
}

/**
 * Delete an existing menu-product
 *
 * @namespace MenuProduct
 * @path {DELETE} /menu-product/:productId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const deleteProductHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {productId} = request.params
  const menuProduct = await prisma.menuProduct.delete({
    where: {
      id_organizationId: {
        id: productId,
        organizationId
      }
    }
  })
  return reply.code(200).send({
    data: menuProduct,
    message: messages.default.DELETED
  })
}

const getProduct = {
  handler: getProductHandler,
  schema: {
    params: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: {type: 'string', format: 'uuid'}
      }
    }
  },
  preHandler: authPreHandler
}

const getAllProducts = {
  handler: getAllProductHandler,
  preHandler: authPreHandler
}

const addProduct = {
  schema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {type: 'string'},
        description: {type: 'string'}
      }
    }
  },
  handler: addProductHandler,
  preHandler: authPreHandler
}

const editProduct = {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: {type: 'string'},
        description: {type: 'string'}
      }
    },
    params: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: editProductHandler,
  preHandler: authPreHandler
}

const deleteProduct = {
  schema: {
    params: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: deleteProductHandler,
  preHandler: authPreHandler
}

// exported routes
export const routes: RouteOptions[] = [
  {method: 'GET', url: '/menu-product', ...getAllProducts},
  {method: 'GET', url: '/menu-product/:productId', ...getProduct},
  {method: 'POST', url: '/menu-product', ...addProduct},
  {method: 'PUT', url: '/menu-product/:productId', ...editProduct},
  {method: 'DELETE', url: '/menu-product/:productId', ...deleteProduct}
]
