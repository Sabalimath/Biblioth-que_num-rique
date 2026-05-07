import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import { supabase } from "../supabase";

export default function Penalites() {
  const [penalites, setPenalites]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filtre, setFiltre]               = useState("toutes");
  const [modalOuvert, setModalOuvert]     = useState(false);
  const [penaliteSelectionnee, setPenaliteSelectionnee] = useState(null);
  const [traitement, setTraitement]       = useState(false);
  const [toast, setToast]                 = useState("");

  useEffect(() => {
    chargerPenalites();
  }, []);

  async function chargerPenalites() {
    setLoading(true);
    const { data, error } = await supabase
      .from("penalites")
      .select(`
        *,
        profils(nom, telephone),
        emprunts(
          date_retour_prevue,
          date_retour_effective,
          livres(titre)
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement pénalités :", error);
    } else {
      setPenalites(data || []);
    }
    setLoading(false);
  }

  const penalitesFiltrees = penalites.filter((p) => {
    if (filtre === "non_payee") return p.statut === "non_payee";
    if (filtre === "payee")     return p.statut === "payee";
    return true;
  });

  const totalDu = penalites
    .filter((p) => p.statut === "non_payee")
    .reduce((acc, p) => acc + p.montant, 0);

  function afficherToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function ouvrirModal(penalite) {
    setPenaliteSelectionnee(penalite);
    setModalOuvert(true);
  }

  function fermerModal() {
    setModalOuvert(false);
    setPenaliteSelectionnee(null);
  }

  async function encaisserPenalite() {
    if (!penaliteSelectionnee) return;
    setTraitement(true);

    // 1. Marquer la pénalité comme payée
    const { error } = await supabase
      .from("penalites")
      .update({ statut: "payee" })
      .eq("id", penaliteSelectionnee.id);

    if (error) {
      afficherToast("❌ Erreur lors de l'encaissement.");
      setTraitement(false);
      return;
    }

    // 2. Vérifier s'il reste des pénalités non payées pour ce membre
    const { data: penalitesRestantes } = await supabase
      .from("penalites")
      .select("id")
      .eq("membre_id", penaliteSelectionnee.membre_id)
      .eq("statut", "non_payee")
      .neq("id", penaliteSelectionnee.id);

    // 3. Si plus aucune pénalité → débloquer le membre
    if (!penalitesRestantes || penalitesRestantes.length === 0) {
      await supabase
        .from("profils")
        .update({ statut: "actif" })
        .eq("id", penaliteSelectionnee.membre_id);

      afficherToast(`✅ Pénalité encaissée — ${penaliteSelectionnee.profils?.nom} est débloqué !`);
    } else {
      afficherToast(`✅ Pénalité de ${penaliteSelectionnee.montant?.toLocaleString()} FCFA encaissée`);
    }

    // 4. Recharger et fermer
    await chargerPenalites();
    fermerModal();
    setTraitement(false);
  }

  // Calcul jours de retard
  function joursRetard(penalite) {
    const prevue    = new Date(penalite.emprunts?.date_retour_prevue);
    const effective = new Date(penalite.emprunts?.date_retour_effective || new Date());
    return Math.max(0, Math.ceil((effective - prevue) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Pénalités" subtitle="ARCHIVE / PÉNALITÉS" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande pb-20">

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-base font-medium text-[#3A2E24]">Pénalités</h2>
          <p className="text-[11px] text-[#7A6A5A]">
            Gestion des pénalités de retard et encaissements
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Total non réglé</p>
            <p className="text-2xl font-semibold text-danger">
              {loading ? "…" : `${totalDu.toLocaleString()} FCFA`}
            </p>
            <p className="text-[10px] text-sauge">Pénalités en attente</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Non payées</p>
            <p className="text-2xl font-semibold text-amber-600">
              {loading ? "…" : penalites.filter(p => p.statut === "non_payee").length}
            </p>
            <p className="text-[10px] text-sauge">À encaisser</p>
          </div>
          <div className="bg-white rounded-xl border border-sable/20 p-4">
            <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">Payées</p>
            <p className="text-2xl font-semibold text-mousse">
              {loading ? "…" : penalites.filter(p => p.statut === "payee").length}
            </p>
            <p className="text-[10px] text-sauge">Encaissées</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-sable/20 p-3 mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { key: "toutes",    label: "Toutes"     },
              { key: "non_payee", label: "Non payées" },
              { key: "payee",     label: "Payées"     },
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
            {penalitesFiltrees.length} pénalité(s)
          </p>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-sable/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-[11px] text-[#7A6A5A]">Chargement…</p>
            </div>
          ) : penalitesFiltrees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm font-medium text-[#3A2E24]">Aucune pénalité</p>
              <p className="text-[11px] text-[#7A6A5A] mt-1">
                Aucune pénalité dans cette catégorie
              </p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-sable/20">
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">MEMBRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">LIVRE</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">JOURS RETARD</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">MONTANT FCFA</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">STATUT</th>
                  <th className="text-left text-[10px] text-[#7A6A5A] font-normal p-4">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {penalitesFiltrees.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-sable/10 transition-colors ${
                      p.statut === "non_payee"
                        ? "bg-[#FFF9F0] hover:bg-[#FFF3E0]"
                        : "bg-white hover:bg-amande/30"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sable/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-terre">
                            {p.profils?.nom?.split(" ").map((n) => n[0]).join("") || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#3A2E24]">{p.profils?.nom || "—"}</p>
                          <p className="text-[9px] text-[#7A6A5A]">{p.profils?.telephone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#7A6A5A]">
                      {p.emprunts?.livres?.titre || "—"}
                    </td>
                    <td className="p-4 text-[#3A2E24]">
                      {joursRetard(p)} jours
                    </td>
                    <td className={`p-4 font-semibold ${
                      p.statut === "non_payee" ? "text-terre" : "text-[#7A6A5A]"
                    }`}>
                      {p.montant?.toLocaleString()}
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
                    <td className="p-4">
                      {p.statut === "non_payee" && (
                        <button
                          onClick={() => ouvrirModal(p)}
                          className="text-[10px] bg-terre text-amande px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                        >
                          Encaisser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Footer sticky */}
      <div className="fixed bottom-0 left-[190px] right-0 h-12 bg-terre flex items-center justify-between px-6 z-40">
        <span className="text-amande text-[13px] font-medium">
          Total non réglé : {totalDu.toLocaleString()} FCFA
        </span>
        <button className="text-[11px] border border-amande/50 text-amande px-4 py-1.5 rounded-lg hover:bg-amande/10 transition-colors">
          Exporter le rapport
        </button>
      </div>

      {/* Modal encaissement */}
      {modalOuvert && penaliteSelectionnee && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#3A2E24]">Encaisser la pénalité</h3>
              <button
                onClick={fermerModal}
                className="text-[#7A6A5A] hover:text-[#3A2E24] text-lg"
              >×</button>
            </div>
            <p className="text-[11px] text-[#7A6A5A] mb-4">
              Veuillez confirmer la réception du paiement.
            </p>
            <div className="flex justify-between mb-2">
              <span className="text-[11px] text-[#7A6A5A]">Membre :</span>
              <span className="text-[11px] text-[#3A2E24] font-medium">
                {penaliteSelectionnee.profils?.nom}
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-[11px] text-[#7A6A5A]">Motif :</span>
              <span className="text-[11px] text-[#3A2E24] font-medium">
                Retard {joursRetard(penaliteSelectionnee)} jours ({penaliteSelectionnee.emprunts?.livres?.titre})
              </span>
            </div>
            <div className="bg-amande rounded-xl p-4 text-center mb-4">
              <p className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1">
                Montant total
              </p>
              <p className="text-2xl font-semibold text-terre">
                {penaliteSelectionnee.montant?.toLocaleString()} FCFA
              </p>
            </div>
            <button
              onClick={encaisserPenalite}
              disabled={traitement}
              className={`w-full py-3 rounded-xl text-[12px] font-medium transition-all mb-2 ${
                traitement
                  ? "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                  : "bg-terre text-amande hover:opacity-90"
              }`}
            >
              {traitement ? "Encaissement…" : "Confirmer l'encaissement"}
            </button>
            <button
              onClick={fermerModal}
              className="w-full text-[11px] text-[#7A6A5A] hover:text-[#3A2E24] transition-colors"
            >
              Annuler l'opération
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-16 right-6 bg-terre text-amande px-4 py-3 rounded-xl text-[12px] font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}