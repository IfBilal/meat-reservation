import { AdminHeader } from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-100">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
