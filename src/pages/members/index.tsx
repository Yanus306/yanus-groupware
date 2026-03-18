import { useState, useEffect } from 'react'
import { Search, Crown, ChevronDown } from 'lucide-react'
import { useApp } from '../../features/auth/model'
import { getMembers } from '../../shared/api/membersApi'
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
  const { state, isAdmin, loadMembers } = useApp()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('All Teams')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [changeRoleFor, setChangeRoleFor] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    getMembers()
      .then(loadMembers)
      .catch(() => {})
  }, [isAdmin, loadMembers])

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
        <div className="total-members glass">Total Members: {state.users.length}</div>
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
                    <span className={`team-tag ${u.team}`}>{teamLabels[u.team] ?? u.team}</span>
                  </td>
                  <td>
                    <span className={`role-tag ${u.role}`}>
                      {u.role === 'leader' && <Crown size={14} />}
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  </td>
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
            {Object.entries(teamLabels).map(([key, label]) => {
              const count = state.users.filter((u) => u.team === key).length
              const max = Math.max(...Object.keys(teamLabels).map((k) => state.users.filter((u) => u.team === k).length), 1)
              return (
                <div key={key} className="bar" style={{ height: `${(count / max) * 100}%` }}>
                  <span>{label.split(' ')[0]}</span>
                  <span>{count}</span>
                </div>
              )
            })}
          </div>
          <h3>Role Distribution</h3>
          <div className="pie-legend">
            <span><i style={{ background: 'var(--accent-purple)' }} /> Leader {state.users.filter((u) => u.role === 'leader').length}</span>
            <span><i style={{ background: 'var(--accent-blue, #72b8e8)' }} /> Team Lead {state.users.filter((u) => u.role === 'team_lead').length}</span>
            <span><i style={{ background: 'var(--text-secondary)' }} /> Member {state.users.filter((u) => u.role === 'member').length}</span>
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
