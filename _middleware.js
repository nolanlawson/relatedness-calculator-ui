const queryApi = '/api/calculate'
const suggestApi = '/api/suggest'
const queryUrl = 'https://relatednesscalculatorapi.nolanlawson.com/RelatednessCalculator'
const suggestUrl = 'https://relatednesscalculatorapi.nolanlawson.com/RelatednessCalculatorAutosuggester'

export default async function middleware(req) {
  const url = new URL(req.url)

  console.log('url', url)

  // If the request isn't doing an API request, don't run our custom middleware
  if (!url.pathname.startsWith('/api')) {
    // Continue with Vercel's default asset handler
    return new Response(null, {
      headers: { 'x-middleware-next': '1' },
    })
  }

  let targetUrl
  if (url.pathname === queryApi || url.pathname === queryApi + '/') {
    targetUrl = queryUrl
  } else if (url.pathname === suggestApi || url.pathname === suggestApi + '/') {
    targetUrl = suggestUrl
  } else {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }

  const searchParams = url.searchParams.toString()
  const resp = await fetch(targetUrl + '?' + searchParams)
  const text = await resp.text()

  return new Response(text, {
    headers: {
      // x-middleware-next header invokes a `next()` style function
      // within Vercel middleware, ultimately passing the
      // request to the next middleware.
      'x-middleware-next': '1',
      'Content-Type': 'application/json;charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=604800'
    }
  })
}