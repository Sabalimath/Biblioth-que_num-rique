import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import { supabase } from "../supabase";

export default function Circulation() {
  const [emprunts, setEmprunts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtre, setFiltre]             = useState("en_cours");
  const [toast, setToast]               = useState("");
  const [modalRetour, setModalRetour]   = useState(null);
  const [traitement, setTraitement]     = useState(false);

  useEffect(() => {
    chargerEmprunts();
  }, []);

  async function chargerEmprunts() {
    setLoading(true);
    const { data } = await supabase
      .from("emprunts")
      .select(`
        *,
        livres(id, titre, auteur, disponibles),
        profils(nom, telephone)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setEmprunts(data || []);
    setLoading(false);
  }

  // Filtrer selon l'onglet actif
  const empruntsFiltres = emprunts.filter((e) => {
    if (filtre === "en_cours")  return e.statut === "en_cours";
    if (filtre === "en_retard") return e.statut === "en_retard";
    if (filtre === "rendus")    return e.statut === "rendu";
    return true;
  });

  // Calcul jours de retard
  function joursRetard(emprunt) {
    const today  = new Date();
    const retour = new Date(emprunt.date_retour_prevue);
    return Math.ceil((today - retour) / (1000 * 60 * 60 * 24));
  }

  // Calcul jours restants
  function joursRestants(emprunt) {
    const today  = new Date();
    const retour = new Date(emprunt.date_retour_prevue);
    return Math.ceil((retour - today) / (1000 * 60 * 60 * 24));
  }

  function afficherToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function enregistrerRetour(emprunt) {
    setTraitement(true);
    const today = new Date().toISOString().split("T")[0];
    const enRetard = new Date(today) > new Date(emprunt.date_retour_prevue);

    // 1. Mettre à jour l'emprunt
    const { error } = await supabase
      .from("emprunts")
      .update({
        statut:                 enRetard ? "en_retard" : "rendu",
        date_retour_effective:  today,
      })
      .eq("id", emprunt.id);

    if (error) {
      afficherToast("❌ Erreur lors du retour.");
      setTraitement(false);
      return;
    }

    // 2. Si pas en retard, marquer comme rendu directement
    if (!enRetard) {
      await supabase
        .from("emprunts")
        .update({ statut: "rendu" })
        .eq("id", emprunt.id);
    } else {
      // Si en retard, calculer et créer la pénalité manuellement
      // (en plus du trigger SQL)
      const jours   = joursRetard(emprunt);
      const montant = jours * 100;

      await supabase.from("penalites").insert({
        emprunt_id: emprunt.id,
        membre_id:  emprunt.membre_id,
        montant,
        statut:     "non_payee",
      });

      // Bloquer le membre
      await supabase
        .from("profils")
        .update({ statut: "bloque" })
        .eq("id", emprunt.membre_id);
    }

    // 3. Remettre l'exemplaire disponible
    const nouveauxDispo = (emprunt.livres?.disponibles || 0) + 1;
    await supabase
      .from("livres")
      .update({ disponibles: nouveauxDispo })
      .eq("id", emprunt.livres?.id);

    // 4. Recharger et fermer
    await chargerEmprunts();
    setModalRetour(null);
    setTraitement(false);

    if (enRetard) {
      const jours = joursRetard(emprunt);
      afficherToast(`⚠️ Retour en retard — pénalité de ${(jours * 100).toLocaleString()} FCFA générée`);
    } else {
      afficherToast(`✅ Retour enregistré — ${emprunt.livres?.titre}`);
    }
  }

  // Statistiques
  const totalEnCours  = emprunts.filter((e) => e.statut === "en_cours").length;
  const totalEnRetard = emprunts.filter((e) => e.statut === "en_retard").length;
  const totalRendus   = emprunts.filter((e) => e.statut === "rendu").length;
  const smsAEnvoyer   = emprunts.filter((e) =>
    e.statut === "en_cours" && joursRestants(e) <= 2 && joursRestants(e) >= 0
  ).length;

  function StatutBadge({ emprunt }) {
    if (emprunt.statut === "rendu") return (
      <span className="text-[9px] bg-sauge/15 text-sauge px-2 py-0.5 rounded-full font-medium">Rendu</span>
    );
    const jours = joursRestants(emprunt);
    if (jours < 0) return (
      <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
        {Math.abs(jours)}j de retard
      </span>
    );
    if (jours <= 2) return (
      <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
        ⚠ {jours}j restants
      </span>
    );
    return (
      <span className="text-[9px] bg-mousse/15 text-mousse px-2 py-0.5 rounded-full font-medium">
        En cours
      </span>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Circulation" subtitle="ARCHIVE / CIRCULATION" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">En cours</p>
            <p className="text-2xl font-semibold text-terre">{totalEnCours}</p>
            <p className="text-[10px] text-sauge">Emprunts actifs</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">En retard</p>
            <p className="text-2xl font-semibold text-danger">{totalEnRetard}</p>
            <p className="text-[10px] text-sauge">Pénalités en cours</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Rendus</p>
            <p className="text-2xl font-semibold text-mousse">{totalRendus}</p>
            <p className="text-[10px] text-sauge">Total retournés</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">SMS à envoyer</p>
            <p className="text-2xl font-semibold text-amber-600">{smsAEnvoyer}</p>
            <p className="text-[10px] text-sauge">Échéance dans 2j</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-sable/20 p-3 mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { key: "tous",       label: "Tous"       },
              { key: "en_cours",   label: "En cours"   },
              { key: "en_retard",  label: "En retard"  },
              { key: "rendus",     label: "Rendus"     },
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
          <p className="text-[10px] text-[#7A6A5A]">
            {empruntsFiltres.length} emprunt(s)
          </p>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-sable/20 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-sable/20">
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">MEMBRE</th>
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">TÉLÉPHONE</th>
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">LIVRE</th>
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">DATE EMPRUNT</th>
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">RETOUR PRÉVU</th>
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">STATUT</th>
                <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[11px] text-[#7A6A5A]">
                    Chargement…
                  </td>
                </tr>
              ) : empruntsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <p className="text-2xl mb-2">📚</p>
                    <p className="text-[11px] text-[#7A6A5A]">Aucun emprunt dans cette catégorie</p>
                  </td>
                </tr>
              ) : (
                empruntsFiltres.map((e) => (
                  <tr
                    key={e.id}
                    className={`border-b border-sable/10 transition-colors ${
                      e.statut === "en_retard" ? "bg-red-50 hover:bg-red-100/50" :
                      joursRestants(e) <= 2 && e.statut === "en_cours" ? "bg-amber-50" :
                      "hover:bg-amande/50"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sable/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-terre">
                            {e.profils?.nom?.split(" ").map((n) => n[0]).join("") || "?"}
                          </span>
                        </div>
                        <span className="font-medium text-[#3A2E24]">
                          {e.profils?.nom || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-[#7A6A5A]">{e.profils?.telephone || "—"}</td>
                    <td className="p-4">
                      <p className="font-medium text-[#3A2E24]">{e.livres?.titre}</p>
                      <p className="text-[10px] text-[#7A6A5A]">{e.livres?.auteur}</p>
                    </td>
                    <td className="p-4 text-[#7A6A5A]">{e.date_emprunt}</td>
                    <td className="p-4 text-[#7A6A5A]">{e.date_retour_prevue}</td>
                    <td className="p-4"><StatutBadge emprunt={e} /></td>
                    <td className="p-4">
                      {e.statut !== "rendu" && (
                        <button
                          onClick={() => setModalRetour(e)}
                          className="text-[10px] bg-terre text-amande px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                        >
                          Retour
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal confirmation retour */}
      {modalRetour && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[420px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#3A2E24]">Enregistrer un retour</h3>
              <button
                onClick={() => setModalRetour(null)}
                className="text-[#7A6A5A] text-lg hover:text-[#3A2E24]"
              >×</button>
            </div>

            {/* Infos emprunt */}
            <div className="bg-amande rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] text-[#7A6A5A]">Membre</span>
                <span className="text-[11px] font-medium text-[#3A2E24]">
                  {modalRetour.profils?.nom}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] text-[#7A6A5A]">Livre</span>
                <span className="text-[11px] font-medium text-[#3A2E24]">
                  {modalRetour.livres?.titre}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] text-[#7A6A5A]">Retour prévu</span>
                <span className="text-[11px] text-[#3A2E24]">
                  {modalRetour.date_retour_prevue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-[#7A6A5A]">Date retour effective</span>
                <span className="text-[11px] font-medium text-terre">
                  {new Date().toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

            {/* Alerte retard */}
            {joursRetard(modalRetour) > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-[11px] font-semibold text-red-600">
                  ⚠️ Retard de {joursRetard(modalRetour)} jour(s)
                </p>
                <p className="text-[11px] text-red-500 mt-0.5">
                  Pénalité automatique : {(joursRetard(modalRetour) * 100).toLocaleString()} FCFA
                </p>
                <p className="text-[10px] text-red-400 mt-0.5">
                  Le compte du membre sera bloqué jusqu'au paiement.
                </p>
              </div>
            )}

            <button
              onClick={() => enregistrerRetour(modalRetour)}
              disabled={traitement}
              className={`w-full py-3 rounded-xl text-[12px] font-medium transition-all mb-2 ${
                traitement
                  ? "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                  : "bg-terre text-amande hover:opacity-90"
              }`}
            >
              {traitement ? "Enregistrement…" : "Confirmer le retour"}
            </button>
            <button
              onClick={() => setModalRetour(null)}
              className="w-full text-[11px] text-[#7A6A5A] hover:text-[#3A2E24] transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-terre text-amande px-4 py-3 rounded-xl text-[12px] font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}