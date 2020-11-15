export interface IBucketOptions {
  bucketName: string
  regionName: string
  providerName: string
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
