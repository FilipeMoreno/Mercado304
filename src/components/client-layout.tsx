"use client"

import { Sidebar } from "@/components/sidebar"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 ml-0 md:ml-0">
        <div className="pt-16 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}