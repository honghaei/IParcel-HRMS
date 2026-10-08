import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaSearch,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa'
import AppShell from '../components/AppShell'
import { API_BASE_URL } from '../config/api'
import type { LeaveRequest, LoggedInUser } from '../types/hr'
import '../styles/Modules.css'

type Decision = 'Approved' | 'Rejected'

function normalize(value?:string|null){
  return (value||'').trim().toLowerCase()
}

function companyLabel(value?:string|null){
  const labels:Record<string,string>={
    'iparcel plus':'IParcel Plus',
    'ipxpress':'IPXpress',
    'swift':'Swift',
    'nagali':'Nagali'
  }
  return labels[normalize(value)]||value||'—'
}

function leaveDays(start:string,end:string){
  const a=new Date(`${start}T00:00:00`)
  const b=new Date(`${end}T00:00:00`)
  const diff=Math.round((b.getTime()-a.getTime())/86400000)+1
  return Math.max(1,diff)
}

function formatDate(value?:string|null){
  if(!value) return '—'
  const normalized=value.includes('T')?value:(value.includes(' ')?value.replace(' ','T'):`${value}T00:00:00`)
  return new Date(normalized).toLocaleDateString('en-US',{
    month:'short',day:'numeric',year:'numeric'
  })
}

export default function LeaveRequests(){
  const [requests,setRequests]=useState<LeaveRequest[]>([])
  const [status,setStatus]=useState('All')
  const [company,setCompany]=useState('all')
  const [leaveType,setLeaveType]=useState('all')
  const [search,setSearch]=useState('')
  const [dateFilter,setDateFilter]=useState('')
  const [selected,setSelected]=useState<LeaveRequest|null>(null)
  const [reviewing,setReviewing]=useState<LeaveRequest|null>(null)
  const [decision,setDecision]=useState<Decision>('Approved')
  const [reviewNote,setReviewNote]=useState('')
  const [message,setMessage]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)

  const user:LoggedInUser=JSON.parse(
    localStorage.getItem('user')||'{"name":"HR Administrator","username":"hr","role":"HR"}'
  )

  const load=async()=>{
    setLoading(true)
    try{
      const response=await axios.get<LeaveRequest[]>(`${API_BASE_URL}/get_leaves.php`)
      setRequests(Array.isArray(response.data)?response.data:[])
    }catch(err){
      console.error(err)
      setMessage('Unable to load leave requests.')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{load()},[])

  const companies=useMemo(
    ()=>Array.from(new Set(requests.map(r=>normalize(r.company)).filter(Boolean))).sort(),
    [requests]
  )

  const leaveTypes=useMemo(
    ()=>Array.from(new Set(requests.map(r=>r.leave_type).filter(Boolean))).sort(),
    [requests]
  )

  const filtered=useMemo(()=>requests.filter(r=>{
    if(status!=='All'&&r.status!==status) return false
    if(company!=='all'&&normalize(r.company)!==company) return false
    if(leaveType!=='all'&&r.leave_type!==leaveType) return false
    if(dateFilter&&!(dateFilter>=r.start_date&&dateFilter<=r.end_date)) return false

    const query=search.trim().toLowerCase()
    if(query){
      const haystack=[
        r.employee_name,
        r.employee_number,
        r.company,
        r.department,
        r.leave_type,
        r.reason,
        r.status,
        r.reviewed_by,
        r.review_note
      ].join(' ').toLowerCase()

      if(!haystack.includes(query)) return false
    }

    return true
  }),[requests,status,company,leaveType,dateFilter,search])

  const counts={
    Pending:requests.filter(r=>r.status==='Pending').length,
    Approved:requests.filter(r=>r.status==='Approved').length,
    Rejected:requests.filter(r=>r.status==='Rejected').length
  }

  const openReview=(request:LeaveRequest,next:Decision)=>{
    setReviewing(request)
    setDecision(next)
    setReviewNote('')
    setMessage('')
  }

  const submitReview=async()=>{
    if(!reviewing) return
    setSaving(true)
    setMessage('')

    try{
      const response=await axios.post(`${API_BASE_URL}/update_leave_status.php`,{
        id:reviewing.id,
        status:decision,
        reviewed_by:user.name||user.username||'HR',
        review_note:reviewNote
      })

      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to review leave request.')
      }

      setReviewing(null)
      setMessage(`Leave request ${decision.toLowerCase()} successfully.`)
      await load()
    }catch(err){
      console.error(err)
      setMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message||'Unable to review leave request.'
          : 'Unable to review leave request.'
      )
    }finally{
      setSaving(false)
    }
  }

  const clearFilters=()=>{
    setStatus('All')
    setCompany('all')
    setLeaveType('all')
    setDateFilter('')
    setSearch('')
  }

  const hasFilters=status!=='All'||company!=='all'||leaveType!=='all'||Boolean(dateFilter)||Boolean(search)

  return (
    <AppShell eyebrow="TIME OFF" title="Leave Requests">
      <div className="module-page leave-final-page">
        <div className="module-heading">
          <div>
            <span className="eyebrow">HR REVIEW</span>
            <h1>Leave Requests</h1>
          </div>
        </div>

        <section className="mini-stat-grid leave-stat-grid-final">
          <article>
            <FaClock/>
            <div><span>Pending</span><strong>{counts.Pending}</strong><small>awaiting HR review</small></div>
          </article>
          <article>
            <FaCheckCircle/>
            <div><span>Approved</span><strong>{counts.Approved}</strong><small>approved requests</small></div>
          </article>
          <article>
            <FaTimesCircle/>
            <div><span>Rejected</span><strong>{counts.Rejected}</strong><small>declined requests</small></div>
          </article>
        </section>

        <section className="panel leave-workspace">
          <div className="leave-filter-toolbar">
            <div className="leave-search">
              <FaSearch/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search employee, request, reason..."
              />
            </div>

            <select value={company} onChange={e=>setCompany(e.target.value)}>
              <option value="all">All Companies</option>
              {companies.map(value=><option key={value} value={value}>{companyLabel(value)}</option>)}
            </select>

            <select value={leaveType} onChange={e=>setLeaveType(e.target.value)}>
              <option value="all">All Leave Types</option>
              {leaveTypes.map(value=><option key={value}>{value}</option>)}
            </select>

            <input
              className="leave-date-filter"
              type="date"
              value={dateFilter}
              onChange={e=>setDateFilter(e.target.value)}
              title="Show requests covering this date"
            />

            {hasFilters&&(
              <button className="attendance-clear-filters" onClick={clearFilters}>
                <FaTimes/> Clear
              </button>
            )}
          </div>

          <div className="leave-status-strip">
            {['All','Pending','Approved','Rejected'].map(item=>
              <button
                key={item}
                className={status===item?'active':''}
                onClick={()=>setStatus(item)}
              >
                {item}
              </button>
            )}

            <span>{filtered.length} {filtered.length===1?'request':'requests'}</span>
          </div>

          {message&&<div className="inline-message">{message}</div>}

          <div className="table-wrap">
            <table className="module-table leave-table-final">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Company</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Review</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading&&filtered.map(r=>
                  <tr key={r.id}>
                    <td>
                      <strong>{r.employee_name}</strong>
                      <small>{r.employee_number}{r.department?` · ${r.department}`:''}</small>
                    </td>
                    <td>{companyLabel(r.company)}</td>
                    <td>{r.leave_type}</td>
                    <td>{formatDate(r.start_date)} → {formatDate(r.end_date)}</td>
                    <td>{leaveDays(r.start_date,r.end_date)}</td>
                    <td className="leave-reason-cell">{r.reason||'—'}</td>
                    <td>
                      <span className={`status-pill ${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status==='Pending'
                        ? <span className="reviewed-label">Awaiting review</span>
                        : <div className="leave-reviewed-by">
                            <strong>{r.reviewed_by||'HR'}</strong>
                            <small>{formatDate(r.reviewed_at)}</small>
                          </div>
                      }
                    </td>
                    <td>
                      <div className="table-actions leave-row-actions">
                        <button title="View request" onClick={()=>setSelected(r)}><FaEye/></button>
                        {r.status==='Pending'&&<>
                          <button className="approve" title="Approve" onClick={()=>openReview(r,'Approved')}><FaCheck/></button>
                          <button className="reject" title="Reject" onClick={()=>openReview(r,'Rejected')}><FaTimes/></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                )}

                {loading&&<tr><td colSpan={9} className="empty-cell">Loading leave requests…</td></tr>}

                {!loading&&!filtered.length&&(
                  <tr><td colSpan={9} className="empty-cell">No leave requests match the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selected&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setSelected(null)}>
            <div className="simple-modal leave-detail-modal" onMouseDown={e=>e.stopPropagation()}>
              <div className="simple-modal-head">
                <div><span className="eyebrow">LEAVE REQUEST</span><h2>{selected.employee_name}</h2></div>
                <button onClick={()=>setSelected(null)}>×</button>
              </div>

              <div className="leave-detail-grid">
                <div><span>Employee No.</span><strong>{selected.employee_number||'—'}</strong></div>
                <div><span>Company</span><strong>{companyLabel(selected.company)}</strong></div>
                <div><span>Department</span><strong>{selected.department||'—'}</strong></div>
                <div><span>Leave Type</span><strong>{selected.leave_type}</strong></div>
                <div><span>Start Date</span><strong>{formatDate(selected.start_date)}</strong></div>
                <div><span>End Date</span><strong>{formatDate(selected.end_date)}</strong></div>
                <div><span>Total Days</span><strong>{leaveDays(selected.start_date,selected.end_date)}</strong></div>
                <div><span>Status</span><strong>{selected.status}</strong></div>
                <div className="span-2"><span>Reason</span><strong>{selected.reason||'—'}</strong></div>
                {selected.review_note&&(
                  <div className="span-2"><span>HR Review Note</span><strong>{selected.review_note}</strong></div>
                )}
              </div>

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setSelected(null)}>Close</button>
                {selected.status==='Pending'&&<>
                  <button className="secondary-action leave-reject-action" onClick={()=>{setSelected(null);openReview(selected,'Rejected')}}>Reject</button>
                  <button className="primary-action" onClick={()=>{setSelected(null);openReview(selected,'Approved')}}>Approve</button>
                </>}
              </div>
            </div>
          </div>
        )}

        {reviewing&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setReviewing(null)}>
            <div className={`simple-modal leave-review-modal ${decision.toLowerCase()}`} onMouseDown={e=>e.stopPropagation()}>
              <div className="simple-modal-head">
                <div>
                  <span className="eyebrow">CONFIRM HR REVIEW</span>
                  <h2>{decision==='Approved'?'Approve':'Reject'} Leave Request</h2>
                </div>
                <button onClick={()=>setReviewing(null)}>×</button>
              </div>

              <div className="leave-review-summary">
                <strong>{reviewing.employee_name}</strong>
                <span>{reviewing.leave_type} · {formatDate(reviewing.start_date)} → {formatDate(reviewing.end_date)}</span>
                <p>{reviewing.reason}</p>
              </div>

              <label>
                HR Review Note
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={reviewNote}
                  onChange={e=>setReviewNote(e.target.value)}
                  placeholder="Optional note for this review decision"
                />
              </label>

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setReviewing(null)}>Cancel</button>
                <button className={decision==='Approved'?'primary-action':'danger-action'} disabled={saving} onClick={submitReview}>
                  {saving?'Saving…':decision==='Approved'?'Confirm Approval':'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
