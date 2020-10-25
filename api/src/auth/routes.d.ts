import {FastifyReply} from 'fastify'
export declare const register: {
  schema: {
    body: {
      type: string
      required: string[]
      properties: {
        email: {
          type: string
          format: string
        }
        password: {
          type: string
        }
      }
    }
  }
  handler: (request: any, reply: FastifyReply) => Promise<never>
}
export declare const login: {
  schema: {
    body: {
      type: string
      required: string[]
      properties: {
        email: {
          type: string
          format: string
        }
        password: {
          type: string
        }
      }
    }
  }
  handler: (request: any, reply: FastifyReply) => Promise<never>
}
export declare const logout: {
  handler: (request: any, reply: FastifyReply) => Promise<undefined>
  preHandler: (
    request: any,
    reply: FastifyReply,
    done: any
  ) => Promise<undefined>
}
export declare const deleteMe: {
  handler: (request: any, reply: FastifyReply) => Promise<undefined>
  preHandler: (
    request: any,
    reply: FastifyReply,
    done: any
  ) => Promise<undefined>
}
export declare const forgotPassword: {
  schema: {
    body: {
      type: string
      required: string[]
      properties: {
        email: {
          type: string
          format: string
        }
      }
    }
  }
  handler: (request: any, reply: FastifyReply) => Promise<undefined>
}
export declare const resetPassword: {
  schema: {
    body: {
      type: string
      required: string[]
      properties: {
        token: {
          type: string
          format: string
        }
        newPassword: {
          type: string
        }
      }
    }
  }
  handler: (request: any, reply: FastifyReply) => Promise<never>
}
