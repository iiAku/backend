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
 * Get a menu-category from user
 *
 * @namespace MenuCategory
 * @path {GET} /menu-category/:categoryId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {categoryId} = request.params
  const menuCategory = await prisma.menuCategory.findUnique({
    where: {
      id_orgnanizationId: {
        id: categoryId,
        orgnanizationId: organizationId
      }
    }
  })

  return reply.code(200).send({
    data: menuCategory,
    message: null
  })
}

/**
 * Get all menu-category from user
 *
 * @namespace MenuCategory
 * @path {GET} /menu-category
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getAllCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuCategories = await prisma.menuCategory.findMany({
    where: {orgnanizationId: organizationId}
  })
  return reply.code(200).send({
    data: menuCategories,
    message: null
  })
}

/**
 * Add a new menu-category
 *
 * @namespace MenuCategory
 * @path {POST} /menu-category
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const addCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuCategory = await prisma.menuCategory.create({
    data: {
      id: uuidv4(),
      ...request.body,
      Organization: {
        connect: {id: organizationId}
      }
    }
  })
  return reply.code(200).send({
    data: menuCategory,
    message: messages.default.ADDED
  })
}

/**
 * Edit an existing menu-category
 *
 * @namespace MenuCategory
 * @path {PUT} /menu-category/:categoryId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const editCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {categoryId} = request.params
  const menuCategory = await prisma.menuCategory.update({
    where: {
      id_orgnanizationId: {
        id: categoryId,
        orgnanizationId: organizationId
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
    data: menuCategory,
    message: messages.default.UPDATED
  })
}

/**
 * Delete an existing menu-category
 *
 * @namespace MenuCategory
 * @path {DELETE} /menu-category/:categoryId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const deleteCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {categoryId} = request.params
  const menuCategory = await prisma.menuCategory.delete({
    where: {
      id_orgnanizationId: {
        id: categoryId,
        orgnanizationId: organizationId
      }
    }
  })
  return reply.code(200).send({
    data: menuCategory,
    message: messages.default.DELETED
  })
}

const getCategory = {
  handler: getCategoryHandler,
  schema: {
    params: {
      type: 'object',
      required: ['categoryId'],
      properties: {
        categoryId: {type: 'string', format: 'uuid'}
      }
    }
  },
  preHandler: authPreHandler
}

const getAllCategorys = {
  handler: getAllCategoryHandler,
  preHandler: authPreHandler
}

const addCategory = {
  schema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {type: 'string'}
      }
    }
  },
  handler: addCategoryHandler,
  preHandler: authPreHandler
}

const editCategory = {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: {type: 'string'}
      }
    },
    params: {
      type: 'object',
      required: ['categoryId'],
      properties: {
        categoryId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: editCategoryHandler,
  preHandler: authPreHandler
}

const deleteCategory = {
  schema: {
    params: {
      type: 'object',
      required: ['categoryId'],
      properties: {
        categoryId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: deleteCategoryHandler,
  preHandler: authPreHandler
}

// exported routes
export const routes: RouteOptions[] = [
  {method: 'GET', url: '/menu-category', ...getAllCategorys},
  {method: 'GET', url: '/menu-category/:categoryId', ...getCategory},
  {method: 'POST', url: '/menu-category', ...addCategory},
  {method: 'PUT', url: '/menu-category/:categoryId', ...editCategory},
  {method: 'DELETE', url: '/menu-category/:categoryId', ...deleteCategory}
]
