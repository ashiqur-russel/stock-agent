import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "What's New",
  description:
    'Product updates, mission, and how StockAgent helps you manage your portfolio with AI context.',
}

export default function WhatsNewLayout({ children }: { children: React.ReactNode }) {
  return children
}
