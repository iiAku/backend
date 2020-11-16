export const types = {ROOT: 'root', NON_ROOT: 'nonRoot'}
export const binding = {
  Buckets: {
    aws: types.ROOT,
    scw: types.ROOT
  },
  Objects: {
    aws: types.ROOT,
    scw: types.NON_ROOT
  }
}
