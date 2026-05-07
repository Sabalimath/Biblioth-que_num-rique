import { useState, useEffect } from "react";
import Topbar from "../../components/Topbar";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function MembreEmprunts() {
  const { profil } = useAuth();
  const [emprunts, setEmprunts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (profil?.id) chargerEmprunts();
  }, [profil]);

  async function chargerEmprunts() {
    setLoading(true);
    const { data } = await supabase
      .from("emprunts")
      .select("*, livres(titre, auteur)")
      .eq("membre_id", profil.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setEmprunts(data || []);
    setLoading(false);
  }

  const enCours  = emprunts.filter((e) => e.statut === "en_cours" || e.statut === "en_retard");
  const rendus   = emprunts.filter((e) => e.statut === "rendu");

  function JoursBadge({ emprunt }) {
    if (emprunt.statut === "rendu") return (
      <span className="text-[9px] bg-sauge/15 text-sauge px-2 py-0.5 rounded-full font-medium">Rendu</span>
    );
    const diff = Math.ceil((new Date(emprunt.date_retour_prevue) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return (
      <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
        {Math.abs(diff)}j de retard
      </span>
    );
    if (diff <= 3) return (
      <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
        {diff}j restants
      </span>
    );
    return (
      <span className="text-[9px] bg-mousse/15 text-mousse px-2 py-0.5 rounded-full font-medium">
        {diff}j restants
      </span>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Mes Emprunts" subtitle="ARCHIVE / MES EMPRUNTS" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Emprunts en cours</p>
            <p className="text-2xl font-semibold text-terre">{enCours.length} / 3</p>
            <p className="text-[10px] text-sauge">{3 - enCours.length} slot(s) disponible(s)</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Livres rendus</p>
            <p className="text-2xl font-semibold text-mousse">{rendus.length}</p>
            <p className="text-[10px] text-sauge">Depuis l'inscription</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Total emprunts</p>
            <p className="text-2xl font-semibold text-[#7A6A5A]">{emprunts.length}</p>
            <p className="text-[10px] text-sauge">Historique complet</p>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-sable/20 overflow-hidden">
          <div className="p-4 border-b border-sable/20">
            <h2 className="text-xs font-medium text-[#3A2E24]">Historique des emprunts</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-[11px] text-[#7A6A5A]">Chargement…</p>
            </div>
          ) : emprunts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-sm font-medium text-[#3A2E24]">Aucun emprunt</p>
              <p className="text-[11px] text-[#7A6A5A] mt-1">Vous n'avez pas encore emprunté de livre</p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-sable/20">
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">LIVRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">EMPRUNTÉ LE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">RETOUR PRÉVU</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">STATUT</th>
                </tr>
              </thead>
              <tbody>
                {emprunts.map((e) => (
                  <tr key={e.id} className="border-b border-sable/10 hover:bg-amande/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-[#3A2E24]">{e.livres?.titre}</p>
                      <p className="text-[10px] text-[#7A6A5A]">{e.livres?.auteur}</p>
                    </td>
                    <td className="p-4 text-[#7A6A5A]">{e.date_emprunt}</td>
                    <td className="p-4 text-[#7A6A5A]">{e.date_retour_prevue}</td>
                    <td className="p-4"><JoursBadge emprunt={e} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}