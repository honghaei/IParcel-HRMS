import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Modal } from 'react-bootstrap'
import { FaEdit, FaEye, FaPlus, FaPrint, FaSearch, FaTimes } from 'react-icons/fa'
import { useLocation } from 'react-router-dom'
import AddEmployeeModal from '../components/AddEmployeeModal'
import AppShell from '../components/AppShell'
import '../styles/Dashboard.css'
import '../styles/EmployeeDirectory.css'
import { API_BASE_URL, employeeImageUrl } from '../config/api'
import type { Employee } from '../types/hr'

function formatDate(dateStr:string){
  if(!dateStr) return '—'
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})
}

function normalize(value?:string|null){
  return (value||'').trim().toLowerCase()
}

function companyLabel(company:string|null){
  if(!company || company==='all') return 'All Employees'
  const names:Record<string,string>={
    'iparcel plus':'IParcel Plus',
    'ipxpress':'IPXpress',
    'swift':'Swift',
    'nagali':'Nagali'
  }
  return names[normalize(company)]||company
}

function initials(emp:Employee){
  return `${emp.first_name?.[0]||''}${emp.last_name?.[0]||''}`.toUpperCase() || '—'
}

function EmployeeAvatar({employee,size='table'}:{employee:Employee;size?:'table'|'detail'}){
  const [imageFailed,setImageFailed]=useState(false)
  const hasPhoto=Boolean(employee.profile_picture)&&!imageFailed

  if(hasPhoto){
    return (
      <img
        className={`employee-avatar-img ${size}`}
        src={employeeImageUrl(employee.profile_picture)}
        alt={`${employee.first_name} ${employee.last_name}`}
        onError={()=>setImageFailed(true)}
      />
    )
  }

  return <span className={`employee-avatar-fallback ${size}`}>{initials(employee)}</span>
}

function EmployeeViewModal({
  employee,
  onClose,
  onEdit
}:{
  employee:Employee|null
  onClose:()=>void
  onEdit:(employee:Employee)=>void
}){
  if(!employee) return null

  return (
    <Modal show onHide={onClose} centered size="lg" dialogClassName="employee-view-dialog">
      <div className="employee-view-header">
        <div>
          <span className="eyebrow">EMPLOYEE PROFILE</span>
          <h2>{employee.first_name} {employee.last_name}</h2>
        </div>
        <button onClick={onClose} aria-label="Close employee details"><FaTimes/></button>
      </div>

      <div className="employee-view-body">
        <aside className="employee-view-summary">
          <EmployeeAvatar employee={employee} size="detail"/>
          <strong>{employee.last_name}, {employee.first_name} {employee.middle_name}</strong>
          <small>{employee.employee_number||'No employee number'}</small>
          <span className={`status-pill ${normalize(employee.employment_status)}`}>{employee.employment_status||'—'}</span>
        </aside>

        <div className="employee-view-grid">
          <div><span>Company</span><strong>{companyLabel(employee.company)}</strong></div>
          <div><span>Department</span><strong>{employee.department||'—'}</strong></div>
          <div><span>Designation</span><strong>{employee.designation||'—'}</strong></div>
          <div><span>Location</span><strong>{employee.location||'—'}</strong></div>
          <div><span>Date Hired</span><strong>{formatDate(employee.date_hired)}</strong></div>
          <div><span>Email</span><strong>{employee.email||'—'}</strong></div>
          <div><span>Contact No.</span><strong>{employee.contact_number||'—'}</strong></div>
          <div><span>Payment Basis</span><strong>{employee.payment_basis||'—'}</strong></div>
          <div className="span-2"><span>Home Address</span><strong>{employee.home_address||'—'}</strong></div>
        </div>
      </div>

      <div className="employee-view-footer">
        <button className="secondary-action" onClick={onClose}>Close</button>
        <button className="primary-action" onClick={()=>onEdit(employee)}><FaEdit/> Edit Employee</button>
      </div>
    </Modal>
  )
}

