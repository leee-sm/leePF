const routes = [
  '/',
  '/running',
  '/running/weather',
  '/running/marathons',
  '/running/pace',
  '/baby',
  '/baby/benefits',
  '/baby/hospitals',
  '/baby/checklist',
  '/baby/childcare',
]

export default defineEventHandler((event) => {
  const baseUrl = useRuntimeConfig(event).public.appBaseUrl.replace(/\/$/, '')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
    .map((route) => `<url><loc>${baseUrl}${route}</loc></url>`)
    .join('')}</urlset>`
})
