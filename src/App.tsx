import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Announcements from './pages/Announcements'
import Attendance from './pages/Attendance'
import Dashboard from './pages/Dashboard'
import Departments from './pages/Departments'
import Home from './pages/Home'
import LeaveRequests from './pages/LeaveRequests'
import Login from './pages/Login'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function ProtectedRoute({children}:{children:ReactElement}){
  return localStorage.getItem('user') ? children : <Navigate to="/" replace />
}

export default function App(){
  return (
    <BrowserRouter basename="/hrms">
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/home" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
        <Route path="/attendance" element={<ProtectedRoute><Attendance/></ProtectedRoute>}/>
        <Route path="/leave-requests" element={<ProtectedRoute><LeaveRequests/></ProtectedRoute>}/>
        <Route path="/departments" element={<ProtectedRoute><Departments/></ProtectedRoute>}/>
        <Route path="/announcements" element={<ProtectedRoute><Announcements/></ProtectedRoute>}/>
        <Route path="/reports" element={<ProtectedRoute><Reports/></ProtectedRoute>}/>
        <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
        <Route path="*" element={<Navigate to="/home" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}
