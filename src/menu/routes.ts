import * as Keyv from 'keyv'

import {Prisma, PrismaClient} from '@prisma/client'
import {authPreHandler, flatItems, isUUID} from '../utils'

import {FastifyReply} from 'fastify'
import {RouteOptions} from 'fastify/types/route'
import {config} from '../config'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const isDev = config.env === 'dev'
const prisma = new PrismaClient()
// Const keyv = new Keyv("redis://user:pass@localhost:6379")
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})

/**
 * Get a menu from user
 *
 * @namespace Menu
 * @path {GET} /menu/:menuId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getMenuHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {menuId} = request.params
  const menu = await prisma.menu.findUnique({
    where: {
      id: menuId
    },
    select: {
      name: true,
      categories: {
        select: {
          MenuCategory: {
            select: {
              id: true,
              name: true
            }
          },
          products: {
            select: {
              MenuProduct: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              },
              price: true,
              options: {
                select: {
                  price: true,
                  MenuProductOption: {
                    select: {
                      id: true,
                      description: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  return reply.code(200).send({
    data: flatItems(menu),
    message: null
  })
}

/**
 * Get all menu from user
 *
 * @namespace Menu
 * @path {GET} /menu
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 *
 */
const getAllMenuHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const menuCategories = await prisma.menu.findMany({
    where: {organizationId},
    select: {
      id: true,
      name: true
    }
  })
  return reply.code(200).send({
    data: menuCategories,
    message: null
  })
}

/**
 * Add a new menu
 *
 * @namespace Menu
 * @path {POST} /menu
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 * @param {{id: string, price: Number}} products
 * @param {{id: string, price: Number}} options
 */

const addMenuFunc = (request: any, reply: FastifyReply, withMenuId = '') => {
  const {organizationId} = request.auth
  const {name, categories} = request.body

  const menuId = isUUID(withMenuId, 4) ? withMenuId : uuidv4()
  const linkedCategories: Prisma.categoriesCreateOrConnectWithoutMenuInput[] = []

  for (const category of categories) {
    const {id: categoryId, products} = category
    const categoriesId = uuidv4()
    linkedCategories.push({
      where: {
        menuId_categoryId: {
          menuId,
          categoryId
        }
      },
      create: {
        id: categoriesId,
        MenuCategory: {
          connect: {
            id_organizationId: {
              id: categoryId,
              organizationId
            }
          }
        },
        products: {
          connectOrCreate: products.map((product: any) => {
            const {id: productId, price, options} = product
            const productsId = uuidv4()
            return {
              where: {
                productId_categoriesId: {
                  productId,
                  categoriesId
                }
              },
              create: {
                id: productsId,
                price,
                MenuProduct: {
                  connect: {
                    id_organizationId: {
                      id: productId,
                      organizationId
                    }
                  }
                },
                options: {
                  connectOrCreate: options.map((option: any) => {
                    const {id: optionId, price} = option
                    return {
                      where: {
                        productId_optionId: {
                          productId: productsId,
                          optionId
                        }
                      },
                      create: {
                        id: uuidv4(),
                        price,
                        MenuProductOption: {
                          connect: {
                            id_organizationId: {
                              id: optionId,
                              organizationId
                            }
                          }
                        }
                      }
                    }
                  })
                }
              }
            }
          })
        }
      }
    })
  }

  return prisma.menu.create({
    data: {
      id: menuId,
      name,
      categories: {
        connectOrCreate: linkedCategories
      },
      Organization: {
        connect: {
          id: organizationId
        }
      }
    }
  })
}

const addMenuHandler = async (request: any, reply: FastifyReply) => {
  const menu = await addMenuFunc(request, reply)
  return reply.code(200).send({
    data: menu,
    message: messages.default.ADDED
  })
}

/**
 * Edit an existing menu
 *
 * @namespace Menu
 * @path {PUT} /menu/:menuId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const editMenuHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {name, categories} = request.body
  const {menuId} = request.params

  const addNewMenu = addMenuFunc(request, reply, menuId)
  const deleteOldMenu = deleteMenuFunc(request, reply)
  const [editedMenu] = await prisma.$transaction([addNewMenu, deleteOldMenu])

  return reply.code(200).send({
    data: editedMenu,
    message: messages.default.UPDATED
  })
}

/**
 * Delete an existing menu
 *
 * @namespace Menu
 * @path {DELETE} /menu/:menuId
 * @auth This route requires a valid token cookie set in headers
 * @code {200} if the request is successful
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {string} name
 */
const deleteMenuFunc = (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {menuId} = request.params
  return prisma.$queryRaw`DELETE FROM public."Menu" WHERE id=${menuId} AND "organizationId"=${organizationId}`
  // Comment - raw for now see https://github.com/prisma/prisma/issues/2810
  // return prisma.menu.delete({
  //   where: {
  //     id_organizationId: {
  //       id: menuId,
  //       organizationId
  //     }
  //   }
  // })
}

const deleteMenuHandler = async (request: any, reply: FastifyReply) => {
  const menu = await deleteMenuFunc(request, reply)
  return reply.code(200).send({
    data: menu,
    message: messages.default.DELETED
  })
}

const getMenu = {
  handler: getMenuHandler,
  schema: {
    params: {
      type: 'object',
      required: ['menuId'],
      properties: {
        menuId: {type: 'string', format: 'uuid'}
      }
    }
  },
  preHandler: authPreHandler
}

const getAllMenus = {
  handler: getAllMenuHandler,
  preHandler: authPreHandler
}

const addMenu = {
  schema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {type: 'string'}
      }
    }
  },
  handler: addMenuHandler,
  preHandler: authPreHandler
}

const editMenu = {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: {type: 'string'}
      }
    },
    params: {
      type: 'object',
      required: ['menuId'],
      properties: {
        menuId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: editMenuHandler,
  preHandler: authPreHandler
}

const deleteMenu = {
  schema: {
    params: {
      type: 'object',
      required: ['menuId'],
      properties: {
        menuId: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: deleteMenuHandler,
  preHandler: authPreHandler
}

// exported routes
export const routes: RouteOptions[] = [
  {method: 'GET', url: '/menu', ...getAllMenus},
  {method: 'GET', url: '/menu/:menuId', ...getMenu},
  {method: 'POST', url: '/menu', ...addMenu},
  {method: 'PUT', url: '/menu/:menuId', ...editMenu},
  {method: 'DELETE', url: '/menu/:menuId', ...deleteMenu}
]
