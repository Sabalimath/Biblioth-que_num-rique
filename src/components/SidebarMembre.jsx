import { BookOpen, RefreshCw, AlertCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { label: "Catalogue",     icon: BookOpen,    path: "/membre/catalogue"  },
  { label: "Mes emprunts",  icon: RefreshCw,   path: "/membre/emprunts"   },
  { label: "Mes pénalités", icon: AlertCircle, path: "/membre/penalites"  },
];

export default function SidebarMembre() {
  const location = useLocation();
  const { profil } = useAuth();

  const initiales = profil?.nom
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "M";

  return (
    <aside className="w-[190px] min-h-screen bg-terre flex flex-col flex-shrink-0">
      <div className="px-4 pt-6 pb-4 border-b border-white/10">
        <p className="text-amande font-semibold text-sm tracking-wide">ARCHIVE</p>
        <p className="text-amande/50 text-[10px] mt-0.5">Espace membre</p>
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
            <span className="text-amande text-[10px] font-semibold">{initiales}</span>
          </div>
          <div>
            <p className="text-amande text-[11px] font-medium leading-tight">
              {profil?.nom || "Membre"}
            </p>
            <p className="text-amande/50 text-[9px] leading-tight">Membre</p>
          </div>
        </div>
      </div>
    </aside>
  );
}