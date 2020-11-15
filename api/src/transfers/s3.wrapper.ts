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
import * as fs from 'fs'

import {IBucketOptions} from './utils'
import {config} from './config.dev'
import {getBucketEndpoint} from './utils'

const providers = Object.keys(config)

const getS3Instance = (s3config: any, options?: IBucketOptions) => {
  let customConf = s3config

  if (options && options.filePath) {
    const {hostname} = getBucketEndpoint(options)
    customConf.endpoint = hostname
    customConf.s3BucketEndpoint = true
  }
  console.log('customConf', customConf)
  const awsConfig = new AWS.Config(customConf)
  return new AWS.S3(awsConfig)
}

const main = async () => {
  for (let provider of providers) {
    console.log('Sending data for provider', provider)
    const s3Credentials = config[provider]
    console.log('s3Credentials', s3Credentials)
    const bucketName = '2ca4eec7-e08b-4ebb-8206-67ca457cfc07'
    const fileName = 'file.txt'
    let s3 = getS3Instance(s3Credentials, {
      bucketName,
      regionName: s3Credentials.region,
      providerName: provider
    })
    // const params = {Bucket: bucketName}
    // console.log(params)
    // CREATE BUCKET
    // await s3.createBucket(params).promise()
    // console.log('bucket created', bucketName)
    const rs = fs.createReadStream('./rnd/' + fileName, 'utf8')
    try {
      await s3.upload({Bucket: bucketName, Key: fileName, Body: rs}).promise()
    } catch (error) {
      console.log(error)
    }
  }
}

main()
