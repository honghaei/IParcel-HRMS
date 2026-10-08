import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  FaBirthdayCake,
  FaCalendarCheck,
  FaClock,
  FaPlaneDeparture,
  FaUmbrellaBeach,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import '../styles/Home.css'
import { API_BASE_URL } from '../config/api'
import type { DashboardData, LoggedInUser } from '../types/hr'

const emptyDashboard: DashboardData = {
  totalEmployees: 0,
  activeEmployees: 0,
  presentToday: 0,
  lateToday: 0,
  onLeaveToday: 0,
  pendingLeaves: 0,
  companyCounts: [],
  birthdays: [],
  anniversaries: [],
  recentHires: [],
  activities: [],
}

const companyClass = (company: string) => company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '')

export default function Home(){
  const [data,setData]=useState<DashboardData>(emptyDashboard)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const navigate=useNavigate()

  let user:LoggedInUser|null=null
  try{
    const raw=localStorage.getItem('user')
    if(raw) user=JSON.parse(raw)
  }catch{ user=null }

  useEffect(()=>{
    axios.get<DashboardData>(`${API_BASE_URL}/get_dashboard.php`)
      .then(response=>setData(response.data))
      .catch(err=>{
        console.error(err)
        setError('Unable to load the workforce dashboard.')
      })
      .finally(()=>setLoading(false))
  },[])

  const attendanceTotal=Math.max(1,data.presentToday+data.onLeaveToday+(data.totalEmployees-data.presentToday-data.onLeaveToday))
  const presentPct=Math.min(100,Math.round((data.presentToday/attendanceTotal)*100))
  const leavePct=Math.min(100,Math.round((data.onLeaveToday/attendanceTotal)*100))
  const absent=Math.max(0,data.totalEmployees-data.presentToday-data.onLeaveToday)

  return (
    <AppShell eyebrow="HR OVERVIEW" title="Home">
      <div className="home-page">
        <div className="home-heading-row">
          <div>
            <span className="eyebrow">WORKFORCE OVERVIEW</span>
            <h1>Good day, {user?.name?.split(' ')[0] || 'HR'}.</h1>
            <p>Here’s what is happening across all companies today.</p>
          </div>
          <div className="today-chip">
            <FaCalendarCheck/>
            <span>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span>
          </div>
        </div>

        {error&&<div className="home-error">{error}</div>}

        <section className="home-stats">
          <article className="summary-card blue"><FaUsers/><div><span>Total Employees</span><strong>{loading?'—':data.totalEmployees}</strong><small>Across all companies</small></div></article>
          <article className="summary-card green"><FaCalendarCheck/><div><span>Present Today</span><strong>{loading?'—':data.presentToday}</strong><small>{presentPct}% of workforce</small></div></article>
          <article className="summary-card purple"><FaPlaneDeparture/><div><span>On Leave</span><strong>{loading?'—':data.onLeaveToday}</strong><small>Approved leave today</small></div></article>
          <article className="summary-card amber"><FaUmbrellaBeach/><div><span>Pending Requests</span><strong>{loading?'—':data.pendingLeaves}</strong><small>Require HR review</small></div></article>
        </section>

        <section className="home-main-grid">
          <article className="panel dashboard-widget company-chart-card">
            <div className="panel-head"><div><span className="eyebrow">WORKFORCE</span><h2>Employees per company</h2></div><button onClick={()=>navigate('/dashboard')}>View employees</button></div>
            <div className="company-bars">
              {data.companyCounts.map(item=>{
                const max=Math.max(1,...data.companyCounts.map(x=>x.count))
                return <button key={item.company} onClick={()=>navigate(`/dashboard?company=${encodeURIComponent(item.company.toLowerCase())}`)} className={`company-bar-item ${companyClass(item.company)}`}>
                  <div className="company-bar-track"><span style={{height:`${Math.max(8,(item.count/max)*100)}%`}}/></div>
                  <strong>{item.count}</strong><small>{item.company}</small>
                </button>
              })}
            </div>
          </article>

          <article className="panel dashboard-widget attendance-overview-card">
            <div className="panel-head"><div><span className="eyebrow">TODAY</span><h2>Attendance overview</h2></div><button onClick={()=>navigate('/attendance')}>Open attendance</button></div>
            <div className="attendance-donut-wrap">
              <div className="attendance-donut" style={{background:`conic-gradient(#1fb878 0 ${presentPct}%, #f1ad1d ${presentPct}% ${presentPct+leavePct}%, #e6ebf1 ${presentPct+leavePct}% 100%)`}}><div><strong>{data.totalEmployees}</strong><span>Employees</span></div></div>
              <div className="attendance-legend">
                <div><i className="present-dot"/><span>Present</span><b>{data.presentToday}</b></div>
                <div><i className="leave-dot"/><span>On Leave</span><b>{data.onLeaveToday}</b></div>
                <div><i className="absent-dot"/><span>Not Logged</span><b>{absent}</b></div>
                <div><i className="late-dot"/><span>Late</span><b>{data.lateToday}</b></div>
              </div>
            </div>
          </article>

          <article className="panel dashboard-widget activity-card">
            <div className="panel-head"><div><span className="eyebrow">ACTIVITY</span><h2>Recent activity</h2></div></div>
            <div className="activity-list">
              {data.activities.length?data.activities.slice(0,5).map(item=><div className="activity-item" key={item.id}><span className="activity-icon"><FaClock/></span><div><strong>{item.action}</strong><small>{item.details}</small></div><time>{new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div>):<div className="widget-empty">No recent HR activity yet.</div>}
            </div>
          </article>
        </section>

        <section className="home-lower-grid">
          <article className="panel dashboard-widget people-widget">
            <div className="panel-head"><div><span className="eyebrow">MILESTONES</span><h2>Birthdays</h2></div><FaBirthdayCake/></div>
            {data.birthdays.length?data.birthdays.slice(0,4).map(person=><div className="home-person" key={person.id}><span>{person.name.split(' ').map(v=>v[0]).slice(0,2).join('')}</span><div><strong>{person.name}</strong><small>{person.company}</small></div><b>{person.detail||''}</b></div>):<div className="widget-empty">No upcoming birthdays.</div>}
          </article>

          <article className="panel dashboard-widget people-widget">
            <div className="panel-head"><div><span className="eyebrow">MILESTONES</span><h2>Work anniversaries</h2></div><FaCalendarCheck/></div>
            {data.anniversaries.length?data.anniversaries.slice(0,4).map(person=><div className="home-person" key={person.id}><span>{person.name.split(' ').map(v=>v[0]).slice(0,2).join('')}</span><div><strong>{person.name}</strong><small>{person.company}</small></div><b>{person.detail||''}</b></div>):<div className="widget-empty">No upcoming anniversaries.</div>}
          </article>

          <article className="panel dashboard-widget quick-actions-widget">
            <div className="panel-head"><div><span className="eyebrow">SHORTCUTS</span><h2>Quick actions</h2></div></div>
            <div className="home-quick-actions">
              <button onClick={()=>navigate('/dashboard')}><FaUserPlus/><span>Employees</span><small>Add or edit records</small></button>
              <button onClick={()=>navigate('/attendance')}><FaCalendarCheck/><span>Attendance</span><small>Log time in / out</small></button>
              <button onClick={()=>navigate('/leave-requests')}><FaUmbrellaBeach/><span>Leave Requests</span><small>Review pending requests</small></button>
              <button onClick={()=>navigate('/reports')}><FaUsers/><span>Reports</span><small>Export HR data</small></button>
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  )
}
