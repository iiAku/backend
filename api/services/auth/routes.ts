import * as Keyv from "keyv"
import * as bcrypt from "bcrypt"
import * as config from "../config.json"
import * as validator from "validator"

import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

const isDev = config.env === "dev" ? true : false
const prisma = new PrismaClient()
// const keyv = new Keyv("redis://user:pass@localhost:6379")
const keyv = new Keyv({ serialize: JSON.stringify, deserialize: JSON.parse })

const authPreHandler = async (req, res, done) => {
  if (
    !req.cookies ||
    !(config.AUTH_COOKIE_NAME in req.cookies) ||
    !validator.isUUID(req.cookies[config.AUTH_COOKIE_NAME], 4)
  ) {
    return res.code(403).send()
  }

  const { token } = req.cookies
  let auth = await keyv.get(token)

  if (!auth) {
    const userFromToken = await prisma.auth.findOne({
      where: { token },
      include: { User: true },
    })
    if (!userFromToken) {
      return res.code(403).send()
    }
    auth = userFromToken
  }
  await keyv.set(token, auth, 120 * 1000)
  req.auth = auth
  done()
}

const registerHandler = async (req, res) => {
  const { email, password } = req.body
  const isEmailExist = await emailExist(email)
  if (isEmailExist) {
    return res.code(200).send({ message: "EMAIL_ALREADY_IN_USE" })
  }
  const hashedPassword: string = await bcrypt.hash(
    password,
    config.PASSWORD_SALT_ROUNDS
  )
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  return res.code(200).send({
    data: { user },
    message: "REGISTERED",
  })
}

const loginHandler = async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findOne({
    where: { email },
  })
  if (!user) {
    return res.code(200).send({
      statusCode: 400,
      message: "INVALID_CREDENTIALS",
    })
  }
  const compare = await bcrypt.compare(password, user.password)
  if (!compare) {
    return res.code(200).send({
      statusCode: 400,
      message: "INVALID_CREDENTIALS",
    })
  }
  const token = uuidv4()
  await prisma.auth.create({
    data: {
      token,
      ip: req.ip,
      User: {
        connect: { id: user.id },
      },
    },
  })
  return res.setCookie(config.AUTH_COOKIE_NAME, token).send({
    data: {
      session_token: token,
      ...user,
    },
    message: "LOGGED_IN",
  })
}

const logoutHandler = async (req, res) => {
  if (!req.auth || !("User" in req.auth)) {
    return res.code(403).send()
  }
  const { token } = req.auth
  await Promise.all([
    prisma.auth.delete({ where: { token } }),
    keyv.delete(token),
  ])
  res.code(200).clearCookie(config.AUTH_COOKIE_NAME).send()
}

const forgotPasswordHandler = async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.code(400).send()
  }
  const userFromEmail = await prisma.user.findOne({ where: { email } })
  if (userFromEmail === null) {
    return res.code(400).send()
  }
  const resetToken = uuidv4()
  const sendMail = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // TODO - send email to user
        console.log("Email sent")
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
    sendMail,
  ])
  console.log("resetToken", resetToken)
  res.code(200).send({ message: "GENERATE_TOKEN_SENT" })
}

const resetPasswordHandler = async (req, res) => {
  const { token, newPassword } = req.body
  console.log(req.body)
  if (!token || !newPassword) {
    return res.code(400).send()
  }
  const forgotKey = `forgot:${token}`
  const isValidToken = await keyv.get(forgotKey)
  console.log(isValidToken)
  if (!isValidToken) {
    return res.code(400).send({ message: "INVALID_OR_EXPIRED_TOKEN" })
  }
  const hashedNewPassword: string = await bcrypt.hash(
    newPassword,
    config.PASSWORD_SALT_ROUNDS
  )
  const updatePassword = prisma.user.update({
    where: { id: isValidToken.id },
    data: {
      password: hashedNewPassword,
    },
  })
  await Promise.all([updatePassword, keyv.delete(forgotKey)])
  return res.code(200).send({ message: "RESET_PASSWORD_SUCCEEDED" })
}

const emailExist = async (email) => {
  const userWithEmail = await prisma.user.findOne({
    where: {
      email,
    },
  })
  if (userWithEmail !== null) {
    return true
  }
  return false
}

// exported routes
export const register = {
  schema: {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
    },
  },
  handler: registerHandler,
  preHandler: authPreHandler,
}

export const login = {
  schema: register.schema,
  handler: loginHandler,
}

export const logout = {
  handler: logoutHandler,
  preHandler: authPreHandler,
}

export const forgotPassword = {
  schema: {
    schema: {
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
    },
  },
  handler: forgotPasswordHandler,
}

export const resetPassword = {
  schema: {
    schema: {
      body: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", format: "uuid" },
          newPassword: { type: "string" },
        },
      },
    },
  },
  handler: resetPasswordHandler,
}
