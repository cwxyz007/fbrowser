import { Context, Middleware } from 'koa'
import fs from 'fs'
import path from 'path'
import { config } from './config'

const debug = require('debug')('fbrowser:api')

interface Route {
  (ctx: Context): Promise<void>
}

const query: Route = async (ctx) => {
  const { dir } = ctx.query
  debug('api: %O', ctx.query)

  const distDir = path.join(config.assetsDir, dir)
  const stat = fs.statSync(distDir)

  const result = {
    path: dir,
    files: []
  }

  if (stat.isDirectory()) {
    const files = fs.readdirSync(distDir)

    files
      .filter((file) => {
        const filePath = path.join(distDir, file)
        return config.filter(file, filePath)
      })
      .forEach((file) => {
        result.files.push(file)
      })
  }

  ctx.body = result
}

export function API(): Middleware {
  return async (ctx, next) => {
    if (!ctx.path.startsWith('/api')) {
      await next()
      return
    }

    const routePath = ctx.path.replace(/\/api/, '')

    debug(`route path: ${routePath}`)

    const routes: Record<string, Route> = {
      '/query': query
    }

    const routeFunc = routes[routePath]

    if (!routeFunc) {
      await next()
      return
    }

    await routeFunc(ctx)
  }
}