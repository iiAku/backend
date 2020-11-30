import * as fs from 'fs'
import * as path from 'path'
if (process.env.NODE_ENV === 'production') {
  const parent = __dirname.split('/').slice(0, -1).join('/')
  const dirs = fs.readdirSync(parent)
  const keep = [
    'dist',
    'prisma',
    'node_modules',
    'Procfile',
    '.heroku',
    'yarn.lock'
  ]

  const isDirectory = (element: string) => fs.lstatSync(element).isDirectory()
  const isFile = (element: string) => fs.lstatSync(element).isFile()

  for (const dir of dirs) {
    const element = path.join(parent, dir)
    if (isDirectory(element) && !keep.has(dir)) {
      console.log('removing dir', element)
      fs.rmdirSync(element, {recursive: true})
      continue
    }

    if (isFile(element) && !keep.has(dir)) {
      console.log('removing file', element)
      fs.unlinkSync(element)
      continue
    }
  }
}
