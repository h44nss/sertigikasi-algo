export type UserRole = 'admin' | 'student'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  nim: string
  name: string
  role: UserRole
  created_at?: string
}

export interface Program {
  id: string
  title: string
  description: string
  date: string
  venue: string
  price: number
  created_at?: string
}

export interface Registration {
  id: string
  user_id: string
  program_id: string
  status: RegistrationStatus
  payment_status: 'unpaid' | 'paid'
  certificate_url: string | null
  created_at: string
  // Joined fields
  program?: Program
  user?: UserProfile
}

export interface DashboardStats {
  totalPrograms: number
  totalRegistrations: number
  pendingRegistrations: number
  approvedRegistrations: number
  rejectedRegistrations: number
  totalStudents: number
}
