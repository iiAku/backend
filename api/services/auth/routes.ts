import * as Keyv from 'keyv'
import * as bcrypt from 'bcrypt'

import {v4 as uuidv4, validate, version} from 'uuid'

import {FastifyReply} from 'fastify'
import {PrismaClient} from '@prisma/client'
import {config} from '../config'

const isDev = config.env === 'dev'
//const prisma = new PrismaClient()
// Const keyv = new Keyv("redis://user:pass@localhost:6379")
const keyv = new Keyv({serialize: JSON.stringify, deserialize: JSON.parse})

const isUUID = (uuid: string, uuidVersion: number) =>
  validate(uuid) && version(uuid) === uuidVersion

const authPreHandler = async (request: any, reply: FastifyReply, done: any) => {
  if (
    !request.cookies ||
    !(config.AUTH_COOKIE_NAME in request.cookies) ||
    !isUUID(request.cookies[config.AUTH_COOKIE_NAME], 4)
  ) {
    return reply.code(403).send({message: 'INVALID_COOKIE'})
  }

  const {token} = request.cookies
  let auth = await keyv.get(token)

  if (!auth) {
    const userFromToken = await prisma.auth.findOne({
      where: {token},
      include: {User: true}
    })
    if (!userFromToken) {
      return reply.code(403).send({message: 'EXPIRED_COOKIE'})
    }

    auth = userFromToken
  }

  await keyv.set(token, auth, 120 * 1000)
  request.auth = auth
  done()
}

const registerHandler = async (request: any, reply: FastifyReply) => {
  const {email, password} = request.body
  const isEmailExist = await emailExist(email)
  if (isEmailExist) {
    return reply.code(200).send({message: 'EMAIL_ALREADY_IN_USE'})
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
    message: 'REGISTERED'
  })
}

const loginHandler = async (request: any, reply: FastifyReply) => {
  const {email, password} = request.body
  const user = await prisma.user.findOne({
    where: {email}
  })
  if (!user) {
    return reply.code(200).send({
      statusCode: 400,
      message: 'INVALID_CREDENTIALS'
    })
  }

  const compare = await bcrypt.compare(password, user.password)
  if (!compare) {
    return reply.code(200).send({
      statusCode: 400,
      message: 'INVALID_CREDENTIALS'
    })
  }

  const token = uuidv4()
  await prisma.auth.create({
    data: {
      token,
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
    message: 'LOGGED_IN'
  })
}

const logoutHandler = async (request: any, reply: FastifyReply) => {
  if (!request.auth || !('User' in request.auth)) {
    return reply.code(403).send()
  }

  const {token} = request.auth
  await Promise.all([prisma.auth.delete({where: {token}}), keyv.delete(token)])
  reply.code(200).clearCookie(config.AUTH_COOKIE_NAME).send()
}

const forgotPasswordHandler = async (request: any, reply: FastifyReply) => {
  const {email} = request.body
  if (!email) {
    return reply.code(400).send()
  }

  const userFromEmail = await prisma.user.findOne({where: {email}})
  if (userFromEmail === null) {
    return reply.code(400).send()
  }

  const resetToken: string = uuidv4()
  const sendMail = async () => {
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
      `forgot:${resetToken}`,
      userFromEmail,
      isDev ? 300 * 1000 : config.FORGOT_PASSWORD_EXPIRY_SEC
    ),
    sendMail
  ])
  console.log('resetToken', resetToken)
  reply.code(200).send({message: 'GENERATE_TOKEN_SENT'})
}

const resetPasswordHandler = async (request: any, reply: FastifyReply) => {
  const {
    token,
    newPassword
  }: {token: string; newPassword: string} = request.body
  if (!token || !newPassword) {
    return reply.code(400).send()
  }

  const forgotKey = `forgot:${token}`
  const isValidToken = await keyv.get(forgotKey)
  console.log(isValidToken)
  if (!isValidToken) {
    return reply.code(400).send({message: 'INVALID_OR_EXPIRED_TOKEN'})
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
  return reply.code(200).send({message: 'RESET_PASSWORD_SUCCEEDED'})
}

const deleteMeHandler = async (request: any, reply: FastifyReply) => {
  if (!request.auth || !('User' in request.auth)) {
    return reply.code(403).send()
  }

  const {id} = request.auth
  if (!id) {
    return reply.code(400).send()
  }

  // Await prisma.user.delete({ where: { id } })
  reply
    .code(200)
    .clearCookie(config.AUTH_COOKIE_NAME)
    .send({message: 'USER_DELETED'})
}

const emailExist = async (email: string) => {
  const userWithEmail = await prisma.user.findOne({
    where: {
      email
    }
  })
  if (userWithEmail !== null) {
    return true
  }

  return false
}

// exported routes
export const register = {
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

export const login = {
  schema: register.schema,
  handler: loginHandler
}

export const logout = {
  handler: logoutHandler,
  preHandler: authPreHandler
}

export const deleteMe = {
  handler: deleteMeHandler,
  preHandler: authPreHandler
}

export const forgotPassword = {
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

export const resetPassword = {
  schema: {
    body: {
      type: 'object',
      required: ['token', 'newPassword'],
      properties: {
        token: {type: 'string', format: 'uuid'},
        newPassword: {type: 'string'}
      }
    }
  },
  handler: resetPasswordHandler
}
