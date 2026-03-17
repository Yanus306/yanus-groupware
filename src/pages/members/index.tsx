import { useState } from 'react'
import { Search, Crown, ChevronDown } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import './members.css'

const teams = ['All Teams', 'Design Team', 'Dev Team', 'Marketing', 'Product Team']
const roles = ['All Roles', 'Leader', 'Team Lead', 'Member']

const roleLabels: Record<string, string> = {
  leader: 'Leader',
  team_lead: 'Team Lead',
  member: 'Member',
}

const teamLabels: Record<string, string> = {
  design: 'Design Team',
  dev: 'Dev Team',
  marketing: 'Marketing',
  product: 'Product Team',
}

export function Members() {
  const { state, isAdmin } = useApp()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('All Teams')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string } | null>(null)

  if (!isAdmin) {
    return (
      <div className="members-page">
        <h1>Member Management</h1>
        <div className="glass no-access">
          <p>Admin access required. Only team leads and leaders can view this page.</p>
        </div>
      </div>
    )
  }

  const filtered = state.users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
    const matchTeam = teamFilter === 'All Teams' || teamLabels[u.team] === teamFilter
    const matchRole = roleFilter === 'All Roles' || roleLabels[u.role] === roleFilter
    return matchSearch && matchTeam && matchRole
  })

  return (
    <div className="members-page">
      <header className="members-header">
        <h1>
          Member Management
          <span className="admin-badge">! Admin Only</span>
        </h1>
      </header>

      <div className="filters-row">
        <div className="search-wrap glass">
          <Search size={18} />
          <input
            placeholder="Search Members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label">Team</span>
          <div className="filter-btns">
            {teams.map((t) => (
              <button key={t} className={teamFilter === t ? 'active' : ''} onClick={() => setTeamFilter(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Role</span>
          <div className="filter-btns">
            {roles.map((r) => (
              <button key={r} className={roleFilter === r ? 'active' : ''} onClick={() => setRoleFilter(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="total-members glass">Total Members: 150</div>
      </div>

      <div className="members-content">
        <div className="table-section glass">
          <h3>Member List Table.</h3>
          <table className="members-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Current Team</th>
                <th>Role</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="avatar">{u.name[0]}</span>
                    {u.name}
                  </td>
                  <td>
                    <span className={`team-tag ${u.team}`}>{teamLabels[u.team]}</span>
                  </td>
                  <td>
                    <span className={`role-tag ${u.role}`}>
                      {u.role === 'leader' && <Crown size={14} />}
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td>Oct 15, 2023</td>
                  <td>
                    <div className="actions">
                      <button className="action-btn">Change Team <ChevronDown size={14} /></button>
                      <button className="action-btn" onClick={() => setChangeRoleFor({ id: u.id, name: u.name })}>
                        Change Role <ChevronDown size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="stats-sidebar glass">
          <h3>Members per Team</h3>
          <div className="bar-chart">
            <div className="bar" style={{ height: '80%' }}><span>Design</span><span>40</span></div>
            <div className="bar" style={{ height: '100%' }}><span>Dev</span><span>50</span></div>
            <div className="bar" style={{ height: '60%' }}><span>Marketing</span><span>30</span></div>
            <div className="bar" style={{ height: '40%' }}><span>Product</span><span>20</span></div>
            <div className="bar" style={{ height: '20%' }}><span>Other</span><span>10</span></div>
          </div>
          <h3>Role Distribution</h3>
          <div className="pie-legend">
            <span><i style={{ background: 'var(--accent-purple)' }} /> Leader 10%</span>
            <span><i style={{ background: 'var(--accent-blue)' }} /> Team Lead 30%</span>
            <span><i style={{ background: 'var(--text-secondary)' }} /> Member 60%</span>
          </div>
          <div className="team-composition">
            Team Composition: 4 Active Teams, 30 Team Leads, 15 Leaders.
          </div>
        </aside>
      </div>

      {changeRoleFor && (
        <div className="modal-overlay" onClick={() => setChangeRoleFor(null)}>
          <div className="change-role-modal glass" onClick={(e) => e.stopPropagation()}>
            <h3>Change Role for {changeRoleFor.name}</h3>
            <div className="role-options">
              <div className="role-option">
                <span className="role-pill member">Member</span>
              </div>
              <div className="role-option selected">
                <span className="role-pill team-lead">Team Lead</span>
                <p>Can manage team projects and assign tasks.</p>
              </div>
              <div className="role-option">
                <span className="role-pill leader"><Crown size={14} /> Leader</span>
                <p>Full administrative control, member management, and strategic oversight.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setChangeRoleFor(null)}>Cancel</button>
              <button className="confirm-btn">Confirm Change</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
