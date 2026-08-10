import app from '../index.js'

export default function handler(request, response) {
  const url = new URL(request.url, 'http://vercel.internal')
  const routedPath = url.searchParams.get('__path')

  if (routedPath !== null) {
    url.searchParams.delete('__path')
    const query = url.searchParams.toString()
    request.url = `/api/${routedPath}${query ? `?${query}` : ''}`
  }

  return app(request, response)
}
