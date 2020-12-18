import {Prisma, PrismaClient} from '@prisma/client'
import {authPreHandler, flatItems, isUUID} from '../utils'

import {FastifyReply} from 'fastify'
import {RouteOptions} from 'fastify/types/route'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const prisma = new PrismaClient()

/**
 * Get a menu from organization
 *
 * @namespace Menu
 * @path {GET} /menu/:menuId
 * @query menuId
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
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
 * Get all menu from organization
 *
 * @namespace Menu
 * @path {GET} /menu
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
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
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 * @body {Object} Menu
 * @body {Object} Menu.name - Name of menu
 * @body {Object} Menu.shopId (optional) - ShopId link to this menu
 * @body {categories[]} Menu.categories - Array of MenuCategory
 * @body {string} Menu.categories[x].id - categoryId
 * @body {products[]} Menu.categories[x].products - categoryId
 * @body {string} Menu.categories[x].products[y].id - productId
 * @body {Number} Menu.categories[x].products[y].price - product price
 * @body {options[]} Menu.categories[x].products[y].options (optional) - product options
 * @body {string} Menu.categories[x].products[y].options[z].id - option id
 * @body {Number} Menu.categories[x].products[y].options[z].price - option price
 * @example
 * // body params example
 * {
    "name": "L'utime carte des boissons",
    "shopId": "a479ef51-1f6f-4e67-a323-d2ea06eda2e3",
    "categories": [
        {
            "id": "ae8ce485-31d5-47be-b1f2-e57ebd132092",
            "products": [
                {
                    "id": "07f7b05b-aec2-4848-a715-46883bde8c72",
                    "price": 16,
                    "options": [{
                        "id": "1673d0cd-04dc-44b3-94a3-6894e0ce2358",
                        "price": 28
                    }]
                }
            ]
        }
    ]
}
 */

const addMenuFunc = (request: any, reply: FastifyReply, withMenuId = '') => {
  const {organizationId} = request.auth
  const {name, shopId, categories} = request.body

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

  const menuCreate: Prisma.MenuCreateArgs = {
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
  }
  if (shopId) {
    menuCreate.data.menus = {
      connectOrCreate: {
        where: {
          menuId_shopId: {
            menuId,
            shopId
          }
        },
        create: {
          id: uuidv4(),
          Shop: {
            connect: {
              id_organizationId: {
                id: shopId,
                organizationId
              }
            }
          }
        }
      }
    }
  }

  return prisma.menu.create(menuCreate)
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
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
 * @code {500} if something went wrong
 * @body {string} name
 */
const editMenuHandler = async (request: any, reply: FastifyReply) => {
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
 * @auth This route requires a valid Authorization token set in headers
 * @code {200} if the request is successful
 * @code {401} if no token or malformed token
 * @code {403} if expired token
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
