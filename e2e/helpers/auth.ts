import type { Page } from '@playwright/test'

export type E2ERole = 'admin' | 'teamLead' | 'member'

const credentials = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
  },
  teamLead: {
    email: process.env.E2E_TEAM_LEAD_EMAIL,
    password: process.env.E2E_TEAM_LEAD_PASSWORD,
  },
  member: {
    email: process.env.E2E_MEMBER_EMAIL,
    password: process.env.E2E_MEMBER_PASSWORD,
  },
} as const

export function hasCredentials(role: E2ERole) {
  const target = credentials[role]
  return Boolean(target.email && target.password)
}

export function getCredentials(role: E2ERole) {
  const target = credentials[role]
  if (!target.email || !target.password) {
    throw new Error(`${role} E2E 계정 정보가 없습니다`)
  }
  return {
    email: target.email,
    password: target.password,
  }
}

export async function loginAs(page: Page, role: E2ERole) {
  const target = getCredentials(role)

  await page.goto('/login')
  await page.locator('#email').fill(target.email)
  await page.locator('#password').fill(target.password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('**/')
}
