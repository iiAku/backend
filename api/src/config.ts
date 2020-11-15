export const config = {
  env: 'dev',
  AUTH_COOKIE_NAME: 'token',
  FORGOT_PASSWORD_EXPIRY_SEC: 21600,
  PASSWORD_SALT_ROUNDS: 10,
  REDIS: {
    USER: 'user',
    PASS: 'pass',
    HOST: 'localhost',
    PORT: 6379
  }
}
