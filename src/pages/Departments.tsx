import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { FaEdit, FaPlus, FaSearch, FaTrash, FaUsers } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { API_BASE_URL } from '../config/api'
import type { Department, Employee } from '../types/hr'
import '../styles/Modules.css'

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

export default function Departments(){
  const [departments,setDepartments]=useState<Department[]>([])
  const [employees,setEmployees]=useState<Employee[]>([])
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState<Department|null>(null)
  const [form,setForm]=useState({name:'',company:'iparcel plus',head_employee_id:''})
  const [search,setSearch]=useState('')
  const [companyFilter,setCompanyFilter]=useState('all')
  const [deleteTarget,setDeleteTarget]=useState<Department|null>(null)
  const [message,setMessage]=useState('')
  const [saving,setSaving]=useState(false)
  const navigate=useNavigate()

  const load=async()=>{
    try{
      const [d,e]=await Promise.all([
        axios.get<Department[]>(`${API_BASE_URL}/get_departments.php`),
        axios.get<Employee[]>(`${API_BASE_URL}/get_employee.php`)
      ])
      setDepartments(d.data)
      setEmployees(e.data)
    }catch(err){
      console.error(err)
      setMessage('Unable to load departments.')
    }
  }

  useEffect(()=>{load()},[])

  const filtered=useMemo(()=>departments.filter(d=>{
    if(companyFilter!=='all'&&normalize(d.company)!==companyFilter) return false
    const query=search.trim().toLowerCase()
    if(!query) return true
    return [d.name,d.company,d.head_name,d.head_designation].join(' ').toLowerCase().includes(query)
  }),[departments,companyFilter,search])

  const companies=useMemo(
    ()=>Array.from(new Set(departments.map(d=>normalize(d.company)).filter(Boolean))).sort(),
    [departments]
  )

  const headCandidates=useMemo(
    ()=>employees
      .filter(emp=>normalize(emp.company)===normalize(form.company))
      .filter(emp=>!['resigned','terminated'].includes(normalize(emp.employment_status)))
      .sort((a,b)=>a.last_name.localeCompare(b.last_name)),
    [employees,form.company]
  )

  const startAdd=()=>{
    setEditing(null)
    setForm({name:'',company:'iparcel plus',head_employee_id:''})
    setMessage('')
    setOpen(true)
  }

  const startEdit=(d:Department)=>{
    setEditing(d)
    setForm({
      name:d.name,
      company:normalize(d.company),
      head_employee_id:d.head_employee_id||''
    })
    setMessage('')
    setOpen(true)
  }

  const save=async()=>{
    const trimmed=form.name.trim()
    if(!trimmed){
      setMessage('Department name is required.')
      return
    }

    const duplicate=departments.some(d=>
      d.id!==editing?.id &&
      normalize(d.name)===normalize(trimmed) &&
      normalize(d.company)===normalize(form.company)
    )

    if(duplicate){
      setMessage('That department already exists for the selected company.')
      return
    }

    setSaving(true)
    setMessage('')

    try{
      const response=await axios.post(`${API_BASE_URL}/save_department.php`,{
        id:editing?.id,
        ...form,
        name:trimmed
      })

      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to save department.')
      }

      setOpen(false)
      setMessage(`Department ${editing?'updated':'added'} successfully.`)
      await load()
    }catch(err){
      console.error(err)
      setMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message||'Unable to save department.'
          : 'Unable to save department.'
      )
    }finally{
      setSaving(false)
    }
  }

  const remove=async()=>{
    if(!deleteTarget) return
    setSaving(true)
    setMessage('')

    try{
      const response=await axios.post(`${API_BASE_URL}/delete_department.php`,{id:deleteTarget.id})
      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to delete department.')
      }

      setDeleteTarget(null)
      setMessage('Department deleted successfully.')
      await load()
    }catch(err){
      console.error(err)
      setMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message||'Unable to delete department.'
          : 'Unable to delete department.'
      )
      setDeleteTarget(null)
    }finally{
      setSaving(false)
    }
  }

  const openEmployees=(department:Department)=>{
    const query=new URLSearchParams({
      company:normalize(department.company),
      q:department.name
    })
    navigate(`/dashboard?${query.toString()}`)
  }

  return (
    <AppShell eyebrow="ORGANIZATION" title="Departments">
      <div className="module-page departments-final-page">
        <div className="module-heading">
          <div>
            <span className="eyebrow">ORGANIZATION</span>
            <h1>Departments</h1>
          </div>
          <button className="primary-action" onClick={startAdd}><FaPlus/> Add Department</button>
        </div>

        <section className="panel department-toolbar-panel">
          <div className="department-search">
            <FaSearch/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search department or head..."/>
          </div>

          <select value={companyFilter} onChange={e=>setCompanyFilter(e.target.value)}>
            <option value="all">All Companies</option>
            {companies.map(value=><option key={value} value={value}>{companyLabel(value)}</option>)}
          </select>

          <div className="department-summary">
            <strong>{filtered.length}</strong>
            <span>{filtered.length===1?'Department':'Departments'}</span>
          </div>
        </section>

        {message&&<div className="inline-message department-message">{message}</div>}

        <section className="department-grid department-grid-final">
          {filtered.map(d=>
            <article className="panel department-card department-card-final" key={d.id}>
              <div className="department-card-top">
                <span>{companyLabel(d.company)}</span>
                <div>
                  <button onClick={()=>startEdit(d)} title="Edit department"><FaEdit/></button>
                  <button onClick={()=>setDeleteTarget(d)} title="Delete department"><FaTrash/></button>
                </div>
              </div>

              <h2>{d.name}</h2>

              <div className="department-head-block">
                <span>Department Head</span>
                <strong>{d.head_name||'Not assigned'}</strong>
                {d.head_designation&&<small>{d.head_designation}</small>}
              </div>

              <button className="department-employee-count" onClick={()=>openEmployees(d)}>
                <FaUsers/>
                <strong>{d.employee_count}</strong>
                <span>{d.employee_count===1?'employee':'employees'}</span>
              </button>
            </article>
          )}

          {!filtered.length&&(
            <div className="panel module-empty-card">No departments match the selected filters.</div>
          )}
        </section>

        {open&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setOpen(false)}>
            <div className="simple-modal department-form-modal" onMouseDown={e=>e.stopPropagation()}>
              <div className="simple-modal-head">
                <div><span className="eyebrow">DEPARTMENT</span><h2>{editing?'Edit':'Add'} Department</h2></div>
                <button onClick={()=>setOpen(false)}>×</button>
              </div>

              <label>
                Name
                <input
                  value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})}
                  placeholder="e.g. Operations"
                />
              </label>

              <label>
                Company
                <select
                  value={form.company}
                  onChange={e=>setForm({...form,company:e.target.value,head_employee_id:''})}
                >
                  <option value="iparcel plus">IParcel Plus</option>
                  <option value="ipxpress">IPXpress</option>
                  <option value="swift">Swift</option>
                  <option value="nagali">Nagali</option>
                </select>
              </label>

              <label>
                Department Head
                <select
                  value={form.head_employee_id}
                  onChange={e=>setForm({...form,head_employee_id:e.target.value})}
                >
                  <option value="">None</option>
                  {headCandidates.map(emp=>
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} — {emp.designation||'Employee'}
                    </option>
                  )}
                </select>
              </label>

              <small className="department-form-note">
                Department Head choices are limited to active employees from {companyLabel(form.company)}.
              </small>

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setOpen(false)}>Cancel</button>
                <button className="primary-action" disabled={saving} onClick={save}>
                  {saving?'Saving…':'Save Department'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setDeleteTarget(null)}>
            <div className="simple-modal department-delete-modal" onMouseDown={e=>e.stopPropagation()}>
              <div className="simple-modal-head">
                <div><span className="eyebrow">DELETE DEPARTMENT</span><h2>{deleteTarget.name}</h2></div>
                <button onClick={()=>setDeleteTarget(null)}>×</button>
              </div>

              {deleteTarget.employee_count>0
                ? <p>This department still has <b>{deleteTarget.employee_count}</b> assigned employees. Move those employees to another department before deleting it.</p>
                : <p>This permanently removes the department from {companyLabel(deleteTarget.company)}.</p>
              }

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setDeleteTarget(null)}>Cancel</button>
                <button className="danger-action" disabled={saving||deleteTarget.employee_count>0} onClick={remove}>
                  Delete Department
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
