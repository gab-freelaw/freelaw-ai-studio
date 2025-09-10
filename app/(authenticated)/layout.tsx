import { MainNav } from '@/components/navigation/main-nav'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MainNav />
      <main className="flex-1">
        {children}
      </main>
    </>
  )
}