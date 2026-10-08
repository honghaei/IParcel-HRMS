import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { FaBullhorn, FaEdit, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import AppShell from '../components/AppShell'
import { API_BASE_URL } from '../config/api'
import type { Announcement, LoggedInUser } from '../types/hr'
import '../styles/Modules.css'

type AnnouncementForm={
  id?:string
  title:string
  message:string
  audience:string
  priority:'Normal'|'Important'|'Urgent'
  expires_at:string
}

const blankForm:AnnouncementForm={
  title:'',
  message:'',
  audience:'All Companies',
  priority:'Normal',
  expires_at:''
}

function isExpired(item:Announcement){
  return Boolean(item.expires_at)&&new Date(item.expires_at!).getTime()<Date.now()
}

function expiringSoon(item:Announcement){
  if(!item.expires_at||isExpired(item)) return false
  const diff=new Date(item.expires_at).getTime()-Date.now()
  return diff<=7*86400000
}

function datetimeLocal(value?:string|null){
  if(!value) return ''
  return value.replace(' ','T').slice(0,16)
}

export default function Announcements(){
  const [items,setItems]=useState<Announcement[]>([])
  const [open,setOpen]=useState(false)
  const [form,setForm]=useState<AnnouncementForm>(blankForm)
  const [search,setSearch]=useState('')
  const [audience,setAudience]=useState('all')
  const [priority,setPriority]=useState('all')
  const [visibility,setVisibility]=useState('active')
  const [deleteTarget,setDeleteTarget]=useState<Announcement|null>(null)
  const [message,setMessage]=useState('')
  const [saving,setSaving]=useState(false)

  const user:LoggedInUser=JSON.parse(
    localStorage.getItem('user')||'{"name":"HR Administrator","username":"hr","role":"HR"}'
  )

  const load=async()=>{
    try{
      const response=await axios.get<Announcement[]>(`${API_BASE_URL}/get_announcements.php`)
      setItems(Array.isArray(response.data)?response.data:[])
    }catch(err){
      console.error(err)
      setMessage('Unable to load announcements.')
    }
  }

  useEffect(()=>{load()},[])

  const activeCount=items.filter(item=>!isExpired(item)).length
  const priorityCount=items.filter(item=>!isExpired(item)&&['Important','Urgent'].includes(item.priority)).length
  const expiringCount=items.filter(expiringSoon).length

  const audiences=useMemo(
    ()=>Array.from(new Set(items.map(item=>item.audience).filter(Boolean))).sort(),
    [items]
  )

  const filtered=useMemo(()=>items.filter(item=>{
    const expired=isExpired(item)
    if(visibility==='active'&&expired) return false
    if(visibility==='expired'&&!expired) return false
    if(audience!=='all'&&item.audience!==audience) return false
    if(priority!=='all'&&item.priority!==priority) return false

    const query=search.trim().toLowerCase()
    if(query&&![
      item.title,
      item.message,
      item.audience,
      item.priority,
      item.created_by
    ].join(' ').toLowerCase().includes(query)) return false

    return true
  }),[items,visibility,audience,priority,search])

  const startAdd=()=>{
    setForm(blankForm)
    setMessage('')
    setOpen(true)
  }

  const startEdit=(item:Announcement)=>{
    setForm({
      id:item.id,
      title:item.title,
      message:item.message,
      audience:item.audience,
      priority:item.priority,
      expires_at:datetimeLocal(item.expires_at)
    })
    setMessage('')
    setOpen(true)
  }

  const save=async()=>{
    if(!form.title.trim()||!form.message.trim()){
      setMessage('Title and message are required.')
      return
    }

    setSaving(true)
    setMessage('')

    try{
      const response=await axios.post(`${API_BASE_URL}/save_announcement.php`,{
        ...form,
        title:form.title.trim(),
        message:form.message.trim(),
        created_by:user.name||user.username||'HR'
      })

      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to save announcement.')
      }

      setOpen(false)
      setForm(blankForm)
      setMessage(`Announcement ${form.id?'updated':'published'} successfully.`)
      await load()
    }catch(err){
      console.error(err)
      setMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message||'Unable to save announcement.'
          : 'Unable to save announcement.'
      )
    }finally{
      setSaving(false)
    }
  }

  const remove=async()=>{
    if(!deleteTarget) return
    setSaving(true)

    try{
      const response=await axios.post(`${API_BASE_URL}/delete_announcement.php`,{id:deleteTarget.id})
      if(response.data?.success===false){
        throw new Error(response.data?.message||'Unable to delete announcement.')
      }

      setDeleteTarget(null)
      setMessage('Announcement deleted successfully.')
      await load()
    }catch(err){
      console.error(err)
      setMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message||'Unable to delete announcement.'
          : 'Unable to delete announcement.'
      )
      setDeleteTarget(null)
    }finally{
      setSaving(false)
    }
  }

  return (
    <AppShell eyebrow="COMMUNICATIONS" title="Announcements">
      <div className="module-page announcements-final-page">
        <div className="module-heading">
          <div><span className="eyebrow">COMPANY UPDATES</span><h1>Announcements</h1></div>
          <button className="primary-action" onClick={startAdd}><FaPlus/> New Announcement</button>
        </div>

        <section className="mini-stat-grid announcement-stats">
          <article><FaBullhorn/><div><span>Active</span><strong>{activeCount}</strong><small>published notices</small></div></article>
          <article><FaBullhorn/><div><span>Priority</span><strong>{priorityCount}</strong><small>important or urgent</small></div></article>
          <article><FaBullhorn/><div><span>Expiring Soon</span><strong>{expiringCount}</strong><small>within 7 days</small></div></article>
        </section>

        <section className="panel announcement-toolbar-panel">
          <div className="announcement-search">
            <FaSearch/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search announcements..."/>
          </div>

          <select value={audience} onChange={e=>setAudience(e.target.value)}>
            <option value="all">All Audiences</option>
            {audiences.map(value=><option key={value}>{value}</option>)}
          </select>

          <select value={priority} onChange={e=>setPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option>Normal</option>
            <option>Important</option>
            <option>Urgent</option>
          </select>

          <select value={visibility} onChange={e=>setVisibility(e.target.value)}>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="all">All</option>
          </select>
        </section>

        {message&&<div className="inline-message announcement-message">{message}</div>}

        <section className="announcement-grid announcement-grid-final">
          {filtered.map(item=>{
            const expired=isExpired(item)
            return (
              <article className={`panel announcement-card announcement-card-final ${item.priority.toLowerCase()} ${expired?'expired':''}`} key={item.id}>
                <div className="announcement-icon"><FaBullhorn/></div>

                <div className="announcement-content">
                  <div className="announcement-meta">
                    <span>{item.audience}</span>
                    <b>{item.priority}</b>
                    {expired&&<em>Expired</em>}
                    {!expired&&expiringSoon(item)&&<em>Expiring soon</em>}
                  </div>

                  <h2>{item.title}</h2>
                  <p>{item.message}</p>

                  <div className="announcement-footer-meta">
                    <small>{new Date(item.created_at).toLocaleString()} · {item.created_by}</small>
                    {item.expires_at&&<small>Expires {new Date(item.expires_at).toLocaleString()}</small>}
                  </div>
                </div>

                <div className="announcement-card-actions">
                  <button title="Edit announcement" onClick={()=>startEdit(item)}><FaEdit/></button>
                  <button className="delete" title="Delete announcement" onClick={()=>setDeleteTarget(item)}><FaTrash/></button>
                </div>
              </article>
            )
          })}

          {!filtered.length&&<div className="panel module-empty-card">No announcements match the selected filters.</div>}
        </section>

        {open&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setOpen(false)}>
            <div className="simple-modal announcement-form-modal" onMouseDown={e=>e.stopPropagation()}>
              <div className="simple-modal-head">
                <div><span className="eyebrow">NOTICE</span><h2>{form.id?'Edit':'New'} Announcement</h2></div>
                <button onClick={()=>setOpen(false)}>×</button>
              </div>

              <label>
                Title
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
              </label>

              <div className="announcement-form-grid">
                <label>
                  Audience
                  <select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})}>
                    <option>All Companies</option>
                    <option>IParcel Plus</option>
                    <option>IPXpress</option>
                    <option>Swift</option>
                    <option>Nagali</option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={e=>setForm({...form,priority:e.target.value as AnnouncementForm['priority']})}
                  >
                    <option>Normal</option>
                    <option>Important</option>
                    <option>Urgent</option>
                  </select>
                </label>
              </div>

              <label>
                Expiration <small>(optional)</small>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e=>setForm({...form,expires_at:e.target.value})}
                />
              </label>

              <label>
                Message
                <textarea rows={6} maxLength={3000} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/>
              </label>

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setOpen(false)}>Cancel</button>
                <button className="primary-action" disabled={saving} onClick={save}>
                  {saving?'Saving…':form.id?'Save Changes':'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget&&(
          <div className="simple-modal-backdrop" onMouseDown={()=>setDeleteTarget(null)}>
            <div className="simple-modal" onMouseDown={e=>e.stopPropagation()}>
              <div className="simple-modal-head">
                <div><span className="eyebrow">DELETE NOTICE</span><h2>Delete Announcement</h2></div>
                <button onClick={()=>setDeleteTarget(null)}>×</button>
              </div>

              <p className="modal-confirm-copy">Delete “<b>{deleteTarget.title}</b>”? This cannot be undone.</p>

              <div className="simple-modal-actions">
                <button className="secondary-action" onClick={()=>setDeleteTarget(null)}>Cancel</button>
                <button className="danger-action" disabled={saving} onClick={remove}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
