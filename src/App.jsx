import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./components/Sidebar";
import SidebarMembre from "./components/SidebarMembre";
import Dashboard from "./pages/Dashboard";
import Catalogue from "./pages/Catalogue";
import Membres from "./pages/Membres";
import Penalites from "./pages/Penalites";
import Circulation from "./pages/Circulation";
import Landing from "./pages/Landing";
import Connexion from "./pages/Connexion";
import MembreCatalogue from "./pages/membre/MembreCatalogue";
import MembreEmprunts from "./pages/membre/MembreEmprunts";
import MembrePenalites from "./pages/membre/MembrePenalites";
import MembreDashboard from "./pages/membre/MembreDashboard.jsx";


function RouteMembreProtegee({ children }) {
  const { estConnecte, loading } = useAuth();
  if (loading) return null;
  if (!estConnecte) return <Navigate to="/connexion" />;
  return children;
}

function RouteAdminProtegee({ children }) {
  const { estConnecte, profil, loading } = useAuth();
  if (loading) return null;
  if (!estConnecte) return <Navigate to="/connexion" />;
 


  if (!profil) return null;
  if (profil.role !== "admin" && profil.role !== "bibliothecaire") {
    return <Navigate to="/membre/dashboard" />;
  }
  return children;
}

function LayoutAdmin({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function LayoutMembre({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarMembre />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route path="/"            element={<Landing />}   />
        <Route path="/connexion"   element={<Connexion />} />
        <Route path="/inscription" element={<Connexion />} />

        {/* Espace Admin — protégé */}
        <Route path="/dashboard" element={
          <RouteAdminProtegee>
            <LayoutAdmin><Dashboard /></LayoutAdmin>
          </RouteAdminProtegee>
        } />
        <Route path="/catalogue" element={
          <RouteAdminProtegee>
            <LayoutAdmin><Catalogue /></LayoutAdmin>
          </RouteAdminProtegee>
        } />
        <Route path="/membres" element={
          <RouteAdminProtegee>
            <LayoutAdmin><Membres /></LayoutAdmin>
          </RouteAdminProtegee>
        } />
        <Route path="/penalites" element={
          <RouteAdminProtegee>
            <LayoutAdmin><Penalites /></LayoutAdmin>
          </RouteAdminProtegee>
        } />
        <Route path="/circulation" element={
          <RouteAdminProtegee>
            <LayoutAdmin><Circulation /></LayoutAdmin>
          </RouteAdminProtegee>
        } />

        {/* Espace Membre — protégé */}
        <Route path="/membre/dashboard" element={
          <RouteMembreProtegee>
            <MembreDashboard />
          </RouteMembreProtegee>
        } />
        <Route path="/membre/catalogue" element={
          <RouteMembreProtegee>
            <LayoutMembre><MembreCatalogue /></LayoutMembre>
          </RouteMembreProtegee>
        } />
        <Route path="/membre/emprunts" element={
          <RouteMembreProtegee>
            <LayoutMembre><MembreEmprunts /></LayoutMembre>
          </RouteMembreProtegee>
        } />
        <Route path="/membre/penalites" element={
          <RouteMembreProtegee>
            <LayoutMembre><MembrePenalites /></LayoutMembre>
          </RouteMembreProtegee>
        } />
      </Routes>
    </BrowserRouter>
  );
}