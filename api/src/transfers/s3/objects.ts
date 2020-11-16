export const Objects = ['putObject', 'deleteObject', 'headObject'].reduce(
  (acc, funcName) => {
    acc[funcName] = (s3instance: AWS.S3, params) =>
      s3instance[funcName](params).promise()
    return acc
  },
  {}
)
//Custom
Objects.existObject = async (s3instance: AWS.S3, params) => {
  try {
    await Buckets.headBucket(s3instance, params)
    return true
  } catch (error) {
    return false
  }
}
