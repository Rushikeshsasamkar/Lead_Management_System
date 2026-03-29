import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function LeadForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'website',
    status: 'new', notes: '', assignedTo: ''
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (isEdit) {
      fetchLead()
    }
    if (hasPermission('user:read')) {
      fetchUsers()
    }
  }, [id])

  async function fetchLead() {
    try {
      const res = await api.get(`/leads/${id}`)
      const lead = res.data.lead
      setForm({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || 'website',
        status: lead.status || 'new',
        notes: lead.notes || '',
        assignedTo: lead.assignedTo?._id || lead.assignedTo || ''
      })
    } catch (err) {
      setApiError('Failed to load lead')
    }
  }

  async function fetchUsers() {
    try {
      const res = await api.get('/users')
      setUsers(res.data.users)
    } catch (err) {
      console.log('Could not load users')
    }
  }

  function validate() {
    const e = {}
    if (!form.name || form.name.length < 2 || form.name.length > 100) {
      e.name = 'Name must be 2-100 characters'
    }
    if (!form.phone || !/^[+]?[\d\s\-()\\.]{7,15}$/.test(form.phone)) {
      e.phone = 'Enter a valid phone number'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Enter a valid email'
    }
    return e
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    setSuccess('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.assignedTo) delete payload.assignedTo
      if (!payload.email) delete payload.email

      if (isEdit) {
        await api.patch(`/leads/${id}`, payload)
        setSuccess('Lead updated successfully!')
      } else {
        await api.post('/leads', payload)
        setSuccess('Lead created successfully!')
        setTimeout(() => navigate('/'), 1000)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        {apiError && <div className="alert alert-error">{apiError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Lead name" />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Phone No</label>
            <input type="number" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="lead@example.com" />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Source</label>
              <select name="source" value={form.source} onChange={handleChange}>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold">Cold</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {hasPermission('user:read') && (
            <div className="form-group">
              <label>Assign To</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handleChange}>
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Any additional notes..." />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
