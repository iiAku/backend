import * as Keyv from 'keyv'
import * as bcrypt from 'bcrypt'

import {authPreHandler, emailExist} from '../utils'

import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {RouteOptions} from 'fastify/types/route'
import {config} from '../config'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const prisma = new PrismaClient()
// Const keyv = new Keyv("redis://organization:pass@localhost:6379")
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Register a new organization
 *
 * @namespace Organization
 * @path {POST} /organization/register
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {String} email Email used for registration
 * @body {String} password Password used for registration
 */
const registerHandler = async (request: any, reply: FastifyReply) => {
  const {email, password} = request.body
  const isEmailExist = await emailExist(email)
  if (isEmailExist) {
    return reply.code(400).send({message: messages.auth.EMAIL_ALREADY_IN_USE})
  }

  const hashedPassword: string = await bcrypt.hash(
    password,
    config.PASSWORD_SALT_ROUNDS
  )
  const organization = await prisma.organization.create({
    data: {
      id: uuidv4(),
      email,
      password: hashedPassword
    }
  })

  return reply.code(200).send({
    data: {organization},
    message: messages.auth.REGISTERED
  })
}

/**
 * Login a new organization
 *
 * @namespace Organization
 * @path {POST} /organization/login
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {String} email Email used for registration
 * @body {String} password Password used for registration
 */
const loginHandler = async (request: any, reply: FastifyReply) => {
  const {email, password} = request.body
  const organization = await prisma.organization.findUnique({
    where: {email}
  })
  if (!organization) {
    return reply.code(401).send({
      message: messages.auth.INVALID_CREDENTIALS
    })
  }

  const compare = await bcrypt.compare(password, organization.password)
  if (!compare) {
    return reply.code(401).send({
      message: messages.auth.INVALID_CREDENTIALS
    })
  }

  const token = uuidv4()
  await prisma.auth.create({
    data: {
      id: token,
      ip: request.ip,
      Organization: {
        connect: {id: organization.id}
      }
    }
  })
  return reply.setCookie(config.AUTH_COOKIE_NAME, token).send({
    data: {
      session_token: token,
      ...organization
    },
    message: messages.auth.LOGGED_IN
  })
}

/**
 * Get an authenticated organization details
 *
 * @namespace Organization
 * @path {GET} /organization
 * @code {200} if the request is successful
 * @auth This route requires a valid token cookie set in headers
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 */
const getHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId} = request.auth
  const organization = await prisma.organization.findUnique({
    where: {id: organizationId},
    include: {
      Menu: true,
      MenuProduct: true,
      MenuProductOption: true,
      MenuCategory: true
    }
  })
  return reply.send({
    data: {...organization},
    message: null
  })
}

/**
 * Logout an authenticated organization
 *
 * @namespace Organization
 * @path {DELETE} /organization/logout
 * @code {200} if the request is successful
 * @auth This route requires a valid token cookie set in headers
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 */
const logoutHandler = async (request: any, reply: FastifyReply) => {
  const {id} = request.auth
  await Promise.all([prisma.auth.delete({where: {id}}), keyv.delete(id)])
  reply.code(200).clearCookie(config.AUTH_COOKIE_NAME).send()
}

/**
 * Revoke all others organization tokens
 *
 * @namespace Organization
 * @path {DELETE} /organization/logout-all
 * @code {200} if the request is successful
 * @auth This route requires a valid token cookie set in headers
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 */
const logoutAllHandler = async (request: any, reply: FastifyReply) => {
  const {organizationId, id} = request.auth
  await prisma.auth.deleteMany({
    where: {organizationId, NOT: {id}}
  })
  reply.code(200).send()
}

/**
 * Forgot password (wip - experimental)
 *
 * @namespace Organization
 * @path {POST} /organization/forgot-password
 * @code {400} if missing parameters
 * @code {401} if no existing organization with email
 * @code {200} if the request is successful
 */
