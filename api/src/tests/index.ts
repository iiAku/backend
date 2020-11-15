import * as p from 'phin'
import * as test from 'ava'

import {PORT, build, opts} from '../../index'

import {isUUID} from '../auth/routes'
import {messages} from '../messages'
import {nanoid} from 'nanoid'

// server.route({method: 'POST', url: '/register', ...register})
// server.route({method: 'DELETE', url: '/logout', ...logout})
// server.route({method: 'DELETE', url: '/logout-others', ...logoutOthers})
// server.route({method: 'POST', url: '/login', ...login})
// server.route({method: 'POST', url: '/forgot-password', ...forgotPassword})
// server.route({method: 'POST', url: '/reset-password', ...resetPassword})
// server.route({method: 'DELETE', url: '/me', ...deleteMe})

test.before(async (t) => {
  const server = build(opts)
  t.context.server = server
  t.context.prefixUrl = 'http://localhost:3000'
  t.context.user = {
    email: nanoid() + '@mail.com',
    password: nanoid()
  }
})

test.after.always((t) => {
  t.context.server.close()
})

test.serial('Register random user /register', async (t: any) => {
  const reply = await p({
    url: `${t.context.prefixUrl}/register`,
    method: 'POST',
    data: t.context.user,
    parse: 'json'
  })

  const {
    body: {data, message}
  } = reply

  t.is(reply.statusCode, 200)
  t.is(data.user.email, t.context.user.email)
  t.is(message, messages.auth.REGISTERED)
})

test.serial('Register same user should be bad request', async (t: any) => {
  const reply = await p({
    url: `${t.context.prefixUrl}/register`,
    method: 'POST',
    data: t.context.user,
    parse: 'json'
  })

  const {
    body: {message}
  } = reply

  t.is(reply.statusCode, 400, 'statusCode')
  t.is(message, messages.auth.EMAIL_ALREADY_IN_USE)
})

test.serial('Missing register parameters', async (t: any) => {
  const reply = await p({
    url: `${t.context.prefixUrl}/register`,
    method: 'POST',
    data: {},
    parse: 'json'
  })

  t.is(reply.statusCode, 400, 'statusCode')
})

test.serial('User registration email validation', async (t: any) => {
  const userWithWrongMail = {...t.context.user}
  userWithWrongMail.email = nanoid()
  const reply = await p({
    url: `${t.context.prefixUrl}/register`,
    method: 'POST',
    data: userWithWrongMail,
    parse: 'json'
  })
  t.is(reply.statusCode, 400, 'statusCode')
})

test.serial('Login with good user/pass then logout', async (t: any) => {
  let reply = await p({
    url: `${t.context.prefixUrl}/login`,
    method: 'POST',
    data: t.context.user,
    parse: 'json'
  })

  let {
    body: {data, message}
  } = reply

  const token = `token=${data.session_token}`
  t.is(reply.statusCode, 200, 'statusCode')
  t.is(reply.headers['set-cookie'].length, 1)
  t.is(reply.headers['set-cookie'][0], token)
  t.truthy(isUUID(data.session_token, 4), 'Token exist and is a valid uuidv4')
  t.is(data.email, t.context.user.email)
  t.is(message, messages.auth.LOGGED_IN)
})

test.serial('Login with bad user/pass', async (t: any) => {
  const userWithWrongMail = {...t.context.user}
  userWithWrongMail.password = nanoid()
  const reply = await p({
    url: `${t.context.prefixUrl}/login`,
    method: 'POST',
    data: userWithWrongMail,
    parse: 'json'
  })

  const {
    body: {data, message}
  } = reply
  t.is(reply.statusCode, 401, 'statusCode')
  t.is(reply.headers['set-cookie'], undefined)
  t.is(message, messages.auth.INVALID_CREDENTIALS)
})
