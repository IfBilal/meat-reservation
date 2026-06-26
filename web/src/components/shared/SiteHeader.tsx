import { WhatsAppButton } from './WhatsAppButton'

export function SiteHeader() {
  return (
    <header className="bg-[#8B0000] text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Ahadu Fresh Meat</h1>
            <p className="text-red-200 text-sm">Reserve your order online</p>
          </div>
        </div>
        <WhatsAppButton />
      </div>
    </header>
  )
}
