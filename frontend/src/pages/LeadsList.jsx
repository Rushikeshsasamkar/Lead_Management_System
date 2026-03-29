import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function LeadsList() {
  const { hasPermission } = useAuth()
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // filters state
  const [filters, setFilters] = useState({
    q: '', status: '', source: '', createdFrom: '', createdTo: '', sort: 'createdAt:desc'
  })
  const [page, setPage] = useState(1)

  // debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, q: searchInput }))
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 10, ...filters }
      // remove empty params
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await api.get('/leads', { params })
      setLeads(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  async function deleteLead(id, name) {
    if (!confirm(`Delete lead "${name}"?`)) return
    try {
      await api.delete(`/leads/${id}`)
      fetchLeads()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  function getStatusBadge(status) {
    return <span className={`badge badge-${status}`}>{status}</span>
  }

  function handleFilterChange(e) {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setPage(1)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Leads ({pagination.total})</h1>
        {hasPermission('lead:write') && (
          <Link to="/leads/new" className="btn btn-primary">+ Add Lead</Link>
        )}
      </div>

      {/* filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search name, email, phone..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          style={{ minWidth: '220px' }}
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <select name="source" value={filters.source} onChange={handleFilterChange}>
          <option value="">All Sources</option>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="cold">Cold</option>
          <option value="social">Social</option>
          <option value="other">Other</option>
        </select>
        <input type="date" name="createdFrom" aria-label="From date" value={filters.createdFrom} onChange={handleFilterChange} onClick={e => e.target.showPicker?.()} />
        <input type="date" name="createdTo" aria-label="To date" value={filters.createdTo} onChange={handleFilterChange} onClick={e => e.target.showPicker?.()} />
        <select name="sort" value={filters.sort} onChange={handleFilterChange}>
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="name:asc">Name A-Z</option>
          <option value="name:desc">Name Z-A</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          setFilters({ q: '', status: '', source: '', createdFrom: '', createdTo: '', sort: 'createdAt:desc' })
          setSearchInput('')
          setPage(1)
        }}>Clear</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <p>No leads found</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead._id}>
                    <td><strong>{lead.name}</strong></td>
                    <td>{lead.phone}</td>
                    <td>{lead.email || '-'}</td>
                    <td>{lead.source}</td>
                    <td>{getStatusBadge(lead.status)}</td>
                    <td>{lead.assignedTo?.name || '-'}</td>
                    <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      {hasPermission('lead:write') && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/leads/${lead._id}/edit`)}
                        >Edit</button>
                      )}
                      {hasPermission('lead:delete') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteLead(lead._id, lead.name)}
                        >Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="pagination">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</button>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>{p}</button>
              )
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}
