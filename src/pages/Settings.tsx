import { useState } from 'react'
import axios from 'axios'
import { FaKey, FaUser } from 'react-icons/fa'
import AppShell from '../components/AppShell'
import { API_BASE_URL } from '../config/api'
import type { LoggedInUser } from '../types/hr'
import '../styles/Modules.css'

export default function Settings(){
 const user:LoggedInUser=JSON.parse(localStorage.getItem('user')||'{"name":"HR User","username":"hr","role":"HR"}')
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState('')
 const save=async()=>{if(next!==confirm){setMessage('New passwords do not match.');return}try{const r=await axios.post(`${API_BASE_URL}/change_password.php`,{username:user.username,current_password:current,new_password:next});setMessage(r.data.message||'Password updated.');setCurrent('');setNext('');setConfirm('')}catch{setMessage('Unable to update password.')}}
 return <AppShell eyebrow="SYSTEM" title="Settings"><div className="module-page"><div className="module-heading"><div><span className="eyebrow">ACCOUNT & SYSTEM</span><h1>Settings</h1></div></div><section className="settings-grid"><article className="panel settings-card"><div className="settings-icon"><FaUser/></div><h2>Profile</h2><div className="settings-info"><span>Full Name<strong>{user.name}</strong></span><span>Username<strong>{user.username}</strong></span><span>Role<strong>{user.role}</strong></span></div></article><article className="panel settings-card"><div className="settings-icon"><FaKey/></div><h2>Change Password</h2><label>Current Password<input type="password" value={current} onChange={e=>setCurrent(e.target.value)}/></label><label>New Password<input type="password" value={next} onChange={e=>setNext(e.target.value)}/></label><label>Confirm New Password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{message&&<div className="inline-message">{message}</div>}<button className="primary-action" onClick={save}>Update Password</button></article></section></div></AppShell>
}