export default function Dashboard(){
  const [employees,setEmployees]=useState<Employee[]>([])
  const [showModal,setShowModal]=useState(false)
  const [searchTerm,setSearchTerm]=useState('')
  const [statusFilter,setStatusFilter]=useState('all')
  const [locationFilter,setLocationFilter]=useState('all')
  const [employeeToEdit,setEmployeeToEdit]=useState<Employee|null>(null)
  const [employeeToView,setEmployeeToView]=useState<Employee|null>(null)
  const [selectedCompany,setSelectedCompany]=useState<string>('all')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const location=useLocation()

  const fetchEmployees=async()=>{
    setLoading(true)
    setError('')
    try{
      const response=await axios.get<Employee[]>(`${API_BASE_URL}/get_employee.php`)
      setEmployees(response.data.filter(emp=>emp&&emp.id))
    }catch(err){
      console.error(err)
      setError('Unable to load employee records. Check the HRMS backend connection.')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{fetchEmployees()},[])

  useEffect(()=>{
    const query=new URLSearchParams(location.search)
    setSelectedCompany(query.get('company')||'all')
    setSearchTerm(query.get('q')||'')
    setLocationFilter('all')
  },[location.search])

  const companies=useMemo(
    ()=>Array.from(new Set(employees.map(emp=>normalize(emp.company)).filter(Boolean))).sort(),
    [employees]
  )

  const statuses=useMemo(
    ()=>Array.from(new Set(employees.map(emp=>emp.employment_status).filter(Boolean))).sort(),
    [employees]
  )

  const locations=useMemo(()=>{
    const scoped=employees.filter(emp=>selectedCompany==='all'||normalize(emp.company)===normalize(selectedCompany))
    return Array.from(new Set(scoped.map(emp=>emp.location).filter(Boolean))).sort()
  },[employees,selectedCompany])

  const filteredEmployees=useMemo(()=>employees
    .filter(emp=>selectedCompany==='all'||normalize(emp.company)===normalize(selectedCompany))
    .filter(emp=>statusFilter==='all'||normalize(emp.employment_status)===normalize(statusFilter))
    .filter(emp=>locationFilter==='all'||normalize(emp.location)===normalize(locationFilter))
    .filter(emp=>{
      const search=searchTerm.trim().toLowerCase()
      if(!search)return true
      return [
        emp.employee_number,
        emp.first_name,
        emp.middle_name,
        emp.last_name,
        emp.designation,
        emp.employment_status,
        emp.location,
        emp.company,
        emp.department,
        emp.email
      ].join(' ').toLowerCase().includes(search)
    })
    .sort((a,b)=>a.last_name.localeCompare(b.last_name)),
    [employees,selectedCompany,statusFilter,locationFilter,searchTerm]
  )

  const printTable=()=>{
    const table=document.querySelector('.employee-table')?.outerHTML
    if(!table)return

    const printWindow=window.open('','','width=1100,height=760')
    if(!printWindow)return

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${companyLabel(selectedCompany)} - Employee List</title>
          <style>
            body{font-family:Arial,sans-serif;padding:28px;color:#1f2937}
            h1{font-size:22px;margin-bottom:4px}
            p{font-size:12px;color:#6b7280;margin-top:0}
            table{width:100%;border-collapse:collapse;margin-top:18px}
            th,td{border-bottom:1px solid #ddd;padding:9px;text-align:left;font-size:11px}
            th{background:#f5f7fa}
            .employee-cell{display:flex;align-items:center;gap:8px}
            .employee-avatar-img,.employee-avatar-fallback{width:32px;height:32px;border-radius:50%}
            .employee-avatar-fallback{display:grid;place-items:center;background:#e7f1fc;color:#2f6597;font-weight:bold}
            .employee-cell small{display:block;color:#777;margin-top:2px}
            .employee-actions,.actions-col{display:none!important}
            button{display:none!important}
          </style>
        </head>
        <body>
          <h1>${companyLabel(selectedCompany)}</h1>
          <p>${filteredEmployees.length} ${filteredEmployees.length===1?'employee':'employees'}</p>
          ${table}
        </body>
      </html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  useEffect(()=>{
    const hotkey=(e:KeyboardEvent)=>{
      if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='p'){
        e.preventDefault()
        printTable()
      }
    }
    window.addEventListener('keydown',hotkey)
    return()=>window.removeEventListener('keydown',hotkey)
  })

  const clearFilters=()=>{
    setSearchTerm('')
    setSelectedCompany('all')
    setStatusFilter('all')
    setLocationFilter('all')
  }

  const hasFilters=Boolean(searchTerm)||selectedCompany!=='all'||statusFilter!=='all'||locationFilter!=='all'

  const startEdit=(employee:Employee)=>{
    setEmployeeToView(null)
    setEmployeeToEdit(employee)
    setShowModal(true)
  }

  return (
    <AppShell eyebrow="EMPLOYEE DIRECTORY" title={companyLabel(selectedCompany)}>
      <div className="employee-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">EMPLOYEE RECORDS</span>
            <h1>{companyLabel(selectedCompany)}</h1>
          </div>

          <div className="heading-actions">
            <button className="secondary-action" onClick={printTable}><FaPrint/> Print</button>
            <button
              className="primary-action"
              onClick={()=>{
                setEmployeeToEdit(null)
                setShowModal(true)
              }}
            >
              <FaPlus/> Add Employee
            </button>
          </div>
        </div>

        <section className="panel employee-directory-panel employee-directory-final">
          <div className="directory-toolbar directory-toolbar-final">
            <div className="directory-search">
              <FaSearch/>
              <input
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
                placeholder="Search employee, ID, designation, department..."
              />
            </div>

            <div className="directory-filter-row">
              <select
                aria-label="Filter by company"
                value={selectedCompany}
                onChange={e=>{
                  setSelectedCompany(e.target.value)
                  setLocationFilter('all')
                }}
              >
                <option value="all">All companies</option>
                {companies.map(company=>
                  <option key={company} value={company}>{companyLabel(company)}</option>
                )}
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={e=>setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {statuses.map(status=><option key={status} value={status}>{status}</option>)}
              </select>

              <select
                aria-label="Filter by location"
                value={locationFilter}
                onChange={e=>setLocationFilter(e.target.value)}
              >
                <option value="all">All locations</option>
                {locations.map(value=><option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            <div className="directory-result-block">
              <span className="result-count result-count-final">
                <b>{filteredEmployees.length}</b>
                <span>{filteredEmployees.length===1?'Employee':'Employees'}</span>
              </span>

              {hasFilters&&(
                <button className="clear-filter-btn" onClick={clearFilters}>
                  <FaTimes/> Clear
                </button>
              )}
            </div>
          </div>

          {error&&<div className="directory-error">{error}</div>}

          <div className="table-wrap">
            <table className="employee-table employee-table-final">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee No.</th>
                  <th>Date Hired</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading&&filteredEmployees.map(emp=>
                  <tr key={emp.id} onClick={()=>setEmployeeToView(emp)}>
                    <td>
                      <div className="employee-cell employee-cell-final">
                        <EmployeeAvatar employee={emp}/>
                        <div>
                          <strong>{emp.last_name}, {emp.first_name} {emp.middle_name}</strong>
                          <small>
                            {companyLabel(emp.company)}
                            {emp.department?` · ${emp.department}`:''}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>{emp.employee_number||'—'}</td>
                    <td>{formatDate(emp.date_hired)}</td>
                    <td>{emp.designation||'—'}</td>
                    <td>
                      <span className={`status-pill ${normalize(emp.employment_status)}`}>
                        {emp.employment_status||'—'}
                      </span>
                    </td>
                    <td>{emp.location||'—'}</td>
                    <td className="employee-actions" onClick={e=>e.stopPropagation()}>
                      <button
                        title="View employee"
                        aria-label={`View ${emp.first_name} ${emp.last_name}`}
                        onClick={()=>setEmployeeToView(emp)}
                      >
                        <FaEye/>
                      </button>
                      <button
                        title="Edit employee"
                        aria-label={`Edit ${emp.first_name} ${emp.last_name}`}
                        onClick={()=>startEdit(emp)}
                      >
                        <FaEdit/>
                      </button>
                    </td>
                  </tr>
                )}

                {loading&&(
                  <tr><td colSpan={7} className="empty-row">Loading employee records…</td></tr>
                )}

                {!loading&&!filteredEmployees.length&&(
                  <tr>
                    <td colSpan={7} className="empty-row employee-empty-state">
                      <strong>No employees found</strong>
                      <span>Try changing the search or filters.</span>
                      {hasFilters&&<button onClick={clearFilters}>Clear filters</button>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <AddEmployeeModal
          show={showModal}
          onClose={()=>{
            setShowModal(false)
            setEmployeeToEdit(null)
          }}
          onAdd={()=>{
            fetchEmployees()
            setShowModal(false)
            setEmployeeToEdit(null)
          }}
          employeeToEdit={employeeToEdit}
        />

        <EmployeeViewModal
          employee={employeeToView}
          onClose={()=>setEmployeeToView(null)}
          onEdit={startEdit}
        />
      </div>
    </AppShell>
  )
}
