export const getBucketEndpoint = (
  bucketName: string,
  regionName: string,
  provider: string
) => {
  switch (provider) {
    case 'scw':
      return new URL(
        'https://' + [bucketName, 's3', regionName, 'scw', 'cloud'].join('.')
      )
    case 'aws':
      return new URL(
        'https://' +
          [bucketName, 's3', regionName, 'amazonaws', 'com'].join('.')
      )
    default:
      throw new Error('PROVIDER_NOT_SUPPORTED')
  }
}
