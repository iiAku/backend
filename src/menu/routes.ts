import * as Keyv from 'keyv'

import {Prisma, PrismaClient} from '@prisma/client'

import {FastifyReply} from 'fastify'
import {RouteOptions} from 'fastify/types/route'
import {authPreHandler} from '../utils'
import {config} from '../config'
import {messages} from '../messages'
import {options} from '..'
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
      id_organizationId: {
        id: menuId,
        organizationId
      }
    },
    select: {
      categories: {
        select: {
          MenuCategory: {
            select: {
              name: true,
              products: {
                select: {
                  MenuProduct: {
                    select: {
                      name: true,
                      description: true,
                      productPrice: {
                        select: {
                          price: true
                        }
                      },
                      options: {
                        select: {
                          MenuProductOption: {
                            select: {
                              description: true,
                              optionPrice: {
                                select: {
                                  price: true
                                }
                              }
                            }
                          }
                        }
                      }
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
    data: menu,
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
    where: {organizationId}
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
const addMenuHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {name, products} = request.body
  const menuId = uuidv4()

  const categories: Prisma.categoriesCreateOrConnectWithoutMenuInput[] = []
  const productPrices: Prisma.productPriceCreateOrConnectWithoutMenuInput[] = []
  const optionsPrices: Prisma.optionPriceCreateOrConnectWithoutMenuInput[] = []

  let categoryIds = await prisma.products.findMany({
    where: {OR: products.map((product) => ({productId: product.id}))}
  })

  categoryIds = categoryIds.reduce((acc, category) => {
    if (!(category.productId in acc)) {
      acc[category.productId] = category.categoryId
    }
    console.log(acc)
    return acc
  }, {})

  for (const product of products) {
    //category
    categories.push({
      where: {
        menuId_categoryId: {
          menuId,
          categoryId: categoryIds[product.id]
        }
      },
      create: {
        MenuCategory: {
          connect: {
            id: categoryIds[product.id]
          }
        }
      }
    })

    //product
    productPrices.push({
      where: {
        menuId_productId: {
          menuId,
          productId: product.id
        }
      },
      create: {
        price: product.price,
        MenuProduct: {
          connect: {
            id: product.id
          }
        }
      }
    })
    //option
    for (const option of product.options) {
      optionsPrices.push({
        where: {
          menuId_optionId: {
            menuId,
            optionId: option.id
          }
        },
        create: {
          price: option.price,
          MenuProductOption: {
            connect: {
              id: option.id
            }
          }
        }
      })
    }
  }

  const createData: Prisma.MenuCreateArgs = {
    data: {
      id: menuId,
      name,
      categories: {
        connectOrCreate: categories
      },
      // productPrice: {
      //   connectOrCreate: productPrices
      // },
      // optionPrice: {
      //   connectOrCreate: optionsPrices
      // },
      Organization: {
        connect: {
          id: organizationId
        }
      }
    }
  }

  const menu = await prisma.menu.create(createData)

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
  const {menuId} = request.params
  const menu = await prisma.menu.update({
    where: {
      id_organizationId: {
        id: menuId,
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
    data: menu,
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
const deleteMenuHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const {menuId} = request.params
  const menu = await prisma.menu.delete({
    where: {
      id_organizationId: {
        id: menuId,
        organizationId
      }
    }
  })
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
