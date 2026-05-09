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
    return () => { isMounted.current = false }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    // In dev mode with StrictMode (though user removed it), this prevents double fetch
    // Also acts as a guard for the initial load
    if (hasFetched.current && isMounted.current) return
    
    if (isMounted.current) setLoading(true)
    hasFetched.current = true

    try {
      // Step 1: Parallel count queries and data queries
      // We use Supabase's join features to avoid fetching entire tables
      const [
        totalProgramsRes,
        totalRegistrationsRes,
        pendingRegistrationsRes,
        approvedRegistrationsRes,
        rejectedRegistrationsRes,
        totalStudentsRes,
        recentDataRes,
        programsDataRawRes
      ] = await Promise.all([
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('registrations')
          .select('*, program:programs(id, title), user:users(id, name, nim)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('programs')
          .select('id, title, price, registrations(status)')
      ])

      if (isMounted.current) {
        setStats({
          totalPrograms: totalProgramsRes.count || 0,
          totalRegistrations: totalRegistrationsRes.count || 0,
          pendingRegistrations: pendingRegistrationsRes.count || 0,
          approvedRegistrations: approvedRegistrationsRes.count || 0,
          rejectedRegistrations: rejectedRegistrationsRes.count || 0,
          totalStudents: totalStudentsRes.count || 0,
        })

        // Step 2: Process program reports efficiently
        const programsData: any[] = programsDataRawRes.data || []
        const reports = programsData.map(p => {
          const regs = p.registrations || []
          const approvedCount = regs.filter((r: any) => r.status === 'approved').length
          return {
            id: p.id,
            title: p.title,
            registeredCount: regs.length,
            revenue: approvedCount * p.price
          }
        }).sort((a, b) => b.revenue - a.revenue)

        setProgramReports(reports)
        setRecentRegs((recentDataRes.data as any) || [])
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return { 
    stats, 
    recentRegs, 
    programReports, 
    loading, 
    refresh: useCallback(() => {
      hasFetched.current = false
      return fetchDashboardData()
    }, [fetchDashboardData]) 
  }
}