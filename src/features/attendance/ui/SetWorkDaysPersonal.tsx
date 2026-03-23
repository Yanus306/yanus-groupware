import { useApp } from '../../auth/model/AppProvider'
import { useWorkSchedule } from '../model/useWorkSchedule'
import './SetWorkDaysPersonal.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function SetWorkDaysPersonal() {
  const { state } = useApp()
  const { workDays, daySchedules, isLoading, isSaving, error, toggleDay, setDayTime, saveSchedule } =
    useWorkSchedule()

  return (
    <div className="set-work-days-personal">
      <div className="schedule-header">
        <div>
          <h3>근무 일정 설정</h3>
          <p className="desc">요일별로 출퇴근 시간을 개별 설정할 수 있습니다.</p>
        </div>
        <div className="member-info">
          <span className="member-avatar">{state.currentUser?.name[0] ?? '?'}</span>
          <span className="member-name">{state.currentUser?.name ?? ''}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="schedule-loading">로딩 중...</div>
      ) : (
        <div className="day-schedule-grid">
          {DAY_NAMES.map((day, i) => (
            <div key={day} className={`day-col ${workDays[i] ? 'active' : 'inactive'}`}>
              <span className="day-label">{day}</span>
              <button
                className={`toggle ${workDays[i] ? 'on' : ''}`}
                onClick={() => toggleDay(i)}
                aria-label={`${day} 토글`}
              />
              {workDays[i] ? (
                <div className="day-times">
                  <div className="time-field">
                    <label>출근</label>
                    <input
                      type="time"
                      value={daySchedules[i].checkInTime}
                      onChange={(e) => setDayTime(i, 'checkInTime', e.target.value)}
                    />
                  </div>
                  <div className="time-field">
                    <label>퇴근</label>
                    <input
                      type="time"
                      value={daySchedules[i].checkOutTime}
                      onChange={(e) => setDayTime(i, 'checkOutTime', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="day-off-label">휴무</div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="schedule-error">{error}</p>}

      <button className="save-btn" onClick={saveSchedule} disabled={isSaving}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
