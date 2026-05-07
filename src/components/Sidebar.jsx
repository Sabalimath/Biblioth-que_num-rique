import { LayoutDashboard, BookOpen, RefreshCw, Users, BarChart2, ShoppingCart, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/" },
  { label: "Catalog",      icon: BookOpen,        path: "/catalogue" },
  { label: "Circulation",  icon: RefreshCw,       path: "/circulation" },
  { label: "Members",      icon: Users,           path: "/membres" },
  { label: "Reports",      icon: BarChart2,       path: "/rapports" },
  { label: "Acquisitions", icon: ShoppingCart,    path: "/acquisitions" },
  { label: "Settings",     icon: Settings,        path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-[190px] min-h-screen bg-terre flex flex-col flex-shrink-0">
      <div className="px-4 pt-6 pb-4 border-b border-white/10">
        <p className="text-amande font-semibold text-sm tracking-wide">ARCHIVE</p>
        <p className="text-amande/50 text-[10px] mt-0.5">Système de gestion</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                isActive
                  ? "bg-white/15 text-amande font-medium"
                  : "text-amande/60 hover:bg-white/10 hover:text-amande/90"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="flex items-center gap-2 bg-black/15 rounded-lg p-2.5">
          <div className="w-7 h-7 rounded-full bg-mousse flex items-center justify-center flex-shrink-0">
            <span className="text-amande text-[10px] font-semibold">LP</span>
          </div>
          <div>
            <p className="text-amande text-[11px] font-medium leading-tight">Librarian Profile</p>
            <p className="text-amande/50 text-[9px] leading-tight">Administrateur</p>
          </div>
        </div>
      </div>
    </aside>
  );
}