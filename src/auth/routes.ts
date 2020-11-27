import * as Keyv from 'keyv'
import * as bcrypt from 'bcrypt'

import {authPreHandler, emailExist} from '../utils'

import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {RouteOptions} from 'fastify/types/route'
import {config} from '../config'
import {messages} from '../messages'
import {v4 as uuidv4} from 'uuid'

const isDev = config.env === 'dev'
const prisma = new PrismaClient()
// Const keyv = new Keyv("redis://user:pass@localhost:6379")
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})

/**
 * Register a new user
 *
 * @namespace Auth
 * @path {POST} /auth/register
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
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email,
      password: hashedPassword
    }
  })

  return reply.code(200).send({
    data: {user},
    message: messages.auth.REGISTERED
  })
}

/**
 * Login a new user
 *
 * @namespace Auth
 * @path {POST} /auth/login
 * @code {200} if the request is successful
 * @code {400} if email already exist
 * @body {String} email Email used for registration
 * @body {String} password Password used for registration
 */
const loginHandler = async (request: any, reply: FastifyReply) => {
  const {email, password} = request.body
  const user = await prisma.user.findUnique({
    where: {email}
  })
  if (!user) {
    return reply.code(401).send({
      message: messages.auth.INVALID_CREDENTIALS
    })
  }

  const compare = await bcrypt.compare(password, user.password)
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
      User: {
        connect: {id: user.id}
      }
    }
  })
  return reply.setCookie(config.AUTH_COOKIE_NAME, token).send({
    data: {
      session_token: token,
      ...user
    },
    message: messages.auth.LOGGED_IN
  })
}

/**
 * Logout an authenticated user
 *
 * @namespace Auth
 * @path {DELETE} /auth/logout
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
 * Revoke all others auth tokens
 *
 * @namespace Auth
 * @path {DELETE} /auth/logout-all
 * @code {200} if the request is successful
 * @auth This route requires a valid token cookie set in headers
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 */
const logoutAllHandler = async (request: any, reply: FastifyReply) => {
  const {uid, id} = request.auth
  await prisma.auth.deleteMany({
    where: {uid, NOT: {id}}
  })
  reply.code(200).send()
}

/**
 * Forgot password (wip - experimental)
 *
 * @namespace Auth
 * @path {POST} /auth/forgot-password
 * @code {400} if missing parameters
 * @code {401} if no existing user with email
 * @code {200} if the request is successful
 */
const forgotPasswordHandler = async (request: any, reply: FastifyReply) => {
  const {email} = request.body
  if (!email) {
    return reply.code(400).send()
  }

  const userFromEmail = await prisma.user.findUnique({where: {email}})
  if (userFromEmail === null) {
    return reply.code(401).send()
  }

  const resetToken: string = uuidv4()

  const sendMail: () => Promise<void> = async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Send email to user
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
      userFromEmail,
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
 * @namespace Auth
 * @path {POST} /auth/forgot-password
 * @code {400} if missing parameters
 * @code {401} if invalid reset token user with email
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
  const updatePassword = prisma.user.update({
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
 * @namespace Auth
 * @path {DELETE} /auth/me
 * @code {400} if missing parameter
 * @code {200} if the request is successful
 * @auth This route requires a valid token cookie set in headers
 * @code {401} if no cookies or malformed cookie
 * @code {403} if expired cookie
 * @code {500} if something went wrong
 * @body {String} id User's id to delete
 */
const deleteMeHandler = async (request: any, reply: FastifyReply) => {
  const {id} = request.auth
  if (!id) {
    return reply.code(400).send()
  }

  await prisma.user.delete({where: {id}})
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
export const authRoutes: RouteOptions[] = [
  {method: 'POST', url: '/auth/register', ...register},
  {method: 'POST', url: '/auth/login', ...login},
  {method: 'POST', url: '/auth/forgot-password', ...forgotPassword},
  {method: 'POST', url: '/auth/reset-password/:resetToken', ...resetPassword},
  {method: 'DELETE', url: '/auth/me', ...deleteMe},
  {method: 'DELETE', url: '/auth/logout', ...logout},
  {method: 'DELETE', url: '/auth/logout-all', ...logoutAll}
]
