import * as AWS from 'aws-sdk'

export interface IBucketOptions {
  bucketName: string
  regionName: string
  providerName: string
}

export const getS3Instance = (s3config: any, options?: IBucketOptions) => {
  const customConf = s3config
  const rootAwsConfig = new AWS.Config(customConf)
  let providerName = null
  if (options) {
    const {hostname} = getBucketEndpoint(options)
    customConf.endpoint = hostname
    customConf.s3BucketEndpoint = true
    providerName = options.providerName
  }
  const nonRootAwsConfig = new AWS.Config(customConf)
  console.log({
    root: rootAwsConfig,
    nonRoot: nonRootAwsConfig
  })
  return {
    provider,
    root: new AWS.S3(rootAwsConfig),
    nonRoot: new AWS.S3(nonRootAwsConfig)
  }
}

export const getBucketEndpoint = (options: IBucketOptions) => {
  let baseUrl: string
  const {bucketName, regionName, providerName} = options

  switch (providerName) {
    case 'scw':
      baseUrl =
        'https://' + [bucketName, 's3', regionName, 'scw', 'cloud'].join('.')
      break
    case 'aws':
      baseUrl =
        'https://' +
        [bucketName, 's3', regionName, 'amazonaws', 'com'].join('.')
      break
    default:
      throw new Error('PROVIDER_NOT_SUPPORTED')
  }

  return new URL(baseUrl)
}
