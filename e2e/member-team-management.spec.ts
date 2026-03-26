import { expect, test } from '@playwright/test'
import { hasCredentials, loginAs } from './helpers/auth'

const targetMemberName = process.env.E2E_MEMBER_NAME ?? '실서버테스트'

test.describe('멤버 관리와 팀 변경', () => {
  test('관리자가 멤버 관리 화면에서 팀 변경을 수행하고 원복한다', async ({ page }) => {
    test.skip(!hasCredentials('admin'), '관리자 E2E 계정 정보가 없습니다')

    await loginAs(page, 'admin')
    await page.goto('/admin')

    await page.getByRole('button', { name: '멤버 관리' }).click()
    await expect(page.getByText('멤버 목록')).toBeVisible()

    const memberRow = page.locator('tr', { hasText: targetMemberName }).first()
    await expect(memberRow).toBeVisible()

    await memberRow.getByRole('button', { name: /팀 변경/ }).click()
    const teamChangeModal = page.locator('.admin-modal').filter({ hasText: `팀 변경 — ${targetMemberName}` })
    await expect(teamChangeModal).toBeVisible()
    await teamChangeModal.locator('.admin-role-option').filter({ hasText: '1팀' }).click()
    await page.getByRole('button', { name: '변경 확인' }).click()
    await expect(page.getByText(new RegExp(`${targetMemberName}의 팀을 1팀으로 변경했습니다`))).toBeVisible()

    const movedRow = page.locator('tr', { hasText: targetMemberName }).first()
    await expect(movedRow).toContainText('1팀')

    await movedRow.getByRole('button', { name: /팀 변경/ }).click()
    await expect(teamChangeModal).toBeVisible()
    await teamChangeModal.locator('.admin-role-option').filter({ hasText: 'BACKEND' }).click()
    await page.getByRole('button', { name: '변경 확인' }).click()
    await expect(page.getByText(new RegExp(`${targetMemberName}의 팀을 BACKEND으로 변경했습니다`))).toBeVisible()
    await expect(page.locator('tr', { hasText: targetMemberName }).first()).toContainText('BACKEND')
  })
})
