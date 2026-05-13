import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { DashboardStats, Registration } from '../types'

export const useAdminStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRegs, setRecentRegs] = useState<Registration[]>([])
  const [programReports, setProgramReports] = useState<{ id: string, title: string, registeredCount: number, revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  const isMounted = useRef(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      // Allow re-fetch when component is re-mounted (e.g. navigating back)
      hasFetched.current = false
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true
    if (isMounted.current) setLoading(true)

    try {
      // Batch 1: All COUNT queries in one round — use head:true to avoid row data transfer
      const [
        totalProgramsRes,
        totalRegistrationsRes,
        pendingRes,
        approvedRes,
        rejectedRes,
        totalStudentsRes,
      ] = await Promise.all([
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      ])

      if (!isMounted.current) return

      setStats({
        totalPrograms: totalProgramsRes.count || 0,
        totalRegistrations: totalRegistrationsRes.count || 0,
        pendingRegistrations: pendingRes.count || 0,
        approvedRegistrations: approvedRes.count || 0,
        rejectedRegistrations: rejectedRes.count || 0,
        totalStudents: totalStudentsRes.count || 0,
      })

      // Batch 2: Data queries — only what's displayed
      const [recentDataRes, programsDataRes] = await Promise.all([
        supabase
          .from('registrations')
          .select('id, status, created_at, program:programs(id, title), user:users(id, name, nim)')
          .order('created_at', { ascending: false })
          .limit(5),
        // Use aggregate join: count per status from programs
        supabase
          .from('programs')
          .select('id, title, price, registrations(status)')
          .order('created_at', { ascending: false })
      ])

      if (!isMounted.current) return

      const programsData: any[] = programsDataRes.data || []
      const reports = programsData.map(p => {
        const regs: any[] = p.registrations || []
        const approvedCount = regs.filter((r: any) => r.status === 'approved').length
        return {
          id: p.id,
          title: p.title,
          registeredCount: regs.length,
          revenue: approvedCount * (p.price || 0)
        }
      }).sort((a, b) => b.revenue - a.revenue)

      setProgramReports(reports)
      setRecentRegs((recentDataRes.data as any) || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const refresh = useCallback(() => {
    hasFetched.current = false
    return fetchDashboardData()
  }, [fetchDashboardData])

  return { stats, recentRegs, programReports, loading, refresh }
}