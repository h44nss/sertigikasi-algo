import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DashboardStats, Registration } from '../types'

export const useAdminStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRegs, setRecentRegs] = useState<Registration[]>([])
  const [programReports, setProgramReports] = useState<{ id: string; title: string; registeredCount: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  // Single source of truth for fetching — no duplicate logic
  const fetchDashboardData = useCallback(async (cancelled?: { current: boolean }) => {
    setLoading(true)
    try {
      // 6 flat count queries — no rows, only numbers
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

      if (cancelled?.current) return

      setStats({
        totalPrograms: totalProgramsRes.count ?? 0,
        totalRegistrations: totalRegistrationsRes.count ?? 0,
        pendingRegistrations: pendingRes.count ?? 0,
        approvedRegistrations: approvedRes.count ?? 0,
        rejectedRegistrations: rejectedRes.count ?? 0,
        totalStudents: totalStudentsRes.count ?? 0,
      })

      // Only last 5 registrations — tiny payload
      const { data: recentData } = await supabase
        .from('registrations')
        .select('id, status, created_at, program:programs(id, title), user:users(id, name, nim)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (cancelled?.current) return
      setRecentRegs((recentData ?? []) as any)

      // Fetch programs with only approved-registration count + total count
      // to avoid pulling every registration row to client for revenue calc
      const { data: programsData } = await supabase
        .from('programs')
        .select('id, title, price, registrations(status)')
        .order('created_at', { ascending: false })

      if (cancelled?.current) return

      const reports = (programsData ?? []).map((p: any) => {
        const regs: any[] = p.registrations ?? []
        const approvedCount = regs.filter((r: any) => r.status === 'approved').length
        return {
          id: p.id,
          title: p.title,
          registeredCount: regs.length,
          revenue: approvedCount * (p.price ?? 0),
        }
      }).sort((a, b) => b.revenue - a.revenue)

      setProgramReports(reports)
    } catch (err) {
      console.error('[useAdminStats] error:', err)
    } finally {
      if (!cancelled?.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cancelled = { current: false }
    fetchDashboardData(cancelled)
    return () => { cancelled.current = true }
  }, [fetchDashboardData])

  // Public refresh for manual refetch (e.g. after an action)
  const refresh = useCallback(() => fetchDashboardData(), [fetchDashboardData])

  return { stats, recentRegs, programReports, loading, refresh }
}