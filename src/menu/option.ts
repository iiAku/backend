import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {RouteOptions} from 'fastify/types/route'
import {authPreHandler} from '../utils'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const prisma = new PrismaClient()

/**
 * Get a menu-option from organization
 *
 * @namespace MenuProductOption
 * @path {GET} /menu-option/:optionId
 * @auth This route requires a valid Authorization token set in headers
 * @query optionId
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 *
 */
const getProductOptionHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {optionId} = request.params
  const menuProductOption = await prisma.menuProductOption.findUnique({
    where: {
      id_organizationId: {
        organizationId,
        id: optionId
      }
    }
  })

  return reply.code(200).send({
    data: menuProductOption,
    message: null
  })
}

/**
 * Get all menu-option from organization
 *
 * @namespace MenuProductOption
 * @path {GET} /menu-option
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 *
 */
const getAllProductOptionHandler = async (
  request: any,
  reply: FastifyReply
) => {
  const {organizationId} = request.auth
  const menuCategories = await prisma.menuProductOption.findMany({
    where: {organizationId}
  })
  return reply.code(200).send({
    data: menuCategories,
    message: null
  })
}

/**
 * Add a new menu-option
 *
 * @namespace MenuProductOption
 * @path {POST} /menu-option
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 * @body {string} description
 */
const addProductOptionHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuProductOption = await prisma.menuProductOption.create({
    data: {
      id: uuidv4(),
      ...request.body,
      Organization: {
        connect: {id: organizationId}
      }
    }
  })
  return reply.code(200).send({
    data: menuProductOption,
    message: messages.default.ADDED
  })
}

/**
 * Edit an existing menu-option
 *
 * @namespace MenuProductOption
 * @path {PUT} /menu-option/:optionId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 * @body {string} description
 */
const editProductOptionHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {optionId} = request.params
  const menuProductOption = await prisma.menuProductOption.update({
    where: {
      id_organizationId: {
        id: optionId,
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
    data: menuProductOption,
    message: messages.default.UPDATED
  })
}

/**
 * Delete an existing menu-option
 *
 * @namespace MenuProductOption
 * @path {DELETE} /menu-option/:optionId
 * @query optionId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 */
const deleteProductOptionHandler = async (
  request: any,
  reply: FastifyReply
) => {
  const {organizationId} = request.auth
  const {optionId} = request.params
  const menuProductOption = await prisma.menuProductOption.delete({
    where: {
      id_organizationId: {
        id: optionId,
        organizationId
      }
    }
  })
  return reply.code(200).send({
    data: menuProductOption,
    message: messages.default.DELETED
  })
}

const getProductOption = {
  handler: getProductOptionHandler,
  schema: {
    params: {
      type: 'object',
      required: ['optionId'],
      properties: {
        optionId: {type: 'string', format: 'uuid'}
      }
    }
  },
  preHandler: authPreHandler
}

const getAllProductOptions = {
  handler: getAllProductOptionHandler,
  preHandler: authPreHandler
}

const addProductOption = {
  schema: {
    body: {
      type: 'object',
      required: ['description'],
      properties: {
        description: {type: 'string'}
      }
    }
  },
  handler: addProductOptionHandler,
  preHandler: authPreHandler
}

const editProductOption = {
  schema: {
    body: {
      type: 'object',
      properties: {
        description: {type: 'string'}
      }
    },
    params: {
      type: 'object',
      required: ['optionId'],
      properties: {
        optionId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: editProductOptionHandler,
  preHandler: authPreHandler
}

const deleteProductOption = {
  schema: {
    params: {
      type: 'object',
      required: ['optionId'],
      properties: {
        optionId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: deleteProductOptionHandler,
  preHandler: authPreHandler
}

// exported routes
export const routes: RouteOptions[] = [
  {method: 'GET', url: '/menu-option', ...getAllProductOptions},
  {method: 'GET', url: '/menu-option/:optionId', ...getProductOption},
  {method: 'POST', url: '/menu-option', ...addProductOption},
  {method: 'PUT', url: '/menu-option/:optionId', ...editProductOption},
  {method: 'DELETE', url: '/menu-option/:optionId', ...deleteProductOption}
]
