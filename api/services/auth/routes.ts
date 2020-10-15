import * as bcrypt from "bcrypt"
import * as keyv from "keyv"

import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

const prisma = new PrismaClient()
const keyv = new Keyv("redis://user:pass@localhost:6379")

export const registerHandler = async (req, res) => {
  const { email, password } = req.body
  const isEmailExist = await emailExist(email)
  if (isEmailExist) {
    return res.send({
      statusCode: 200,
      message: "EMAIL_ALREADY_IN_USE",
    })
  }
  const hashedPassword: string = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  return res.send({
    statusCode: 200,
    data: { user },
    message: "REGISTERED",
  })
}

export const loginHandler = async (req, res) => {
  const { email, password } = req.body
  const userExist = await prisma.user.findOne({ where: { email } })
  if (!userExist) {
    return res.send({
      statusCode: 400,
      message: "INVALID_CREDENTIALS",
    })
  }
  const compare = await bcrypt.compare(password, userExist.password)
  if (!compare) {
    return res.send({
      statusCode: 400,
      message: "INVALID_CREDENTIALS",
    })
  }
  return res.send({
    statusCode: 200,
    data: {
      session_token: uuidv4(),
    },
    message: "LOGGED_IN",
  })
}

export const emailExist = async (email) => {
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

export const register = {
  schema: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
  handler: registerHandler,
}

export const login = {
  schema: register.schema,
  handler: loginHandler,
}
