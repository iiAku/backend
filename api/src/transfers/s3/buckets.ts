//nb - add listBuckets when scw is customized
export const Buckets = ['createBucket', 'deleteBucket', 'headBucket'].reduce(
  (acc, x) => {
    acc[x] = (s3instance: AWS.S3, params) => {
      console.log('key of s3instance', x)
      return s3instance[x](params).promise()
    }
    return acc
  },
  {}
)
//Custom
Buckets.existBucket = async (s3instance: AWS.S3, params) => {
  try {
    await Buckets.headBucket(s3instance, params)
    return true
  } catch (error) {
    return false
  }
}