const forgotPasswordHandler = async (request: any, reply: FastifyReply) => {
  const {email} = request.body
  if (!email) {
    return reply.code(400).send()
  }

  const organizationFromEmail = await prisma.organization.findUnique({
    where: {email}
  })
  if (organizationFromEmail === null) {
    return reply.code(401).send()
  }

  const resetToken: string = uuidv4()

  const sendMail: () => Promise<void> = async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Send email to organization
        console.log('Email sent')
        resolve()
      }, 500)
    })
  }

  await Promise.all([
    await keyv.set(
      `forgot:${email}`,
      resetToken,
      isDev ? 300 * 1000 : config.FORGOT_PASSWORD_EXPIRY_SEC
    ),
    await keyv.set(
      `forgot:${resetToken}`,
      organizationFromEmail,
      isDev ? 300 * 1000 : config.FORGOT_PASSWORD_EXPIRY_SEC
    ),
    sendMail
  ])
  console.log('resetToken', resetToken)
  /*
  NB - token is sent in data payload
       for testing purpose (should not be exposed)
       sent over email in prod
  */
  reply.code(200).send({
    data: {resetToken},
    message: messages.auth.GENERATE_TOKEN_SENT
  })
}

/**
 * Reset password (wip - experimental)
 *
 * @namespace Organization
 * @path {POST} /organization/forgot-password
 * @code {400} if missing parameters
 * @code {401} if invalid reset token organization with email
 * @code {200} if the request is successful
 */
const resetPasswordHandler = async (request: any, reply: FastifyReply) => {
  const {newPassword} = request.body
  const {resetToken} = request.params
  if (!resetToken || !newPassword) {
    return reply.code(400).send()
  }

  const forgotKey = `forgot:${resetToken}`
  const isValidToken = await keyv.get(forgotKey)
  if (!isValidToken) {
    return reply
      .code(401)
      .send({message: messages.auth.INVALID_OR_EXPIRED_TOKEN})
  }

  const emailKey = `forgot:${isValidToken.email}`
  const lastIssuedToken = await keyv.get(emailKey)

  if (lastIssuedToken !== resetToken) {
    return reply
      .code(401)
      .send({message: messages.auth.INVALID_OR_EXPIRED_TOKEN})
  }

  const hashedNewPassword: string = await bcrypt.hash(
    newPassword,
    config.PASSWORD_SALT_ROUNDS
  )
  const updatePassword = prisma.organization.update({
    where: {id: isValidToken.id},
    data: {
      password: hashedNewPassword
    }
  })
  await Promise.all([updatePassword, keyv.delete(forgotKey)])
  return reply.code(200).send({message: messages.auth.RESET_PASSWORD_SUCCEEDED})
}

/**
 * Delete my account
 *
 * @namespace Organization
 * @path {DELETE} /organization/me
 * @code {400} if missing parameter
 * @code {200} if the request is successful
 * @auth This route requires a valid token cookie set in headers
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {String} id Organization's id to delete
 */
const deleteMeHandler = async (request: any, reply: FastifyReply) => {
  const {id} = request.auth
  if (!id) {
    return reply.code(400).send()
  }

  await prisma.organization.delete({where: {id}})
  reply
    .code(200)
    .clearCookie(config.AUTH_COOKIE_NAME)
    .send({message: messages.auth.USER_DELETED})
}

const register = {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {type: 'string', format: 'email'},
        password: {type: 'string'}
      }
    }
  },
  handler: registerHandler
}

const login = {
  schema: register.schema,
  handler: loginHandler
}

const getOrganization = {
  handler: getHandler,
  preHandler: authPreHandler
}

const logout = {
  handler: logoutHandler,
  preHandler: authPreHandler
}

const logoutAll = {
  handler: logoutAllHandler,
  preHandler: authPreHandler
}

const deleteMe = {
  handler: deleteMeHandler,
  preHandler: authPreHandler
}

const forgotPassword = {
  schema: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {type: 'string', format: 'email'}
      }
    }
  },
  handler: forgotPasswordHandler
}

const resetPassword = {
  schema: {
    body: {
      type: 'object',
      required: ['newPassword'],
      properties: {
        newPassword: {type: 'string'}
      }
    },
    params: {
      type: 'object',
      required: ['resetToken'],
      properties: {
        resetToken: {type: 'string', format: 'uuid'}
      }
    }
  },
  handler: resetPasswordHandler
}

// exported routes
export const routes: RouteOptions[] = [
  {method: 'GET', url: '/organization', ...getOrganization},
  {method: 'POST', url: '/organization/register', ...register},
  {method: 'POST', url: '/organization/login', ...login},
  {method: 'POST', url: '/organization/forgot-password', ...forgotPassword},
  {
    method: 'POST',
    url: '/organization/reset-password/:resetToken',
    ...resetPassword
  },
  {method: 'DELETE', url: '/organization/me', ...deleteMe},
  {method: 'DELETE', url: '/organization/logout', ...logout},
  {method: 'DELETE', url: '/organization/logout-all', ...logoutAll}
]
