import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  FaCalendarCheck,
  FaClock,
  FaDownload,
  FaEdit,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaSuitcaseRolling,
  FaTimes,
  FaUserClock
} from 'react-icons/fa'
import AppShell from '../components/AppShell'
import { API_BASE_URL } from '../config/api'
import type { AttendanceRecord, Employee, LeaveRequest } from '../types/hr'
import '../styles/Modules.css'

type Message = { type: 'success' | 'error'; text: string } | null
type RosterStatus = 'Present' | 'Late' | 'On Leave' | 'Not Logged'

type RosterRow = {
  employee: Employee
  record?: AttendanceRecord
  approvedLeave?: LeaveRequest
  status: RosterStatus
}

type CorrectionForm = {
  time_in: string
  time_out: string
  status: 'Present' | 'Late'
  notes: string
}

function localDate(){
  const d=new Date()
  const y=d.getFullYear()
  const m=String(d.getMonth()+1).padStart(2,'0')
  const day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

function currentTime(){
  const d=new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function normalize(value?:string|null){
  return (value||'').trim().toLowerCase()
}

function hhmm(value?:string|null){
  if(!value) return ''
  return value.slice(0,5)
}

function minutes(value?:string|null){
  if(!value) return null
  const match=value.match(/^(\d{1,2}):(\d{2})/)
  if(!match) return null
  return Number(match[1])*60+Number(match[2])
}

function displayTime(value?:string|null){
  if(!value) return '—'
  const mins=minutes(value)
  if(mins===null) return value
  const h=Math.floor(mins/60)
  const m=mins%60
  const suffix=h>=12?'PM':'AM'
  const hour=h%12||12
  return `${hour}:${String(m).padStart(2,'0')} ${suffix}`
}

function totalHours(start?:string|null,end?:string|null){
  const a=minutes(start)
  const b=minutes(end)
  if(a===null||b===null||b<a) return '—'
  const diff=b-a
  return `${Math.floor(diff/60)}h ${String(diff%60).padStart(2,'0')}m`
}

function downloadCsv(filename:string, rows:(string|number)[][]){
  const text=rows
    .map(row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(','))
    .join('\n')
  const blob=new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function isInactiveEmployee(employee:Employee){
  const status=normalize(employee.employment_status)
  return status==='resigned'||status==='terminated'
}

function leaveForDate(employeeId:string,date:string,leaves:LeaveRequest[]){
  return leaves.find(leave=>
    String(leave.employee_id)===String(employeeId) &&
    leave.status==='Approved' &&
    date>=leave.start_date &&
    date<=leave.end_date
  )
}

function derivedStatus(
  employee:Employee,
  record:AttendanceRecord|undefined,
  date:string,
  leaves:LeaveRequest[]
):{status:RosterStatus;approvedLeave?:LeaveRequest}{
  if(record?.time_in){
    return {
      status: normalize(record.status)==='late' ? 'Late' : 'Present'
    }
  }

  const approvedLeave=leaveForDate(employee.id,date,leaves)
  if(approvedLeave){
    return {status:'On Leave',approvedLeave}
  }

  return {status:'Not Logged'}
}

function companyLabel(value?:string|null){
  const key=normalize(value)
  const labels:Record<string,string>={
    'iparcel plus':'IParcel Plus',
    'ipxpress':'IPXpress',
    'swift':'Swift',
    'nagali':'Nagali'
  }
  return labels[key]||value||'—'
}

export default function Attendance(){
  const [employees,setEmployees]=useState<Employee[]>([])
  const [records,setRecords]=useState<AttendanceRecord[]>([])
  const [leaves,setLeaves]=useState<LeaveRequest[]>([])

  const [date,setDate]=useState(localDate())
  const [employeeId,setEmployeeId]=useState('')
  const [time,setTime]=useState(currentTime())
  const [remarks,setRemarks]=useState('')

  const [search,setSearch]=useState('')
  const [company,setCompany]=useState('all')
  const [department,setDepartment]=useState('all')
  const [statusFilter,setStatusFilter]=useState('all')

  const [message,setMessage]=useState<Message>(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)

  const [editing,setEditing]=useState<AttendanceRecord|null>(null)
  const [correction,setCorrection]=useState<CorrectionForm>({
    time_in:'',
    time_out:'',
    status:'Present',
    notes:''
  })

  const load=async()=>{
    setLoading(true)
    try{
      const [emp,att,leave]=await Promise.all([
        axios.get<Employee[]>(`${API_BASE_URL}/get_employee.php`),
        axios.get<AttendanceRecord[]>(`${API_BASE_URL}/get_attendance.php?date=${encodeURIComponent(date)}`),
        axios.get<LeaveRequest[]>(`${API_BASE_URL}/get_leaves.php`)
      ])

      setEmployees(emp.data.filter(employee=>employee&&employee.id&&!isInactiveEmployee(employee)))
      setRecords(Array.isArray(att.data)?att.data:[])
      setLeaves(Array.isArray(leave.data)?leave.data:[])
    }catch(err){
      console.error(err)
      setMessage({type:'error',text:'Unable to load attendance data. Check the HRMS backend connection.'})
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    load()
  },[date])

  useEffect(()=>{
    setEmployeeId('')
    setMessage(null)
  },[company,department])

  const recordMap=useMemo(
    ()=>new Map(records.map(record=>[String(record.employee_id),record])),
    [records]
  )

  const companies=useMemo(
    ()=>Array.from(new Set(employees.map(employee=>normalize(employee.company)).filter(Boolean))).sort(),
    [employees]
  )

  const departmentOptions=useMemo(()=>{
    const scoped=employees.filter(employee=>company==='all'||normalize(employee.company)===company)
    return Array.from(new Set(scoped.map(employee=>employee.department).filter(Boolean))).sort()
  },[employees,company])

  const baseEmployees=useMemo(()=>employees.filter(employee=>{
    if(company!=='all'&&normalize(employee.company)!==company) return false
    if(department!=='all'&&employee.department!==department) return false
    return true
  }),[employees,company,department])

  const baseRoster=useMemo<RosterRow[]>(
    ()=>baseEmployees.map(employee=>{
      const record=recordMap.get(String(employee.id))
      const result=derivedStatus(employee,record,date,leaves)
      return {
        employee,
        record,
        approvedLeave:result.approvedLeave,
        status:result.status
      }
    }),
    [baseEmployees,recordMap,date,leaves]
  )

  const visibleRoster=useMemo(()=>baseRoster.filter(row=>{
    if(statusFilter!=='all'&&normalize(row.status)!==statusFilter) return false

    const query=search.trim().toLowerCase()
    if(!query) return true

    const employee=row.employee
    return [
      employee.first_name,
      employee.middle_name,
      employee.last_name,
      employee.employee_number,
      employee.company,
      employee.department,
      employee.designation,
      employee.location
    ].join(' ').toLowerCase().includes(query)
  }),[baseRoster,statusFilter,search])

  const counts=useMemo(()=>({
    clockedIn:baseRoster.filter(row=>row.status==='Present'||row.status==='Late').length,
    late:baseRoster.filter(row=>row.status==='Late').length,
    onLeave:baseRoster.filter(row=>row.status==='On Leave').length,
    notLogged:baseRoster.filter(row=>row.status==='Not Logged').length
  }),[baseRoster])

  const selectedEmployee=employees.find(employee=>String(employee.id)===employeeId)
  const selectedRecord=employeeId?recordMap.get(String(employeeId)):undefined
  const selectedLeave=employeeId?leaveForDate(employeeId,date,leaves):undefined
  const selectedStatus=selectedEmployee
    ? derivedStatus(selectedEmployee,selectedRecord,date,leaves).status
    : null

  const canTimeIn=Boolean(
    employeeId &&
    !selectedLeave &&
    !selectedRecord?.time_in &&
    !saving
  )

  const canTimeOut=Boolean(
    employeeId &&
    !selectedLeave &&
    selectedRecord?.time_in &&
    !selectedRecord?.time_out &&
    !saving
  )

  const save=async(action:'in'|'out')=>{
    if(!employeeId){
      setMessage({type:'error',text:'Select an employee first.'})
      return
    }

    if(selectedLeave){
      setMessage({
        type:'error',
        text:`This employee has approved ${selectedLeave.leave_type} for the selected date.`
      })
      return
    }

    if(action==='in'&&selectedRecord?.time_in){
      setMessage({
        type:'error',
        text:'Time In is already recorded. Use Correct Attendance if the entry needs to be changed.'
      })
      return
    }

    if(action==='out'&&!selectedRecord?.time_in){
      setMessage({type:'error',text:'Record Time In before Time Out.'})
      return
    }

    if(action==='out'&&selectedRecord?.time_out){
      setMessage({
        type:'error',
        text:'Time Out is already recorded. Use Correct Attendance if the entry needs to be changed.'
      })
      return
    }

    setSaving(true)
    setMessage(null)

    try{
      const response=await axios.post(`${API_BASE_URL}/save_attendance.php`,{
        employee_id:employeeId,
        work_date:date,
        time,
        action,
        notes:remarks
      })

      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to save attendance.')
      }

      setMessage({
        type:'success',
        text:action==='in'?'Time In recorded successfully.':'Time Out recorded successfully.'
      })
      setRemarks('')
      await load()
    }catch(err){
      console.error(err)
      const text=axios.isAxiosError(err)
        ? err.response?.data?.message||'Unable to save attendance.'
        : 'Unable to save attendance.'
      setMessage({type:'error',text})
    }finally{
      setSaving(false)
    }
  }

  const openCorrection=(record:AttendanceRecord)=>{
    setEditing(record)
    setCorrection({
      time_in:hhmm(record.time_in),
      time_out:hhmm(record.time_out),
      status:normalize(record.status)==='late'?'Late':'Present',
      notes:record.notes||''
    })
  }

  const saveCorrection=async()=>{
    if(!editing) return

    if(!correction.time_in){
      setMessage({type:'error',text:'A corrected Time In value is required.'})
      return
    }

    const start=minutes(correction.time_in)
    const end=minutes(correction.time_out)

    if(start!==null&&end!==null&&end<start){
      setMessage({type:'error',text:'Time Out cannot be earlier than Time In.'})
      return
    }

    setSaving(true)
    setMessage(null)

    try{
      const response=await axios.post(`${API_BASE_URL}/save_attendance.php`,{
        employee_id:editing.employee_id,
        work_date:editing.work_date,
        action:'edit',
        time_in:correction.time_in,
        time_out:correction.time_out,
        status:correction.status,
        notes:correction.notes
      })

      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to correct attendance.')
      }

      setEditing(null)
      setMessage({type:'success',text:'Attendance correction saved successfully.'})
      await load()
    }catch(err){
      console.error(err)
      const text=axios.isAxiosError(err)
        ? err.response?.data?.message||'Unable to correct attendance.'
        : 'Unable to correct attendance.'
      setMessage({type:'error',text})
    }finally{
      setSaving(false)
    }
  }

  const selectRosterEmployee=(row:RosterRow)=>{
    setEmployeeId(String(row.employee.id))
    setMessage(null)

    if(row.record){
      setTime(hhmm(row.record.time_out)||hhmm(row.record.time_in)||currentTime())
    }else{
      setTime(currentTime())
    }
  }

  const exportRows=()=>{
    const rows:(string|number)[][]=[
      ['Date','Employee No.','Employee','Company','Department','Time In','Time Out','Total Hours','Status','Remarks']
    ]

    visibleRoster.forEach(row=>{
      rows.push([
        date,
        row.employee.employee_number||'',
        `${row.employee.first_name} ${row.employee.last_name}`.trim(),
        companyLabel(row.employee.company),
        row.employee.department||'',
        displayTime(row.record?.time_in),
        displayTime(row.record?.time_out),
        totalHours(row.record?.time_in,row.record?.time_out),
        row.status,
        row.record?.notes||row.approvedLeave?.reason||''
      ])
    })

    downloadCsv(`attendance-${date}.csv`,rows)
  }

  const clearFilters=()=>{
    setSearch('')
    setCompany('all')
    setDepartment('all')
    setStatusFilter('all')
  }

  const hasFilters=Boolean(search)||company!=='all'||department!=='all'||statusFilter!=='all'

  return (
    <AppShell eyebrow="TIMEKEEPING" title="Attendance">
      <div className="module-page attendance-page-final">
        <div className="module-heading">
          <div>
            <span className="eyebrow">DAILY TRACKING</span>
            <h1>Attendance</h1>
          </div>

          <button className="secondary-action" onClick={exportRows}>
            <FaDownload/> Export CSV
          </button>
        </div>

        <section className="mini-stat-grid attendance-stat-grid">
          <article>
            <FaCalendarCheck/>
            <div>
              <span>Clocked In</span>
              <strong>{counts.clockedIn}</strong>
              <small>{baseRoster.length} employees in view</small>
            </div>
          </article>

          <article>
            <FaClock/>
            <div>
              <span>Late</span>
              <strong>{counts.late}</strong>
              <small>after 8:05 AM</small>
            </div>
          </article>

          <article>
            <FaSuitcaseRolling/>
            <div>
              <span>On Leave</span>
              <strong>{counts.onLeave}</strong>
              <small>approved requests</small>
            </div>
          </article>

          <article>
            <FaUserClock/>
            <div>
              <span>Not Logged</span>
              <strong>{counts.notLogged}</strong>
              <small>no Time In yet</small>
            </div>
          </article>
        </section>

        <section className="panel attendance-entry-panel attendance-entry-final">
          <div className="panel-head attendance-panel-head">
            <div>
              <span className="eyebrow">HR ATTENDANCE ENTRY</span>
              <h2>Log employee time</h2>
            </div>

            <span className="attendance-date-badge">
              {new Date(date+'T00:00:00').toLocaleDateString('en-US',{
                weekday:'short',
                month:'short',
                day:'numeric',
                year:'numeric'
              })}
            </span>
          </div>

          <div className="entry-grid attendance-entry-grid-final">
            <label>
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={event=>{
                  setDate(event.target.value)
                  setEmployeeId('')
                  setMessage(null)
                }}
              />
            </label>

            <label>
              <span>Employee</span>
              <select
                value={employeeId}
                onChange={event=>{
                  setEmployeeId(event.target.value)
                  setMessage(null)
                  setRemarks('')
                }}
              >
                <option value="">Select employee</option>
                {baseEmployees.map(employee=>
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_number} — {employee.first_name} {employee.last_name}
                  </option>
                )}
              </select>
            </label>

            <label>
              <span>Time</span>
              <div className="time-with-now">
                <input
                  type="time"
                  value={time}
                  onChange={event=>setTime(event.target.value)}
                />
                <button type="button" onClick={()=>setTime(currentTime())}>Now</button>
              </div>
            </label>

            <label className="attendance-remarks-field">
              <span>Remarks</span>
              <input
                value={remarks}
                onChange={event=>setRemarks(event.target.value)}
                placeholder="Optional note"
                maxLength={255}
              />
            </label>

            <div className="entry-actions">
              <button
                className="clock-in"
                disabled={!canTimeIn}
                onClick={()=>save('in')}
                title={!canTimeIn&&employeeId?'Time In is unavailable for this employee/date.':''}
              >
                <FaSignInAlt/> Time In
              </button>

              <button
                className="clock-out"
                disabled={!canTimeOut}
                onClick={()=>save('out')}
                title={!canTimeOut&&employeeId?'Record Time In first, or use correction if Time Out already exists.':''}
              >
                <FaSignOutAlt/> Time Out
              </button>
            </div>
          </div>

          {selectedEmployee&&(
            <div className={`attendance-current-record ${selectedStatus==='On Leave'?'on-leave':''}`}>
              <div className="attendance-current-person">
                <span className="attendance-initials">
                  {(selectedEmployee.first_name?.[0]||'')+(selectedEmployee.last_name?.[0]||'')}
                </span>
                <div>
                  <strong>{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>
                  <small>
                    {companyLabel(selectedEmployee.company)}
                    {selectedEmployee.department?` · ${selectedEmployee.department}`:''}
                  </small>
                </div>
              </div>

              <div className="attendance-current-meta">
                <span>Time In <b>{displayTime(selectedRecord?.time_in)}</b></span>
                <span>Time Out <b>{displayTime(selectedRecord?.time_out)}</b></span>
                <span>Status <b>{selectedStatus||'—'}</b></span>
              </div>

              {selectedLeave&&(
                <div className="attendance-leave-note">
                  Approved {selectedLeave.leave_type}
                </div>
              )}

              {selectedRecord&&(
                <button className="attendance-correct-btn" onClick={()=>openCorrection(selectedRecord)}>
                  <FaEdit/> Correct Attendance
                </button>
              )}
            </div>
          )}

          {message&&(
            <div className={`inline-message attendance-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </section>

        <section className="panel module-table-panel attendance-roster-panel">
          <div className="attendance-roster-toolbar">
            <div className="attendance-roster-heading">
              <span className="eyebrow">DAILY ROSTER</span>
              <strong>
                {new Date(date+'T00:00:00').toLocaleDateString('en-US',{
                  weekday:'long',
                  month:'long',
                  day:'numeric',
                  year:'numeric'
                })}
              </strong>
            </div>

            <div className="attendance-search">
              <FaSearch/>
              <input
                value={search}
                onChange={event=>setSearch(event.target.value)}
                placeholder="Search employee..."
              />
            </div>

            <select
              value={company}
              onChange={event=>{
                setCompany(event.target.value)
                setDepartment('all')
              }}
            >
              <option value="all">All Companies</option>
              {companies.map(value=>
                <option key={value} value={value}>{companyLabel(value)}</option>
              )}
            </select>

            <select
              value={department}
              onChange={event=>setDepartment(event.target.value)}
            >
              <option value="all">All Departments</option>
              {departmentOptions.map(value=><option key={value}>{value}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={event=>setStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="on leave">On Leave</option>
              <option value="not logged">Not Logged</option>
            </select>

            {hasFilters&&(
              <button className="attendance-clear-filters" onClick={clearFilters}>
                <FaTimes/> Clear
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="module-table attendance-table-final">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Company</th>
                  <th>Department</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading&&visibleRoster.map(row=>
                  <tr
                    key={row.employee.id}
                    className={String(row.employee.id)===employeeId?'selected-attendance-row':''}
                    onClick={()=>selectRosterEmployee(row)}
                  >
                    <td>
                      <strong>{row.employee.first_name} {row.employee.last_name}</strong>
                      <small>{row.employee.employee_number}</small>
                    </td>
                    <td>{companyLabel(row.employee.company)}</td>
                    <td>{row.employee.department||'—'}</td>
                    <td className="attendance-time-cell">{displayTime(row.record?.time_in)}</td>
                    <td className="attendance-time-cell">{displayTime(row.record?.time_out)}</td>
                    <td>{totalHours(row.record?.time_in,row.record?.time_out)}</td>
                    <td>
                      <span className={`status-pill ${normalize(row.status).replace(/\s+/g,'-')}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="attendance-remarks-cell">
                      {row.record?.notes||row.approvedLeave?.reason||'—'}
                    </td>
                    <td onClick={event=>event.stopPropagation()}>
                      {row.record
                        ? <button
                            className="attendance-row-edit"
                            title="Correct attendance"
                            onClick={()=>openCorrection(row.record!)}
                          >
                            <FaEdit/>
                          </button>
                        : <button
                            className="attendance-row-edit"
                            title={row.status==='On Leave'?'Employee is on approved leave':'Select employee for attendance'}
                            disabled={row.status==='On Leave'}
                            onClick={()=>selectRosterEmployee(row)}
                          >
                            <FaClock/>
                          </button>
                      }
                    </td>
                  </tr>
                )}

                {loading&&(
                  <tr><td colSpan={9} className="empty-cell">Loading attendance roster…</td></tr>
                )}

                {!loading&&!visibleRoster.length&&(
                  <tr>
                    <td colSpan={9} className="empty-cell attendance-empty-state">
                      No employees match the selected attendance filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {editing&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setEditing(null)}>
            <div className="simple-modal attendance-correction-modal" onMouseDown={event=>event.stopPropagation()}>
              <div className="simple-modal-head">
                <div>
                  <span className="eyebrow">ATTENDANCE CORRECTION</span>
                  <h2>Correct attendance</h2>
                </div>
                <button onClick={()=>setEditing(null)}>×</button>
              </div>

              <div className="attendance-correction-summary">
                <strong>{editing.employee_name||'Employee'}</strong>
                <span>{new Date(editing.work_date+'T00:00:00').toLocaleDateString()}</span>
              </div>

              <div className="attendance-correction-grid">
                <label>
                  <span>Time In</span>
                  <input
                    type="time"
                    value={correction.time_in}
                    onChange={event=>setCorrection(current=>({...current,time_in:event.target.value}))}
                  />
                </label>

                <label>
                  <span>Time Out</span>
                  <input
                    type="time"
                    value={correction.time_out}
                    onChange={event=>setCorrection(current=>({...current,time_out:event.target.value}))}
                  />
                </label>

                <label>
                  <span>Status</span>
                  <select
                    value={correction.status}
                    onChange={event=>setCorrection(current=>({
                      ...current,
                      status:event.target.value as 'Present'|'Late'
                    }))}
                  >
                    <option>Present</option>
                    <option>Late</option>
                  </select>
                </label>

                <label className="span-2 attendance-correction-notes">
                  <span>Remarks</span>
                  <textarea
                    rows={3}
                    maxLength={255}
                    value={correction.notes}
                    onChange={event=>setCorrection(current=>({...current,notes:event.target.value}))}
                    placeholder="e.g. Manual correction, approved late arrival, forgot to clock out"
                  />
                </label>
              </div>

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setEditing(null)}>Cancel</button>
                <button className="primary-action" disabled={saving} onClick={saveCorrection}>
                  {saving?'Saving…':'Save Correction'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
