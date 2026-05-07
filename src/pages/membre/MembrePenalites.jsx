import { useState, useEffect } from "react";
import Topbar from "../../components/Topbar";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function MembrePenalites() {
  const { profil } = useAuth();
  const [penalites, setPenalites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (profil?.id) chargerPenalites();
  }, [profil]);

  async function chargerPenalites() {
    setLoading(true);
    const { data } = await supabase
      .from("penalites")
      .select("*, emprunts(date_retour_prevue, date_retour_effective, livres(titre))")
      .eq("membre_id", profil.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setPenalites(data || []);
    setLoading(false);
  }

  const totalDu = penalites
    .filter((p) => p.statut === "non_payee")
    .reduce((acc, p) => acc + p.montant, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Mes Pénalités" subtitle="ARCHIVE / MES PÉNALITÉS" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* Alerte si bloqué */}
        {totalDu > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-[12px] font-semibold text-red-600">⚠️ Compte bloqué</p>
            <p className="text-[11px] text-red-500 mt-0.5">
              Vous avez {totalDu.toLocaleString()} FCFA de pénalités non réglées.
              Rendez-vous à la bibliothèque pour régulariser.
            </p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Total dû</p>
            <p className={`text-2xl font-semibold ${totalDu > 0 ? "text-danger" : "text-mousse"}`}>
              {totalDu.toLocaleString()} FCFA
            </p>
            <p className="text-[10px] text-sauge">
              {totalDu > 0 ? "À régler en bibliothèque" : "Aucune pénalité"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Statut du compte</p>
            <p className={`text-2xl font-semibold ${totalDu > 0 ? "text-danger" : "text-mousse"}`}>
              {totalDu > 0 ? "Bloqué" : "Actif"}
            </p>
            <p className="text-[10px] text-sauge">
              {totalDu > 0 ? "Sera débloqué après paiement" : "Aucune restriction"}
            </p>
          </div>
        </div>

        {/* Tableau pénalités */}
        <div className="bg-white rounded-xl border border-sable/20 overflow-hidden">
          <div className="p-4 border-b border-sable/20">
            <h2 className="text-xs font-medium text-[#3A2E24]">Détail des pénalités</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-[11px] text-[#7A6A5A]">Chargement…</p>
            </div>
          ) : penalites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm font-medium text-[#3A2E24]">Aucune pénalité</p>
              <p className="text-[11px] text-[#7A6A5A] mt-1">Vous êtes en règle !</p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-sable/20">
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">LIVRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">MONTANT</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">STATUT</th>
                </tr>
              </thead>
              <tbody>
                {penalites.map((p) => (
                  <tr key={p.id} className={`border-b border-sable/10 ${p.statut === "non_payee" ? "bg-[#FFF9F0]" : ""}`}>
                    <td className="p-4 font-medium text-[#3A2E24]">
                      {p.emprunts?.livres?.titre || "—"}
                    </td>
                    <td className="p-4 font-semibold text-terre">
                      {p.montant?.toLocaleString()} FCFA
                    </td>
                    <td className="p-4">
                      {p.statut === "non_payee" ? (
                        <span className="text-[9px] bg-[#FDF3E3] text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Non payée
                        </span>
                      ) : (
                        <span className="text-[9px] bg-mousse/15 text-mousse px-2 py-0.5 rounded-full font-medium">
                          Payée
                        </span>
                      )}
                    </td>
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