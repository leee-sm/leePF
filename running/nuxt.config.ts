export default defineNuxtConfig({
  ssr: true,
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    publicDataServiceKey: process.env.PUBLIC_DATA_SERVICE_KEY,
    koreaAirDataKey: process.env.PUBLIC_KOREA_AIR_DATA,
    publicBabyDataKey: process.env.PUBLIC_BABY_DATA,
    hospitalDataKey: process.env.PUBLIC_HSPT_DATA,
    kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
    public: {
      appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
      kakaoRunJavascriptKey: process.env.KAKAO_RUN_JAVASCRIPT_KEY || '',
      kakaoBabyJavascriptKey: process.env.KAKAO_BABY_JAVASCRIPT_KEY || '',
      siteName: 'LifeRun Guide',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [{ rel: 'icon', href: '/favicon.ico' }],
    },
  },
  nitro: {
    prerender: {
      routes: ['/robots.txt', '/sitemap.xml'],
    },
  },
  typescript: {
    strict: true,
  },
})
