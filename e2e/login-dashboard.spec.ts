import { expect, test } from '@playwright/test'
import { hasCredentials, loginAs } from './helpers/auth'

test.describe('로그인과 대시보드', () => {
  test('관리자가 로그인 후 대시보드 주요 섹션을 본다', async ({ page }) => {
    test.skip(!hasCredentials('admin'), '관리자 E2E 계정 정보가 없습니다')

    await loginAs(page, 'admin')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('오늘 일정')).toBeVisible()
    await expect(page.getByText('오늘 할 일')).toBeVisible()
    await expect(page.getByRole('link', { name: '채팅 열기' })).toBeVisible()
    await expect(page.locator('.clock-schedule-pill')).toContainText(/오늘 근무 예정|오늘은 휴무입니다/)
  })
})
