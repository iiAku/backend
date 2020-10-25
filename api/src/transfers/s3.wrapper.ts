// GetService
// deleteBucket
// deleteBucketCors
// deleteBucketLifecycle
// deleteBucketTaging
// getBucket
// getBucketACL
// getBucketCors
// getBucketLifecycle
// getBucketLocation
// getBucketObjectVersions
// getBucketTagging
// getBucketVersioning
// headBucket
// - putBucket
// putBucketACL
// putBucketCors
// putBucketLifecycle
// putBucketTagging
// putBucketVersioning
// deleteMultipleObjects
// deleteObject
// deleteObjectTagging
// getObject
// getObjectACL
// getObjectTagging
// headObject
// optionsObject
// postObject
// postObjectRestore
// putObject
// putObjectCopy
// putObjectACL
// putObjectTagging

// const awsConfig = new AWS.Config({
//   accessKeyId: currentConfig.accessKeyId,
//   secretAccessKey: currentConfig.secretAccessKey,
//   region: currentConfig.region,
//   s3BucketEndpoint: true,
//   endpoint: currentConfig.endpoint
// })
// const putObject = async path => {
// const hash = aws4.sign(
//   {
//     service: 's3',
//     region: currentConfig.region,
//     method: 'PUT',
//     path: path,
//     host: currentConfig.endpoint,
//     headers: {
//       'Content-Type': 'application/octet-stream'
//     }
//   },
//   config
// )
//   return https.request({
//     hostname: currentConfig.endpoint,
//     port: 443,
//     method: 'PUT',
//     path: path,
//     headers: hash.headers
//   })
// }

import * as AWS from 'aws-sdk'
import * as aws4 from 'aws4'
import * as fs from 'fs'
import * as p from 'phin'
import * as xml2js from 'xml2js'

import {config} from './config.dev'
import {getBucketEndpoint} from './utils'

const DEFAULT_SERVICE = 's3'
const DEFAULT_PORT = 443

// Const CURRENT_PROVIDER = 'scw'
const CURRENT_PROVIDER = 'scw'
const currentConfig = config[CURRENT_PROVIDER]

const certs = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
}

const generateRequest = (
  method: string,
  url: URL,
  path: string,
  config: any,
  port: number = DEFAULT_PORT
) => {
  const parameters = {
    hash: {
      service: DEFAULT_SERVICE,
      region: config.region,
      method,
      path,
      host: url.hostname
    }
  }
  const hash = aws4.sign(parameters.hash, {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey
  })

  return {
    url: url.href,
    port,
    method,
    path,
    headers: hash.headers
  }
}

const bucket = (bucketName: string, method: string) =>
  generateRequest(
    method,
    getBucketEndpoint(bucketName, currentConfig.region, CURRENT_PROVIDER),
    '/',
    currentConfig
  )
const getBucket = (bucketName: string) => bucket(bucketName, 'GET')
const putBucket = (bucketName: string) => bucket(bucketName, 'PUT')
const deleteBucket = (bucketName: string) => bucket(bucketName, 'DELETE')
const headBucket = (bucketName: string) => bucket(bucketName, 'HEAD')

const main = async () => {
  const getBucketQuery = getBucket('test-1-2-1-3')

  const response = await p({
    ...getBucketQuery,
    ...certs
  })

  console.log({
    headers: response.headers,
    code: response.statusCode,
    body: JSON.stringify(
      await xml2js.parseStringPromise(response.body.toString()),
      null,
      2
    )
  })
}

main()
