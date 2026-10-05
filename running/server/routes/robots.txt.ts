export default defineEventHandler((event) => {
  const baseUrl = useRuntimeConfig(event).public.appBaseUrl
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /*?*',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n')
})
