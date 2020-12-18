import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {RouteOptions} from 'fastify/types/route'
import {authPreHandler} from '../utils'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const prisma = new PrismaClient()
/**
 * Get a menu-category from organization
 *
 * @namespace MenuCategory
 * @path {GET} /menu-category/:categoryId
 * @query categoryId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 *
 */
const getCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {categoryId} = request.params
  const menuCategory = await prisma.menuCategory.findUnique({
    where: {
      id_organizationId: {
        id: categoryId,
        organizationId
      }
    }
  })

  return reply.code(200).send({
    data: menuCategory,
    message: null
  })
}

/**
 * Get all menu-category from organization
 *
 * @namespace MenuCategory
 * @path {GET} /menu-category
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 *
 */
const getAllCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuCategories = await prisma.menuCategory.findMany({
    where: {organizationId}
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
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
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
 * @query categoryId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 * @body {string} name
 */
const editCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {categoryId} = request.params
  const menuCategory = await prisma.menuCategory.update({
    where: {
      id_organizationId: {
        id: categoryId,
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
    data: menuCategory,
    message: messages.default.UPDATED
  })
}

/**
 * Delete an existing menu-category
 *
 * @namespace MenuCategory
 * @path {DELETE} /menu-category/:categoryId
 * @query categoryId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 */
const deleteCategoryHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {categoryId} = request.params
  const menuCategory = await prisma.menuCategory.delete({
    where: {
      id_organizationId: {
        id: categoryId,
        organizationId
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
