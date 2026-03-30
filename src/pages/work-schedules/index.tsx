import { CalendarDays } from 'lucide-react'
import { SetWorkDaysPersonal } from '../../features/attendance/ui'
import { DataTableSection } from '../../shared/ui/DataTableSection'
import './work-schedules.css'

export function WorkSchedules() {
  return (
    <div className="work-schedules-page">
      <header className="work-schedules-header">
        <div className="work-schedules-copy">
          <p>캘린더에서 반복 근무 일정을 바로 확인하고 수정할 수 있습니다.</p>
        </div>
        <div className="work-schedules-summary glass">
          <CalendarDays size={16} />
          <span>근무 일정 조회와 편집을 한 화면의 캘린더로 단순화했습니다.</span>
        </div>
      </header>

      <DataTableSection
        className="work-schedules-editor-card"
        title="내 근무 일정"
        description="캘린더에서 반복 근무 패턴을 확인하며 개인 근무 루틴을 관리합니다."
      >
        <SetWorkDaysPersonal hideHeader />
      </DataTableSection>
    </div>
  )
}
