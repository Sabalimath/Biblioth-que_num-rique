import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import { supabase } from "../supabase";

function KpiCard({ label, value, sub, valueColor = "text-terre", badge }) {
  return (
    <div className="bg-white rounded-xl border border-sable/20 p-4 flex flex-col gap-1">
      <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`text-[22px] font-semibold ${valueColor}`}>
          {value ?? "…"}
        </span>
        {badge && (
          <span className="text-[9px] bg-danger text-white px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] text-sauge">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    "en_cours":  "bg-mousse/15 text-mousse",
    "en_retard": "bg-amber-100 text-amber-700",
    "rendu":     "bg-sauge/15 text-sauge",
  };
  const labels = {
    "en_cours":  "En cours",
    "en_retard": "En retard",
    "rendu":     "Rendu",
  };
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats]         = useState({
    totalLivres:    null,
    membresActifs:  null,
    empruntsEnCours: null,
    penalitesTotal: null,
  });
  const [emprunts, setEmprunts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [activites, setActivites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setLoading(true);

    // 1. Total livres
    const { count: totalLivres } = await supabase
      .from("livres")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // 2. Membres actifs
    const { count: membresActifs } = await supabase
      .from("profils")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif");

    // 3. Emprunts en cours
    const { count: empruntsEnCours } = await supabase
      .from("emprunts")
      .select("*", { count: "exact", head: true })
      .in("statut", ["en_cours", "en_retard"])
      .is("deleted_at", null);

    // 4. Total pénalités non payées
    const { data: penalitesData } = await supabase
      .from("penalites")
      .select("montant")
      .eq("statut", "non_payee")
      .is("deleted_at", null);

    const penalitesTotal = penalitesData?.reduce((acc, p) => acc + p.montant, 0) || 0;

    // 5. Emprunts récents
    const { data: empruntsData } = await supabase
      .from("emprunts")
      .select("*, livres(titre), profils(nom)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    // 6. Top catégories
    const { data: livresData } = await supabase
      .from("livres")
      .select("categories(nom)")
      .is("deleted_at", null);

    // On compte les livres par catégorie
    const compteurCats = {};
    livresData?.forEach((l) => {
      const nom = l.categories?.nom;
      if (nom) compteurCats[nom] = (compteurCats[nom] || 0) + 1;
    });
    const totalLivresCount = livresData?.length || 1;
    const topCats = Object.entries(compteurCats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([nom, count]) => ({
        nom,
        pct: Math.round((count / totalLivresCount) * 100),
      }));

    // 7. Activité récente — derniers emprunts + pénalités
    const { data: recentEmprunts } = await supabase
      .from("emprunts")
      .select("*, profils(nom), livres(titre)")
      .order("created_at", { ascending: false })
      .limit(3);

    const activitesData = recentEmprunts?.map((e) => ({
      couleur: e.statut === "en_retard" ? "bg-danger" : "bg-mousse",
      texte:   `Emprunt — ${e.profils?.nom} → ${e.livres?.titre}`,
      temps:   new Date(e.created_at).toLocaleDateString("fr-FR"),
    })) || [];

    setStats({ totalLivres, membresActifs, empruntsEnCours, penalitesTotal });
    setEmprunts(empruntsData || []);
    setCategories(topCats);
    setActivites(activitesData);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Library Overview" subtitle="ARCHIVE / DASHBOARD" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <KpiCard
            label="Total livres"
            value={loading ? "…" : stats.totalLivres}
            sub="Dans le catalogue"
            valueColor="text-terre"
          />
          <KpiCard
            label="Membres actifs"
            value={loading ? "…" : stats.membresActifs}
            sub="Comptes non bloqués"
            valueColor="text-mousse"
          />
          <KpiCard
            label="Emprunts en cours"
            value={loading ? "…" : stats.empruntsEnCours}
            sub="Actifs + en retard"
            valueColor="text-[#7A6A5A]"
          />
          <KpiCard
            label="Pénalités dues"
            value={loading ? "…" : `${stats.penalitesTotal?.toLocaleString()} FCFA`}
            sub="Non réglées"
            valueColor="text-danger"
            badge={stats.penalitesTotal > 0 ? "Ouvert" : null}
          />
        </div>

        {/* Tableau emprunts récents */}
        <div className="bg-white rounded-xl border border-sable/20 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[#3A2E24]">Emprunts récents</h2>
            <button className="text-[11px] text-terre border border-terre/40 px-3 py-1 rounded-md hover:bg-terre hover:text-amande transition-colors">
              Voir tout
            </button>
          </div>
          {loading ? (
            <p className="text-[11px] text-[#7A6A5A] text-center py-4">Chargement…</p>
          ) : emprunts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📚</p>
              <p className="text-[11px] text-[#7A6A5A]">Aucun emprunt pour le moment</p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-sable/20">
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">MEMBRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">LIVRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">DATE RETOUR</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">STATUT</th>
                </tr>
              </thead>
              <tbody>
                {emprunts.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-sable/10 hover:bg-amande/50 transition-colors"
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sable/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-terre">
                            {e.profils?.nom?.split(" ").map((n) => n[0]).join("") || "?"}
                          </span>
                        </div>
                        <span className="text-[#3A2E24]">{e.profils?.nom || "—"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-[#3A2E24]">{e.livres?.titre || "—"}</td>
                    <td className="py-2.5 text-[#7A6A5A]">{e.date_retour_prevue}</td>
                    <td className="py-2.5">
                      <StatusBadge status={e.statut} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bas : Top Catégories + Activité récente */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <h2 className="text-xs font-medium text-[#3A2E24] mb-4">Top Catégories</h2>
            {loading ? (
              <p className="text-[11px] text-[#7A6A5A]">Chargement…</p>
            ) : categories.length === 0 ? (
              <p className="text-[11px] text-[#7A6A5A]">Aucune catégorie</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.nom} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#3A2E24]">{cat.nom}</span>
                    <span className="text-[11px] text-terre font-medium">{cat.pct}%</span>
                  </div>
                  <div className="h-1 bg-sable/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terre rounded-full"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <h2 className="text-xs font-medium text-[#3A2E24] mb-4">Activité récente</h2>
            {loading ? (
              <p className="text-[11px] text-[#7A6A5A]">Chargement…</p>
            ) : activites.length === 0 ? (
              <p className="text-[11px] text-[#7A6A5A]">Aucune activité</p>
            ) : (
              activites.map((act, index) => (
                <div key={index} className="flex gap-3 mb-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${act.couleur}`} />
                  <div>
                    <p className="text-[11px] text-[#3A2E24] leading-tight">{act.texte}</p>
                    <p className="text-[9px] text-sauge mt-0.5">{act.temps}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}