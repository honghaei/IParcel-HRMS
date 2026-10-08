export interface Employee {
  id: string
  employee_number: string
  first_name: string
  middle_name: string
  last_name: string
  designation: string
  employment_status: string
  company: string
  department: string
  provincial_address: string
  home_address: string
  location: string
  years_of_service: string
  marital_status: string
  date_hired: string
  children_count: string
  birthplace: string
  birthdate: string
  contact_number: string
  pay_rate: string
  sss: string
  pagibig: string
  philhealth: string
  tin: string
  payment_basis: string
  email: string
  emergency_contact_person: string
  emergency_relationship: string
  emergency_contact_number: string
  emergency_address: string
  profile_picture: string
}

export interface LoggedInUser {
  id?: string
  name: string
  username: string
  role: string
}

export interface Department {
  id: string
  name: string
  company: string
  head_employee_id?: string | null
  head_name?: string | null
  head_designation?: string | null
  employee_count: number
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  employee_number?: string
  employee_name?: string
  company?: string
  department?: string
  work_date: string
  time_in: string | null
  time_out: string | null
  status: string
  notes?: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  employee_number?: string
  employee_name?: string
  company?: string
  department?: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_note?: string | null
  created_at?: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  audience: string
  priority: 'Normal' | 'Important' | 'Urgent'
  created_by: string
  expires_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface ActivityLog {
  id: string
  actor: string
  action: string
  details: string
  created_at: string
}

export interface DashboardCompanyCount {
  company: string
  count: number
}

export interface DashboardPerson {
  id: string
  name: string
  company: string
  date?: string
  detail?: string
}

export interface DashboardData {
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  lateToday: number
  onLeaveToday: number
  pendingLeaves: number
  companyCounts: DashboardCompanyCount[]
  birthdays: DashboardPerson[]
  anniversaries: DashboardPerson[]
  recentHires: DashboardPerson[]
  activities: ActivityLog[]
}
