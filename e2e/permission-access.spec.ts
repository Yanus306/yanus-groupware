import { expect, test } from '@playwright/test'
import { hasCredentials, loginAs } from './helpers/auth'

test.describe('권한별 접근 제어', () => {
  test('관리자는 관리자 화면에 접근하고 팀장 전용 화면은 접근하지 못한다', async ({ page }) => {
    test.skip(!hasCredentials('admin'), '관리자 E2E 계정 정보가 없습니다')

    await loginAs(page, 'admin')

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: '관리자' })).toBeVisible()

    await page.goto('/team-management')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('오늘 일정')).toBeVisible()
  })

  test('팀장은 팀 변경 화면에 접근하고 관리자 화면은 접근하지 못한다', async ({ page }) => {
    test.skip(!hasCredentials('teamLead'), '팀장 E2E 계정 정보가 없습니다')

    await loginAs(page, 'teamLead')

    await page.goto('/team-management')
    await expect(page).toHaveURL(/\/team-management$/)
    await expect(page.getByRole('heading', { name: '팀 관리' })).toBeVisible()

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('오늘 일정')).toBeVisible()
  })

  test('멤버는 관리자 화면과 팀장 화면 모두 접근하지 못한다', async ({ page }) => {
    test.skip(!hasCredentials('member'), '멤버 E2E 계정 정보가 없습니다')

    await loginAs(page, 'member')

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('오늘 일정')).toBeVisible()

    await page.goto('/team-management')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('오늘 일정')).toBeVisible()
  })
})
