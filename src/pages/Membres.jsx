import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import { supabase } from "../supabase";

function StatutBadge({ statut }) {
  return statut === "actif" ? (
    <span className="text-[9px] bg-mousse/15 text-mousse px-2 py-0.5 rounded-full font-medium">ACTIF</span>
  ) : (
    <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">BLOQUÉ</span>
  );
}

export default function Membres() {
  const [membres, setMembres]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtre, setFiltre]     = useState("tous");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    chargerMembres();
  }, []);

  async function chargerMembres() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profils")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement membres :", error);
    } else {
      setMembres(data || []);
    }
    setLoading(false);
  }

  const membresFiltres = membres.filter((m) => {
    const matchFiltre =
      filtre === "tous" ||
      (filtre === "actif"  && m.statut === "actif") ||
      (filtre === "bloque" && m.statut === "bloque");
    const matchRecherche =
      m.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      m.telephone?.toLowerCase().includes(recherche.toLowerCase());
    return matchFiltre && matchRecherche;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Membres" subtitle="ARCHIVE / MEMBRES" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-[#3A2E24]">Membres</h2>
            {!loading && (
              <p className="text-[10px] text-[#7A6A5A] mt-0.5">
                {membresFiltres.length} membre(s) trouvé(s)
              </p>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-sable/20 p-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {[
              { key: "tous",   label: "Tous"    },
              { key: "actif",  label: "Actifs"  },
              { key: "bloque", label: "Bloqués" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltre(f.key)}
                className={`text-[11px] px-4 py-1.5 rounded-lg transition-colors ${
                  filtre === f.key
                    ? "bg-terre text-amande"
                    : "text-[#7A6A5A] hover:bg-amande"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Rechercher un membre…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="text-[11px] text-[#7A6A5A] bg-amande px-3 py-1.5 rounded-lg outline-none w-48"
          />
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-sable/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-[11px] text-[#7A6A5A]">Chargement…</p>
            </div>
          ) : membresFiltres.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm font-medium text-[#3A2E24]">Aucun membre trouvé</p>
              <p className="text-[11px] text-[#7A6A5A] mt-1">
                Essaie une autre recherche ou un autre filtre
              </p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-sable/20">
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">MEMBRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">TÉLÉPHONE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">RÔLE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">STATUT</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">INSCRIT LE</th>
                </tr>
              </thead>
              <tbody>
                {membresFiltres.map((membre) => (
                  <tr
                    key={membre.id}
                    className="border-b border-sable/10 hover:bg-amande/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sable/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-terre">
                            {membre.nom?.split(" ").map((n) => n[0]).join("") || "?"}
                          </span>
                        </div>
                        <span className="font-medium text-[#3A2E24]">{membre.nom}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#7A6A5A]">{membre.telephone || "—"}</td>
                    <td className="p-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                        membre.role === "admin"
                          ? "bg-terre/15 text-terre"
                          : membre.role === "bibliothecaire"
                          ? "bg-sauge/15 text-sauge"
                          : "bg-mousse/15 text-mousse"
                      }`}>
                        {membre.role === "admin"
                          ? "Admin"
                          : membre.role === "bibliothecaire"
                          ? "Bibliothécaire"
                          : "Membre"}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatutBadge statut={membre.statut || "actif"} />
                    </td>
                    <td className="p-4 text-[#7A6A5A]">
                      {new Date(membre.created_at).toLocaleDateString("fr-FR")}
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