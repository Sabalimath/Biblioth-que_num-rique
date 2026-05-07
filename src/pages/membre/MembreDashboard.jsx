import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../supabase";

export default function MembreDashboard() {
  const { profil, deconnecter } = useAuth();
  const navigate = useNavigate();
  const [emprunts, setEmprunts]       = useState([]);
  const [penalites, setPenalites]     = useState([]);
  const [avis, setAvis]               = useState([]);
  const [monAvis, setMonAvis]         = useState("");
  const [note, setNote]               = useState(5);
  const [loading, setLoading]         = useState(true);
  const [onglet, setOnglet]           = useState("emprunts");
  const [toast, setToast]             = useState("");

  useEffect(() => {
  if (profil?.id) chargerDonnees();
}, [profil]);


  async function chargerDonnees() {
    setLoading(true);

   
    const { data: empruntsData } = await supabase
      .from("emprunts")
      .select("*, livres(titre, auteur)")
      .eq("membre_id", profil?.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Charger les pénalités du membre
    const { data: penalitesData } = await supabase
      .from("penalites")
      .select("*, emprunts(*, livres(titre))")
      .eq("membre_id", profil?.id)
      .is("deleted_at", null);

    // Charger les avis (table publique)
    const { data: avisData } = await supabase
      .from("avis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    setEmprunts(empruntsData || []);
    setPenalites(penalitesData || []);
    setAvis(avisData || []);
    setLoading(false);
  }

  async function envoyerAvis() {
    if (!monAvis.trim()) return;
    const { error } = await supabase.from("avis").insert({
      membre_id: profil?.id,
      nom:       profil?.nom,
      contenu:   monAvis,
      note,
    });
    if (!error) {
      setMonAvis("");
      setNote(5);
      setToast("Avis envoyé avec succès !");
      setTimeout(() => setToast(""), 3000);
      chargerDonnees();
    }
  }

  async function handleDeconnexion() {
    await deconnecter();
    navigate("/");
  }

  const totalDu = penalites
    .filter((p) => p.statut === "non_payee")
    .reduce((acc, p) => acc + p.montant, 0);

  const empruntsEnCours = emprunts.filter((e) => e.statut === "en_cours" || e.statut === "en_retard");

  // Notifications d'échéance (retours dans moins de 3 jours)
  const notifications = emprunts.filter((e) => {
    if (e.statut !== "en_cours") return false;
    const retour = new Date(e.date_retour_prevue);
    const diff   = Math.ceil((retour - new Date()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= 0;
  });

  return (
    <div className="min-h-screen bg-amande">

      {/* Topbar */}
      <header className="h-16 bg-white border-b border-sable/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-terre flex items-center justify-center">
            <span className="text-amande text-[11px] font-semibold">
             {profil?.nom?.split(" ").map((n) => n[0]).join("") || "M"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#3A2E24]">{profil?.nom}</p>
            <p className="text-[10px] text-sauge">Membre</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/membre/catalogue")}
            className="text-[11px] bg-terre text-amande px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            📚 Voir le catalogue
          </button>
          <button
            onClick={handleDeconnexion}
            className="text-[11px] border border-sable/40 text-[#7A6A5A] px-4 py-2 rounded-lg hover:bg-amande transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Emprunts en cours</p>
            <p className="text-2xl font-semibold text-terre">{empruntsEnCours.length} / 3</p>
            <p className="text-[10px] text-sauge">{3 - empruntsEnCours.length} slot(s) disponible(s)</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Pénalités dues</p>
            <p className={`text-2xl font-semibold ${totalDu > 0 ? "text-danger" : "text-mousse"}`}>
              {totalDu > 0 ? `${totalDu.toLocaleString()} FCFA` : "0 FCFA"}
            </p>
            <p className="text-[10px] text-sauge">{totalDu > 0 ? "À régler en bibliothèque" : "Aucune pénalité"}</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Total emprunts</p>
            <p className="text-2xl font-semibold text-mousse">{emprunts.length}</p>
            <p className="text-[10px] text-sauge">Depuis l'inscription</p>
          </div>
        </div>

        {/* Notifications échéance */}
        {notifications.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-[12px] font-semibold text-amber-700 mb-2">
              ⏰ Rappel — Retour à prévoir bientôt
            </p>
            {notifications.map((e) => {
              const diff = Math.ceil((new Date(e.date_retour_prevue) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <p key={e.id} className="text-[11px] text-amber-600">
                  • <span className="font-medium">{e.livres?.titre}</span> — à rendre dans{" "}
                  <span className="font-semibold">{diff} jour(s)</span> ({e.date_retour_prevue})
                </p>
              );
            })}
          </div>
        )}

        {/* Compte bloqué */}
        {totalDu > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-[12px] font-semibold text-red-600">⚠️ Compte bloqué</p>
            <p className="text-[11px] text-red-500 mt-0.5">
              Vous avez {totalDu.toLocaleString()} FCFA de pénalités non réglées.
              Rendez-vous à la bibliothèque pour régulariser.
            </p>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-xl border border-sable/20 overflow-hidden">
          <div className="flex border-b border-sable/20">
            {[
              { key: "emprunts",      label: "📖 Mes emprunts"    },
              { key: "penalites",     label: "💳 Mes pénalités"   },
              { key: "notifications", label: "🔔 Notifications"   },
              { key: "avis",          label: "⭐ Donner un avis"  },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => setOnglet(o.key)}
                className={`flex-1 py-3 text-[11px] font-medium transition-colors ${
                  onglet === o.key
                    ? "border-b-2 border-terre text-terre"
                    : "text-[#7A6A5A] hover:text-[#3A2E24]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="p-4">

            {/* Onglet Emprunts */}
            {onglet === "emprunts" && (
              loading ? (
                <p className="text-[11px] text-[#7A6A5A] text-center py-8">Chargement…</p>
              ) : emprunts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">📚</p>
                  <p className="text-sm font-medium text-[#3A2E24]">Aucun emprunt</p>
                  <p className="text-[11px] text-[#7A6A5A] mt-1">Vous n'avez pas encore emprunté de livre</p>
                  <button
                    onClick={() => navigate("/membre/catalogue")}
                    className="mt-4 bg-terre text-amande px-4 py-2 rounded-lg text-[11px] hover:opacity-90 transition-opacity"
                  >
                    Voir le catalogue
                  </button>
                </div>
              ) : (
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-sable/20">
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">LIVRE</th>
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">EMPRUNTÉ LE</th>
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">RETOUR PRÉVU</th>
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">STATUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emprunts.map((e) => (
                      <tr key={e.id} className="border-b border-sable/10 hover:bg-amande/50">
                        <td className="py-3">
                          <p className="font-medium text-[#3A2E24]">{e.livres?.titre}</p>
                          <p className="text-[10px] text-[#7A6A5A]">{e.livres?.auteur}</p>
                        </td>
                        <td className="py-3 text-[#7A6A5A]">{e.date_emprunt}</td>
                        <td className="py-3 text-[#7A6A5A]">{e.date_retour_prevue}</td>
                        <td className="py-3">
                          {e.statut === "en_cours"  && <span className="text-[9px] bg-mousse/15 text-mousse px-2 py-0.5 rounded-full">En cours</span>}
                          {e.statut === "rendu"     && <span className="text-[9px] bg-sauge/15 text-sauge px-2 py-0.5 rounded-full">Rendu</span>}
                          {e.statut === "en_retard" && <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full">En retard</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Onglet Pénalités */}
            {onglet === "penalites" && (
              penalites.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm font-medium text-[#3A2E24]">Aucune pénalité</p>
                  <p className="text-[11px] text-[#7A6A5A] mt-1">Vous êtes en règle !</p>
                </div>
              ) : (
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-sable/20">
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">LIVRE</th>
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">MONTANT</th>
                      <th className="text-left text-[10px] text-[#7A6A5A] font-normal pb-2">STATUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penalites.map((p) => (
                      <tr key={p.id} className="border-b border-sable/10">
                        <td className="py-3 font-medium text-[#3A2E24]">{p.emprunts?.livres?.titre}</td>
                        <td className="py-3 font-semibold text-terre">{p.montant?.toLocaleString()} FCFA</td>
                        <td className="py-3">
                          {p.statut === "non_payee"
                            ? <span className="text-[9px] bg-[#FDF3E3] text-amber-700 px-2 py-0.5 rounded-full">Non payée</span>
                            : <span className="text-[9px] bg-mousse/15 text-mousse px-2 py-0.5 rounded-full">Payée</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Onglet Notifications */}
            {onglet === "notifications" && (
              <div>
                {notifications.length === 0 && empruntsEnCours.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-2">🔔</p>
                    <p className="text-sm font-medium text-[#3A2E24]">Aucune notification</p>
                    <p className="text-[11px] text-[#7A6A5A] mt-1">Tout est en ordre !</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {empruntsEnCours.map((e) => {
                      const diff = Math.ceil((new Date(e.date_retour_prevue) - new Date()) / (1000 * 60 * 60 * 24));
                      const estUrgent = diff <= 3 && diff >= 0;
                      const estRetard = diff < 0;
                      return (
                        <div key={e.id} className={`p-3 rounded-xl border ${
                          estRetard  ? "bg-red-50 border-red-200" :
                          estUrgent  ? "bg-amber-50 border-amber-200" :
                                       "bg-white border-sable/20"
                        }`}>
                          <p className="text-[11px] font-medium text-[#3A2E24]">
                            {estRetard ? "⚠️" : estUrgent ? "⏰" : "📖"} {e.livres?.titre}
                          </p>
                          <p className="text-[10px] text-[#7A6A5A] mt-0.5">
                            {estRetard
                              ? `En retard de ${Math.abs(diff)} jour(s) — pénalité en cours`
                              : estUrgent
                              ? `À rendre dans ${diff} jour(s) — le ${e.date_retour_prevue}`
                              : `Retour prévu le ${e.date_retour_prevue}`
                            }
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Avis */}
            {onglet === "avis" && (
              <div>
                {/* Formulaire avis */}
                <div className="bg-amande rounded-xl p-4 mb-6">
                  <h3 className="text-[12px] font-semibold text-[#3A2E24] mb-3">
                    Partagez votre expérience
                  </h3>
                  <div className="mb-3">
                    <p className="text-[10px] text-[#7A6A5A] mb-2">Note</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setNote(n)}
                          className={`text-xl transition-all ${n <= note ? "opacity-100" : "opacity-30"}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={monAvis}
                    onChange={(e) => setMonAvis(e.target.value)}
                    placeholder="Partagez votre avis sur la bibliothèque, les services, la collection…"
                    rows={3}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors resize-none mb-3"
                  />
                  <button
                    onClick={envoyerAvis}
                    disabled={!monAvis.trim()}
                    className={`px-4 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      monAvis.trim() ? "bg-terre text-amande hover:opacity-90" : "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                    }`}
                  >
                    Envoyer mon avis
                  </button>
                </div>

                {/* Liste des avis */}
                <h3 className="text-[12px] font-semibold text-[#3A2E24] mb-3">Avis de la communauté</h3>
                {avis.length === 0 ? (
                  <p className="text-[11px] text-[#7A6A5A] text-center py-4">Aucun avis pour le moment — soyez le premier !</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {avis.map((a) => (
                      <div key={a.id} className="bg-white rounded-xl border border-sable/20 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-mousse flex items-center justify-center">
                              <span className="text-amande text-[9px] font-semibold">
                                {a.nom?.split(" ").map((n) => n[0]).join("") || "M"}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-[#3A2E24]">{a.nom}</span>
                          </div>
                          <div className="flex">
                            {Array.from({ length: a.note }).map((_, i) => (
                              <span key={i} className="text-xs">⭐</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#7A6A5A]">{a.contenu}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-terre text-amande px-4 py-3 rounded-xl text-[12px] font-medium z-50">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}