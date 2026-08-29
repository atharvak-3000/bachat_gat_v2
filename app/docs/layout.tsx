import { Metadata } from "next"

export const metadata: Metadata = {
  title: "BachatBook — User Guide & Documentation | बचत गट नियमावली",
  description: "Complete user manual, feature guide, and interactive documentation for BachatBook Bachat Gat management platform.",
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {children}
    </div>
  )
}
