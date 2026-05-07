import { Search } from "lucide-react";

export default function Topbar({ title, subtitle }) {
  return (
    <header className="h-16 bg-white border-b border-sable/30 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-sm font-medium text-[#3A2E24]">{title}</h1>
        {subtitle && (
          <p className="text-[10px] text-terre mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A6A5A]" />
          <input
            type="text"
            placeholder="Rechercher un livre, un membre…"
            className="bg-amande text-[11px] text-[#7A6A5A] pl-7 pr-3 py-1.5 rounded-md outline-none border border-transparent focus:border-sable w-52"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-terre flex items-center justify-center cursor-pointer">
          <span className="text-amande text-[11px] font-semibold">LP</span>
        </div>
      </div>
    </header>
  );
}