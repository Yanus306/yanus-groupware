import { beforeEach, describe, it, expect } from 'vitest'
import { cacheTeams, getCachedTeams, sortUsersByTeamAndName } from '../team'

describe('team cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('팀 목록을 로컬 스토리지에 저장하고 다시 불러올 수 있다', () => {
    cacheTeams([
      { id: 2, name: '2팀' },
      { id: 1, name: '1팀' },
    ])

    expect(getCachedTeams()).toEqual([
      { id: 1, name: '1팀' },
      { id: 2, name: '2팀' },
    ])
  })
})

describe('sortUsersByTeamAndName', () => {
  it('활성 멤버를 팀 순, 이름 순으로 정렬하고 비활성 멤버는 마지막으로 보낸다', () => {
    const sorted = sortUsersByTeamAndName([
      { id: '1', name: '이서연', email: 'seo@test.com', team: '2팀', role: 'TEAM_LEAD', status: 'ACTIVE' },
      { id: '2', name: '한비활성', email: 'inactive@test.com', team: '1팀', role: 'MEMBER', status: 'INACTIVE' },
      { id: '3', name: '김민준', email: 'kim@test.com', team: '1팀', role: 'MEMBER', status: 'ACTIVE' },
      { id: '4', name: '강민준', email: 'kang@test.com', team: '1팀', role: 'MEMBER', status: 'ACTIVE' },
    ])

    expect(sorted.map((user) => user.name)).toEqual(['강민준', '김민준', '이서연', '한비활성'])
  })
})
