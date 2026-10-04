const fs = require('fs')
const { chromium } = require('@playwright/test')

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]

const routes = [
  { name: 'home', path: '/', token: 'mock-token-1' },
  { name: 'chat', path: '/chat', token: 'mock-token-1' },
  { name: 'calendar', path: '/calendar', token: 'mock-token-1' },
  { name: 'attendance', path: '/attendance', token: 'mock-token-1' },
  { name: 'work-schedules', path: '/work-schedules', token: 'mock-token-1' },
  { name: 'drive', path: '/drive', token: 'mock-token-1' },
  { name: 'ai', path: '/ai', token: 'mock-token-1' },
  { name: 'members', path: '/members', token: 'mock-token-1' },
  { name: 'my-page', path: '/my-page', token: 'mock-token-1' },
  { name: 'team-management', path: '/team-management', token: 'mock-token-2' },
  { name: 'admin', path: '/admin', token: 'mock-token-1' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'verify-email', path: '/verify-email' },
]

const sourceCommit = '753febc17546ca4bdd7c3525f53e43fc719f7de1'

async function capture() {
  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const viewport of viewports) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
      const setup = route.token
        ? 'localStorage.setItem("accessToken", "' + route.token + '"); localStorage.setItem("refreshToken", "refresh-' + (route.token === 'mock-token-2' ? '2' : '1') + '");'
        : 'localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken");'

      await page.addInitScript({ content: setup + ' localStorage.setItem("yanus-theme", "dark");' })
      const started = Date.now()
      await page.goto('http://127.0.0.1:5173' + route.path, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)

      const metrics = await page.evaluate(() => ({
        path: location.pathname,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        bodyText: document.body.innerText.slice(0, 420),
      }))

      await page.screenshot({
        path: '.qa/issue-414/after/' + route.name + '-' + viewport.name + '.png',
        fullPage: true,
      })

      results.push({
        name: route.name,
        requestedPath: route.path,
        role: route.token === 'mock-token-2' ? 'TEAM_LEAD' : route.token ? 'ADMIN' : 'PUBLIC',
        viewport: viewport.name,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        ...metrics,
        durationMs: Date.now() - started,
      })

      console.log(route.name + '/' + viewport.name + ' ' + metrics.path + ' width=' + metrics.scrollWidth + ' height=' + metrics.scrollHeight)
      await page.close()
    }
  }

  fs.writeFileSync('.qa/issue-414/after/metadata.json', JSON.stringify({
    capturedAt: new Date().toISOString(),
    source: 'issue-414-after',
    sourceCommit,
    viewports,
    routes,
    results,
  }, null, 2))

  await browser.close()
}

capture().catch((error) => {
  console.error(error)
  process.exit(1)
})
