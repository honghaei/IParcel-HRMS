import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  FaBirthdayCake,
  FaCalendarCheck,
  FaDownload,
  FaEye,
  FaPrint,
  FaUmbrellaBeach,
  FaUsers
} from 'react-icons/fa'
import AppShell from '../components/AppShell'
import { API_BASE_URL } from '../config/api'
import type { AttendanceRecord, Department, Employee, LeaveRequest } from '../types/hr'
import '../styles/Modules.css'

type ReportKey='employees'|'attendance'|'leaves'|'departments'|'milestones'
type Row=Record<string,string|number>

type ReportDefinition={
  key:ReportKey
  title:string
  subtitle:string
  icon:typeof FaUsers
}

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

function exportCsv(name:string,columns:string[],rows:Row[]){
  const body=[
    columns,
    ...rows.map(row=>columns.map(column=>row[column]??''))
  ]
    .map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))
    .join('\n')

  const blob=new Blob(['\ufeff'+body],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function formatDate(value?:string|null){
  if(!value) return '—'
  return new Date(`${value.slice(0,10)}T00:00:00`).toLocaleDateString('en-US',{
    month:'short',day:'numeric',year:'numeric'
  })
}

function displayTime(value?:string|null){
  if(!value) return '—'
  const [h,m]=value.split(':').map(Number)
  if(Number.isNaN(h)||Number.isNaN(m)) return value
  const suffix=h>=12?'PM':'AM'
  return `${h%12||12}:${String(m).padStart(2,'0')} ${suffix}`
}

function monthValue(value?:string|null){
  if(!value) return ''
  return String(new Date(`${value.slice(0,10)}T00:00:00`).getMonth()+1).padStart(2,'0')
}

export default function Reports(){
  const [employees,setEmployees]=useState<Employee[]>([])
  const [attendance,setAttendance]=useState<AttendanceRecord[]>([])
  const [leaves,setLeaves]=useState<LeaveRequest[]>([])
  const [departments,setDepartments]=useState<Department[]>([])
  const [selected,setSelected]=useState<ReportKey>('employees')
  const [loading,setLoading]=useState(true)

  const today=new Date()
  const monthStart=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
  const todayDate=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [company,setCompany]=useState('all')
  const [department,setDepartment]=useState('all')
  const [employeeStatus,setEmployeeStatus]=useState('all')
  const [attendanceStatus,setAttendanceStatus]=useState('all')
  const [leaveType,setLeaveType]=useState('all')
  const [leaveStatus,setLeaveStatus]=useState('all')
  const [dateFrom,setDateFrom]=useState(monthStart)
  const [dateTo,setDateTo]=useState(todayDate)
  const [month,setMonth]=useState(String(today.getMonth()+1).padStart(2,'0'))
  const [milestoneType,setMilestoneType]=useState('Both')

  useEffect(()=>{
    setLoading(true)
    Promise.all([
      axios.get<Employee[]>(`${API_BASE_URL}/get_employee.php`),
      axios.get<AttendanceRecord[]>(`${API_BASE_URL}/get_attendance.php`),
      axios.get<LeaveRequest[]>(`${API_BASE_URL}/get_leaves.php`),
      axios.get<Department[]>(`${API_BASE_URL}/get_departments.php`)
    ])
      .then(([e,a,l,d])=>{
        setEmployees(e.data)
        setAttendance(a.data)
        setLeaves(l.data)
        setDepartments(d.data)
      })
      .catch(console.error)
      .finally(()=>setLoading(false))
  },[])

  const reportCards:ReportDefinition[]=[
    {key:'employees',title:'Employee Directory',subtitle:`${employees.length} employee records`,icon:FaUsers},
    {key:'attendance',title:'Attendance Report',subtitle:`${attendance.length} time records`,icon:FaCalendarCheck},
    {key:'leaves',title:'Leave Requests',subtitle:`${leaves.length} leave records`,icon:FaUmbrellaBeach},
    {key:'departments',title:'Department Headcount',subtitle:`${departments.length} departments`,icon:FaUsers},
    {key:'milestones',title:'Birthday & Anniversary',subtitle:'Employee milestones',icon:FaBirthdayCake}
  ]

  const companies=useMemo(
    ()=>Array.from(new Set(employees.map(e=>normalize(e.company)).filter(Boolean))).sort(),
    [employees]
  )

  const departmentOptions=useMemo(()=>{
    const pool=employees.filter(e=>company==='all'||normalize(e.company)===company)
    return Array.from(new Set(pool.map(e=>e.department).filter(Boolean))).sort()
  },[employees,company])

  const leaveTypes=useMemo(
    ()=>Array.from(new Set(leaves.map(l=>l.leave_type).filter(Boolean))).sort(),
    [leaves]
  )

  const result=useMemo(()=>{
    let columns:string[]=[]
    let rows:Row[]=[]

    if(selected==='employees'){
      columns=['Employee No.','Employee','Company','Department','Designation','Status','Location','Date Hired']
      rows=employees
        .filter(e=>company==='all'||normalize(e.company)===company)
        .filter(e=>department==='all'||e.department===department)
        .filter(e=>employeeStatus==='all'||normalize(e.employment_status)===employeeStatus)
        .map(e=>({
          'Employee No.':e.employee_number,
          'Employee':`${e.first_name} ${e.last_name}`.trim(),
          'Company':companyLabel(e.company),
          'Department':e.department||'—',
          'Designation':e.designation||'—',
          'Status':e.employment_status||'—',
          'Location':e.location||'—',
          'Date Hired':formatDate(e.date_hired)
        }))
    }

    if(selected==='attendance'){
      columns=['Date','Employee','Company','Department','Time In','Time Out','Status','Remarks']
      rows=attendance
        .filter(a=>!dateFrom||a.work_date>=dateFrom)
        .filter(a=>!dateTo||a.work_date<=dateTo)
        .filter(a=>company==='all'||normalize(a.company)===company)
        .filter(a=>department==='all'||a.department===department)
        .filter(a=>attendanceStatus==='all'||normalize(a.status)===attendanceStatus)
        .map(a=>({
          'Date':formatDate(a.work_date),
          'Employee':a.employee_name||a.employee_id,
          'Company':companyLabel(a.company),
          'Department':a.department||'—',
          'Time In':displayTime(a.time_in),
          'Time Out':displayTime(a.time_out),
          'Status':a.status,
          'Remarks':a.notes||'—'
        }))
    }

    if(selected==='leaves'){
      columns=['Employee','Company','Department','Leave Type','Start','End','Reason','Status','Reviewed By']
      rows=leaves
        .filter(l=>!dateFrom||l.end_date>=dateFrom)
        .filter(l=>!dateTo||l.start_date<=dateTo)
        .filter(l=>company==='all'||normalize(l.company)===company)
        .filter(l=>leaveType==='all'||l.leave_type===leaveType)
        .filter(l=>leaveStatus==='all'||normalize(l.status)===leaveStatus)
        .map(l=>({
          'Employee':l.employee_name||l.employee_id,
          'Company':companyLabel(l.company),
          'Department':l.department||'—',
          'Leave Type':l.leave_type,
          'Start':formatDate(l.start_date),
          'End':formatDate(l.end_date),
          'Reason':l.reason||'—',
          'Status':l.status,
          'Reviewed By':l.reviewed_by||'—'
        }))
    }

    if(selected==='departments'){
      columns=['Department','Company','Department Head','Head Designation','Employees']
      rows=departments
        .filter(d=>company==='all'||normalize(d.company)===company)
        .map(d=>({
          'Department':d.name,
          'Company':companyLabel(d.company),
          'Department Head':d.head_name||'—',
          'Head Designation':d.head_designation||'—',
          'Employees':d.employee_count
        }))
    }

    if(selected==='milestones'){
      columns=['Employee','Company','Type','Date','Detail']
      const milestoneRows:Row[]=[]

      employees
        .filter(e=>company==='all'||normalize(e.company)===company)
        .forEach(e=>{
          if((milestoneType==='Both'||milestoneType==='Birthday')&&e.birthdate&&monthValue(e.birthdate)===month){
            milestoneRows.push({
              'Employee':`${e.first_name} ${e.last_name}`.trim(),
              'Company':companyLabel(e.company),
              'Type':'Birthday',
              'Date':formatDate(e.birthdate),
              'Detail':new Date(`${e.birthdate}T00:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric'})
            })
          }

          if((milestoneType==='Both'||milestoneType==='Anniversary')&&e.date_hired&&monthValue(e.date_hired)===month){
            const hired=new Date(`${e.date_hired}T00:00:00`)
            let years=today.getFullYear()-hired.getFullYear()
            if(today.getMonth()<hired.getMonth()||(today.getMonth()===hired.getMonth()&&today.getDate()<hired.getDate())) years--
            milestoneRows.push({
              'Employee':`${e.first_name} ${e.last_name}`.trim(),
              'Company':companyLabel(e.company),
              'Type':'Work Anniversary',
              'Date':formatDate(e.date_hired),
              'Detail':`${Math.max(0,years)} years`
            })
          }
        })

      rows=milestoneRows
    }

    return {columns,rows}
  },[
    selected,employees,attendance,leaves,departments,
    company,department,employeeStatus,attendanceStatus,
    leaveType,leaveStatus,dateFrom,dateTo,month,milestoneType
  ])

  const selectedCard=reportCards.find(card=>card.key===selected)!

  const resetFilters=()=>{
    setCompany('all')
    setDepartment('all')
    setEmployeeStatus('all')
    setAttendanceStatus('all')
    setLeaveType('all')
    setLeaveStatus('all')
    setDateFrom(monthStart)
    setDateTo(todayDate)
    setMonth(String(today.getMonth()+1).padStart(2,'0'))
    setMilestoneType('Both')
  }

  const exportCurrent=()=>{
    exportCsv(
      `${selected}-${new Date().toISOString().slice(0,10)}.csv`,
      result.columns,
      result.rows
    )
  }

  const printCurrent=()=>{
    const win=window.open('','','width=1100,height=800')
    if(!win) return

    const head=result.columns.map(column=>`<th>${column}</th>`).join('')
    const body=result.rows.map(row=>
      `<tr>${result.columns.map(column=>`<td>${String(row[column]??'')}</td>`).join('')}</tr>`
    ).join('')

    win.document.write(`<!doctype html>
      <html>
        <head>
          <title>${selectedCard.title}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:28px;color:#1f2937}
            h1{font-size:22px;margin:0 0 5px}
            p{color:#6b7280;font-size:12px}
            table{width:100%;border-collapse:collapse;margin-top:20px}
            th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:10px}
            th{background:#f4f6f8}
          </style>
        </head>
        <body>
          <h1>${selectedCard.title}</h1>
          <p>${result.rows.length} records · Generated ${new Date().toLocaleString()}</p>
          <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        </body>
      </html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  const filterControls=()=>{
    if(selected==='employees') return <>
      <select value={company} onChange={e=>{setCompany(e.target.value);setDepartment('all')}}>
        <option value="all">All Companies</option>
        {companies.map(v=><option key={v} value={v}>{companyLabel(v)}</option>)}
      </select>
      <select value={department} onChange={e=>setDepartment(e.target.value)}>
        <option value="all">All Departments</option>
        {departmentOptions.map(v=><option key={v}>{v}</option>)}
      </select>
      <select value={employeeStatus} onChange={e=>setEmployeeStatus(e.target.value)}>
        <option value="all">All Statuses</option>
        <option value="regular">Regular</option>
        <option value="probationary">Probationary</option>
        <option value="resigned">Resigned</option>
        <option value="terminated">Terminated</option>
      </select>
    </>

    if(selected==='attendance') return <>
      <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
      <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
      <select value={company} onChange={e=>{setCompany(e.target.value);setDepartment('all')}}>
        <option value="all">All Companies</option>
        {companies.map(v=><option key={v} value={v}>{companyLabel(v)}</option>)}
      </select>
      <select value={department} onChange={e=>setDepartment(e.target.value)}>
        <option value="all">All Departments</option>
        {departmentOptions.map(v=><option key={v}>{v}</option>)}
      </select>
      <select value={attendanceStatus} onChange={e=>setAttendanceStatus(e.target.value)}>
        <option value="all">All Statuses</option>
        <option value="present">Present</option>
        <option value="late">Late</option>
      </select>
    </>

    if(selected==='leaves') return <>
      <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
      <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
      <select value={company} onChange={e=>setCompany(e.target.value)}>
        <option value="all">All Companies</option>
        {companies.map(v=><option key={v} value={v}>{companyLabel(v)}</option>)}
      </select>
      <select value={leaveType} onChange={e=>setLeaveType(e.target.value)}>
        <option value="all">All Leave Types</option>
        {leaveTypes.map(v=><option key={v}>{v}</option>)}
      </select>
      <select value={leaveStatus} onChange={e=>setLeaveStatus(e.target.value)}>
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </>

    if(selected==='departments') return <>
      <select value={company} onChange={e=>setCompany(e.target.value)}>
        <option value="all">All Companies</option>
        {companies.map(v=><option key={v} value={v}>{companyLabel(v)}</option>)}
      </select>
    </>

    return <>
      <select value={month} onChange={e=>setMonth(e.target.value)}>
        {[
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
        ].map((label,index)=>
          <option key={label} value={String(index+1).padStart(2,'0')}>{label}</option>
        )}
      </select>
      <select value={company} onChange={e=>setCompany(e.target.value)}>
        <option value="all">All Companies</option>
        {companies.map(v=><option key={v} value={v}>{companyLabel(v)}</option>)}
      </select>
      <select value={milestoneType} onChange={e=>setMilestoneType(e.target.value)}>
        <option>Both</option>
        <option>Birthday</option>
        <option>Anniversary</option>
      </select>
    </>
  }

  return (
    <AppShell eyebrow="ANALYTICS" title="Reports">
      <div className="module-page reports-final-page">
        <div className="module-heading">
          <div><span className="eyebrow">ANALYTICS & EXPORTS</span><h1>Reports</h1></div>
        </div>

        <section className="mini-stat-grid report-summary-grid">
          <article><FaUsers/><div><span>Employees</span><strong>{employees.length}</strong><small>employee records</small></div></article>
          <article><FaCalendarCheck/><div><span>Attendance</span><strong>{attendance.length}</strong><small>time records</small></div></article>
          <article><FaUmbrellaBeach/><div><span>Leave Requests</span><strong>{leaves.length}</strong><small>leave records</small></div></article>
          <article><FaUsers/><div><span>Departments</span><strong>{departments.length}</strong><small>managed departments</small></div></article>
        </section>

        <section className="report-grid report-selector-grid">
          {reportCards.map(card=>{
            const Icon=card.icon
            return (
              <button
                className={`panel report-card ${selected===card.key?'selected':''}`}
                onClick={()=>{setSelected(card.key);resetFilters()}}
                key={card.key}
              >
                <span className="report-icon"><Icon/></span>
                <div><strong>{card.title}</strong><small>{card.subtitle}</small></div>
                <FaEye/>
              </button>
            )
          })}
        </section>

        <section className="panel report-workspace">
          <div className="report-workspace-head">
            <div>
              <span className="eyebrow">REPORT PREVIEW</span>
              <h2>{selectedCard.title}</h2>
              <small>{loading?'Loading…':`${result.rows.length} matching records`}</small>
            </div>

            <div className="report-actions">
              <button className="secondary-action" onClick={printCurrent}><FaPrint/> Print / PDF</button>
              <button className="primary-action" onClick={exportCurrent}><FaDownload/> Export CSV</button>
            </div>
          </div>

          <div className="report-filter-bar">
            {filterControls()}
            <button className="report-reset-btn" onClick={resetFilters}>Reset</button>
          </div>

          <div className="table-wrap report-preview-wrap">
            <table className="module-table report-preview-table">
              <thead>
                <tr>{result.columns.map(column=><th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.slice(0,100).map((row,index)=>
                  <tr key={index}>
                    {result.columns.map(column=><td key={column}>{row[column]}</td>)}
                  </tr>
                )}

                {!loading&&!result.rows.length&&(
                  <tr><td colSpan={Math.max(result.columns.length,1)} className="empty-cell">No records match the selected report filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {result.rows.length>100&&<div className="report-preview-note">Preview shows the first 100 records. Export includes all {result.rows.length} records.</div>}
        </section>
      </div>
    </AppShell>
  )
}
