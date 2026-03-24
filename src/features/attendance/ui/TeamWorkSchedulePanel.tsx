import type { MemberWorkScheduleItem } from '../../../shared/api/attendanceApi'
import './TeamWorkSchedulePanel.css'

interface Props {
  schedules: MemberWorkScheduleItem[]
  title?: string
}

const DAY_LABEL: Record<string, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`
}

export function TeamWorkSchedulePanel({ schedules, title = '팀 근무 일정' }: Props) {
  return (
    <div className="team-work-schedule-panel">
      <div className="team-work-schedule-header">
        <div>
          <h3>{title}</h3>
          <p>권한에 따라 조회 가능한 멤버의 요일별 근무 일정을 확인할 수 있습니다.</p>
        </div>
        <span className="team-work-schedule-count">{schedules.length}명</span>
      </div>

      {schedules.length === 0 ? (
        <p className="team-work-schedule-empty">표시할 근무 일정이 없습니다.</p>
      ) : (
        <div className="team-work-schedule-list">
          {schedules.map((member) => (
            <article key={member.memberId} className="team-work-schedule-card">
              <div className="team-work-member-head">
                <div className="team-work-member-avatar">{member.memberName[0]}</div>
                <div className="team-work-member-copy">
                  <strong>{member.memberName}</strong>
                  <span>{member.teamName}</span>
                </div>
              </div>

              <div className="team-work-week-grid">
                {DAY_ORDER.map((dayOfWeek) => {
                  const schedule = member.workSchedules.find((item) => item.dayOfWeek === dayOfWeek)

                  return (
                    <div
                      key={`${member.memberId}-${dayOfWeek}`}
                      className={`team-work-day-card ${schedule ? 'active' : 'off'}`}
                    >
                      <span className="team-work-day">{DAY_LABEL[dayOfWeek] ?? dayOfWeek}</span>
                      <span className="team-work-time">
                        {schedule ? formatTimeRange(schedule.startTime, schedule.endTime) : '휴무'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
