import { useApp } from '../context/AppContext'
import './SetWorkDaysPersonal.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function SetWorkDaysPersonal() {
  const { state, personalSchedule, setPersonalSchedule } = useApp()

  const toggleDay = (index: number) => {
    const next = [...personalSchedule.workDays]
    next[index] = !next[index]
    setPersonalSchedule({ ...personalSchedule, workDays: next })
  }

  return (
    <div className="set-work-days-personal">
      <h3>Set Work Days</h3>
      <p className="desc">Customize your personal schedule. Set your own work days and check-in/out times.</p>
      <div className="member-row">
        <span className="member-avatar">{state.currentUser.name[0]}</span>
        <span className="member-name">{state.currentUser.name}</span>
        <div className="days-toggles">
          {DAYS.map((day, i) => (
            <div key={day} className="day-cell">
              <span className="day-name">{day}</span>
              <button
                className={`toggle ${personalSchedule.workDays[i] ? 'on' : ''}`}
                onClick={() => toggleDay(i)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="time-row">
        <div className="time-field">
          <label>Check-in</label>
          <input
            type="time"
            value={personalSchedule.checkInTime}
            onChange={(e) => setPersonalSchedule({ ...personalSchedule, checkInTime: e.target.value })}
          />
        </div>
        <div className="time-field">
          <label>Check-out</label>
          <input
            type="time"
            value={personalSchedule.checkOutTime}
            onChange={(e) => setPersonalSchedule({ ...personalSchedule, checkOutTime: e.target.value })}
          />
        </div>
      </div>
      <button className="save-btn">Save</button>
    </div>
  )
}
