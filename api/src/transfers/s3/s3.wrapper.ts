import {Buckets} from './buckets'
import {Objects} from './objects'
import {config} from '../config.dev'
import {getS3Instance} from './utils'
import {v4 as uuidv4} from 'uuid'
const providers = Object.keys(config)

const main = async () => {
  for (const provider of providers.slice(-1)) {
    console.log('Sending data for provider', provider)
    const s3Credentials = config[provider]
    const Bucket = uuidv4()

    const s3 = getS3Instance(s3Credentials, {
      bucketName: Bucket,
      regionName: s3Credentials.region,
      providerName: provider
    })
    try {
      //Head bucket
      let existBucket = await Buckets.existBucket(s3, {Bucket})
      if (!existBucket) {
        console.log(`Creating bucket: ${Bucket}`)
        //Create bucket
        const createBucket = await Buckets.createBucket(s3, {
          Bucket
        })
        console.log({createBucket})
      }
      // const Key = 'file.txt'
      // let existObject = await Objects.existObject(s3, {Key})
      // console.log({existObject})
    } catch (error) {
      console.log({code: error.code})
      console.log(error)
      //Head bucket
      existBucket = await Buckets.existBucket(s3, {Bucket})
      if (existBucket) {
        // // Delete bucket
        await Buckets.deleteBucket(s3.root, {Bucket})
        console.log(`Deleting bucket: ${Bucket}`)
      }
    }
  }
}

main()
