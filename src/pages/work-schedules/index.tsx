import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Filter, UserRound, Users } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { SetWorkDaysPersonal, TeamWorkSchedulePanel } from '../../features/attendance/ui'
import {
  getAllWorkSchedules,
  getMyWorkSchedule,
  getTeamWorkSchedules,
  type MemberWorkScheduleItem,
  type WorkScheduleItem,
} from '../../shared/api/attendanceApi'
import { formatTeamName, getTeamOptions, sortUsersByTeamAndName } from '../../shared/lib/team'
import { canViewAllWorkSchedules, canViewTeamWorkSchedules } from '../../shared/lib/permissions'
import { DataTableSection } from '../../shared/ui/DataTableSection'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Toast } from '../../shared/ui/Toast'
import './work-schedules.css'

type WorkScheduleViewMode = 'all' | 'team' | 'person'

function buildSelfScheduleItem(
  memberId: string,
  memberName: string,
  teamName: string,
  workSchedules: WorkScheduleItem[],
): MemberWorkScheduleItem {
  return {
    memberId: Number(memberId),
    memberName,
    teamName,
    workSchedules,
  }
}

export function WorkSchedules() {
  const { state, refreshMembers, refreshTeams } = useApp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<WorkScheduleViewMode>('person')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [viewerSchedules, setViewerSchedules] = useState<MemberWorkScheduleItem[]>([])
  const [isViewerLoading, setIsViewerLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const currentUser = state.currentUser
  const canViewAll = canViewAllWorkSchedules(currentUser)
  const canViewTeam = canViewTeamWorkSchedules(currentUser)
  const currentUserId = currentUser?.id ?? ''
  const currentTeamName = currentUser?.team ?? ''

  const activeUsers = useMemo(
    () => sortUsersByTeamAndName(state.users.filter((member) => (member.status ?? 'ACTIVE') === 'ACTIVE')),
    [state.users],
  )
  const allTeams = useMemo(() => getTeamOptions(state.users, state.teams), [state.users, state.teams])
  const currentTeam = useMemo(
    () => allTeams.find((team) => team.name === currentTeamName) ?? null,
    [allTeams, currentTeamName],
  )
  const visibleTeams = useMemo(
    () => (canViewAll ? allTeams : currentTeam ? [currentTeam] : []),
    [allTeams, canViewAll, currentTeam],
  )
  const visibleMembers = useMemo(() => {
    if (!currentUser) return []
    if (canViewAll) return activeUsers
    if (canViewTeam) {
      return activeUsers.filter((member) => member.team === currentTeamName)
    }
    return activeUsers.filter((member) => member.id === currentUser.id)
  }, [activeUsers, canViewAll, canViewTeam, currentTeamName, currentUser])

  useEffect(() => {
    setViewMode(canViewAll || canViewTeam ? 'team' : 'person')
  }, [canViewAll, canViewTeam, currentUserId])

  useEffect(() => {
    if (visibleTeams.length === 0) {
      setSelectedTeamId(null)
      return
    }

    if (selectedTeamId && visibleTeams.some((team) => team.id === selectedTeamId)) return
    setSelectedTeamId(currentTeam?.id ?? visibleTeams[0]?.id ?? null)
  }, [currentTeam, selectedTeamId, visibleTeams])

  useEffect(() => {
    if (visibleMembers.length === 0) {
      setSelectedMemberId('')
      return
    }

    if (selectedMemberId && visibleMembers.some((member) => member.id === selectedMemberId)) return
    setSelectedMemberId(currentUserId || visibleMembers[0]?.id || '')
  }, [currentUserId, selectedMemberId, visibleMembers])

  useEffect(() => {
    if (state.teams.length === 0) {
      refreshTeams().catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : '팀 목록을 불러오지 못했습니다')
      })
    }

    if (state.users.length === 0 && (canViewAll || canViewTeam)) {
      refreshMembers().catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : '멤버 목록을 불러오지 못했습니다')
      })
    }
  }, [canViewAll, canViewTeam, refreshMembers, refreshTeams, state.teams.length, state.users.length])

  const loadViewerSchedules = useCallback(async () => {
    if (!currentUser) {
      setViewerSchedules([])
      setIsViewerLoading(false)
      return
    }

    setIsViewerLoading(true)
    try {
      if (viewMode === 'all' && canViewAll) {
        setViewerSchedules(await getAllWorkSchedules())
        return
      }

      if (viewMode === 'team' && canViewTeam) {
        if (!selectedTeamId) {
          setViewerSchedules([])
          return
        }
        setViewerSchedules(await getTeamWorkSchedules(selectedTeamId))
        return
      }

      if (canViewAll) {
        const schedules = await getAllWorkSchedules()
        setViewerSchedules(
          selectedMemberId
            ? schedules.filter((schedule) => String(schedule.memberId) === selectedMemberId)
            : schedules,
        )
        return
      }

      if (canViewTeam && currentTeam?.id) {
        const schedules = await getTeamWorkSchedules(currentTeam.id)
        setViewerSchedules(
          selectedMemberId
            ? schedules.filter((schedule) => String(schedule.memberId) === selectedMemberId)
            : schedules,
        )
        return
      }

      const mySchedules = await getMyWorkSchedule()
      setViewerSchedules([
        buildSelfScheduleItem(currentUser.id, currentUser.name, currentUser.team, mySchedules),
      ])
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '근무 일정을 불러오지 못했습니다')
      setViewerSchedules([])
    } finally {
      setIsViewerLoading(false)
    }
  }, [canViewAll, canViewTeam, currentTeam, currentUser, selectedMemberId, selectedTeamId, viewMode])

  useEffect(() => {
    loadViewerSchedules()
  }, [loadViewerSchedules, refreshKey])

  const handleSaved = async () => {
    setRefreshKey((value) => value + 1)
  }

  const viewerTitle = useMemo(() => {
    if (viewMode === 'all') return '전체 근무 일정'
    if (viewMode === 'team') {
      const selectedTeam = visibleTeams.find((team) => team.id === selectedTeamId)
      return `${formatTeamName(selectedTeam?.name)} 근무 일정`
    }

    const selectedMember = visibleMembers.find((member) => member.id === selectedMemberId)
    return `${selectedMember?.name ?? currentUser?.name ?? '내'} 근무 일정`
  }, [currentUser?.name, selectedMemberId, selectedTeamId, viewMode, visibleMembers, visibleTeams])

  return (
    <div className="work-schedules-page">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />
      )}

      <header className="work-schedules-header">
        <div className="work-schedules-copy">
          <p>반복 근무 일정을 설정하고 권한 범위에 맞게 팀 근무표를 확인합니다.</p>
        </div>
        <div className="work-schedules-summary glass">
          <CalendarDays size={16} />
          <span>개인 편집 + 권한별 조회를 한 화면에서 관리합니다.</span>
        </div>
      </header>

      <div className="work-schedules-grid">
        <DataTableSection
          className="work-schedules-editor-card"
          title="내 근무 일정"
          description="요일별 근무 시간과 반복 주차를 저장해 개인 근무 루틴을 관리합니다."
        >
          <SetWorkDaysPersonal hideHeader onSaved={handleSaved} />
        </DataTableSection>

        <DataTableSection
          className="work-schedules-viewer-card"
          title="근무 일정 조회"
          description="역할에 따라 전체, 팀별, 개인 기준으로 근무 일정을 확인할 수 있습니다."
        >
          <div className="work-schedules-toolbar">
            <div className="work-schedules-scope-group" role="group" aria-label="근무 일정 조회 범위">
              {canViewAll && (
                <button
                  type="button"
                  className={`scope-chip ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => setViewMode('all')}
                >
                  <Users size={14} />
                  전체
                </button>
              )}
              {canViewTeam && (
                <button
                  type="button"
                  className={`scope-chip ${viewMode === 'team' ? 'active' : ''}`}
                  onClick={() => setViewMode('team')}
                >
                  <Filter size={14} />
                  팀별
                </button>
              )}
              <button
                type="button"
                className={`scope-chip ${viewMode === 'person' ? 'active' : ''}`}
                onClick={() => setViewMode('person')}
              >
                <UserRound size={14} />
                개인
              </button>
            </div>

            <div className="work-schedules-selectors">
              {viewMode === 'team' && canViewTeam && (
                <label className="work-schedules-select">
                  <span>조회 팀</span>
                  <select
                    value={selectedTeamId ?? ''}
                    onChange={(event) => setSelectedTeamId(Number(event.target.value))}
                  >
                    {visibleTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {formatTeamName(team.name)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {viewMode === 'person' && (
                <label className="work-schedules-select">
                  <span>조회 멤버</span>
                  <select
                    value={selectedMemberId}
                    onChange={(event) => setSelectedMemberId(event.target.value)}
                  >
                    {visibleMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {formatTeamName(member.team)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          {!canViewTeam && (
            <p className="work-schedules-notice">
              현재 API 권한 기준으로 일반 멤버는 본인 근무 일정만 조회할 수 있습니다.
            </p>
          )}

          {isViewerLoading ? (
            <div className="work-schedules-loading">근무 일정을 불러오는 중...</div>
          ) : viewerSchedules.length === 0 ? (
            <EmptyState
              title="표시할 근무 일정이 없습니다."
              description="조회 범위를 바꾸거나 근무 일정을 먼저 저장해 주세요."
            />
          ) : (
            <div className="work-schedules-viewer-panel">
              <div className="work-schedules-viewer-meta">
                <strong>{viewerTitle}</strong>
                <span>{viewerSchedules.length}명 표시 중</span>
              </div>
              <TeamWorkSchedulePanel schedules={viewerSchedules} showHeader={false} />
            </div>
          )}
        </DataTableSection>
      </div>
    </div>
  )
}
