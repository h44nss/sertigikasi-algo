import React, { useMemo } from 'react'
import {
  BookOpen,
  ClipboardList,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useAdminStats } from '../../hooks/useAdminStats'
import { StatSkeleton, TableRowSkeleton } from '../../components/Skeleton'
import AdminSidebar from '../../components/AdminSidebar'
import StatusBadge from '../../components/StatusBadge'

const AdminDashboard: React.FC = () => {
  const { stats, recentRegs, programReports, loading } = useAdminStats()

  const statCards = useMemo(() => [
    {
      label: 'Total Program',
      value: stats?.totalPrograms,
      icon: BookOpen,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Mahasiswa',
      value: stats?.totalStudents,
      icon: Users,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Total Pendaftaran',
      value: stats?.totalRegistrations,
      icon: ClipboardList,
      color: 'bg-gray-50',
      iconColor: 'text-gray-600',
    },
    {
      label: 'Menunggu',
      value: stats?.pendingRegistrations,
      icon: Clock,
      color: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Disetujui',
      value: stats?.approvedRegistrations,
      icon: CheckCircle,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Ditolak',
      value: stats?.rejectedRegistrations,
      icon: XCircle,
      color: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ], [stats])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  const approvalRate = useMemo(() => 
    stats && stats.totalRegistrations > 0
      ? Math.round((stats.approvedRegistrations / stats.totalRegistrations) * 100)
      : 0,
    [stats]
  )

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(value)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          </div>
          <p className="text-gray-500 text-sm">Ringkasan statistik sistem sertifikasi kampus</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => <StatSkeleton key={i} />)
            : statCards.map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                    <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{card.value ?? 0}</p>
                </div>
              )
            })}
        </div>

        {/* Approval Rate */}
        {!loading && stats && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Tingkat Persetujuan</h2>
              </div>
              <span className="text-2xl font-bold text-blue-600">{approvalRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${approvalRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{stats.approvedRegistrations} disetujui</span>
              <span>{stats.totalRegistrations} total</span>
            </div>
          </div>
        )}

        {/* Recent Registrations */}
        <div className="card overflow-hidden p-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pendaftaran Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Mahasiswa', 'NIM', 'Program', 'Tanggal', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} cols={5} />)
                  : recentRegs.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                          Belum ada pendaftaran
                        </td>
                      </tr>
                    )
                    : recentRegs.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {reg.user?.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{reg.user?.nim}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{reg.program?.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(reg.created_at)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={reg.status} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Program Reports */}
        <div className="card overflow-hidden p-0 mt-8">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Laporan Pendapatan Sertifikasi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Program Sertifikasi', 'Total Terdaftar', 'Total Pendapatan'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading
                  ? [1, 2, 3].map((i) => <TableRowSkeleton key={i} cols={3} />)
                  : programReports.length === 0
                    ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                          Belum ada data program
                        </td>
                      </tr>
                    )
                    : programReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {report.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {report.registeredCount} Mahasiswa
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          {formatCurrency(report.revenue)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
