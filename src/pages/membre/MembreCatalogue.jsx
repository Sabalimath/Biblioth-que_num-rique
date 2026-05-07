import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import Topbar from "../../components/Topbar";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function MembreCatalogue() {
  const { profil } = useAuth();
  const [livres, setLivres]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [recherche, setRecherche]     = useState("");
  const [categorie, setCategorie]     = useState("Toutes");
  const [categories, setCategories]   = useState([]);
  const [modalLivre, setModalLivre]   = useState(null);
  const [confirme, setConfirme]       = useState(false);
  const [emprunting, setEmprunting]   = useState(false);
  const [erreurEmprunt, setErreurEmprunt] = useState("");

  useEffect(() => {
    chargerLivres();
    chargerCategories();
  }, []);

  async function chargerLivres() {
    setLoading(true);
    const { data } = await supabase
      .from("livres")
      .select("*, categories(nom)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setLivres(data || []);
    setLoading(false);
  }

  async function chargerCategories() {
    const { data } = await supabase
      .from("categories")
      .select("nom")
      .is("deleted_at", null);
    setCategories(data?.map((c) => c.nom) || []);
  }

  const couleurParCategorie = {
    "LITTÉRATURE": "bg-sable",
    "HISTOIRE":    "bg-mousse",
    "PHILOSOPHIE": "bg-terre",
    "ÉCONOMIE":    "bg-sauge",
    "SCIENCES":    "bg-mousse",
    "ART":         "bg-sable",
  };

  const livresFiltres = livres.filter((l) => {
    const matchRecherche =
      l.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      l.auteur.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie =
      categorie === "Toutes" || l.categories?.nom === categorie;
    return matchRecherche && matchCategorie;
  });

  async function ouvrirModal(livre) {
    setErreurEmprunt("");
    setConfirme(false);
    setModalLivre(livre);
  }

  async function emprunterLivre() {
    if (!modalLivre || !profil) return;
    setEmprunting(true);
    setErreurEmprunt("");

    // 1. Vérifier le statut du membre
    const { data: membreData } = await supabase
      .from("profils")
      .select("*")
      .eq("id", profil.id)
      .single();

    if (membreData?.statut === "bloque") {
      setErreurEmprunt("⚠️ Votre compte est bloqué. Réglez vos pénalités en bibliothèque.");
      setEmprunting(false);
      return;
    }

    // 2. Vérifier la limite de 3 emprunts
    const { data: empruntsEnCours } = await supabase
      .from("emprunts")
      .select("id")
      .eq("membre_id", profil.id)
      .in("statut", ["en_cours", "en_retard"])
      .is("deleted_at", null);

    if (empruntsEnCours?.length >= 3) {
      setErreurEmprunt("⚠️ Vous avez atteint la limite de 3 emprunts simultanés.");
      setEmprunting(false);
      return;
    }

    
    const { data: livreActuel } = await supabase
      .from("livres")
      .select("disponibles")
      .eq("id", modalLivre.id)
      .single();

    if (!livreActuel || livreActuel.disponibles <= 0) {
      setErreurEmprunt("⚠️ Plus aucun exemplaire disponible.");
      setEmprunting(false);
      return;
    }

    // 4. Calculer la date de retour J+14
    const dateEmprunt = new Date();
    const dateRetour  = new Date();
    dateRetour.setDate(dateRetour.getDate() + 14);

    const formatDate = (d) => d.toISOString().split("T")[0];

    
    const { error: erreurEmpruntDB } = await supabase
      .from("emprunts")
      .insert({
        membre_id:         profil.id,
        livre_id:          modalLivre.id,
        date_emprunt:      formatDate(dateEmprunt),
        date_retour_prevue: formatDate(dateRetour),
        statut:            "en_cours",
      });

    if (erreurEmpruntDB) {
      setErreurEmprunt("Erreur lors de l'emprunt. Réessayez.");
      setEmprunting(false);
      return;
    }

    await supabase
      .from("livres")
      .update({ disponibles: livreActuel.disponibles - 1 })
      .eq("id", modalLivre.id);

    
    await chargerLivres();
    setConfirme(true);
    setEmprunting(false);
  }

  const dateRetourStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });
  })();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Catalogue" subtitle="ARCHIVE / CATALOGUE" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-sable/20 p-3 mb-4 flex gap-3">
          <input
            type="text"
            placeholder="Rechercher par titre, auteur…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="flex-1 text-[11px] text-[#7A6A5A] bg-amande px-3 py-2 rounded-lg outline-none"
          />
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="text-[11px] text-[#7A6A5A] bg-amande px-3 py-2 rounded-lg outline-none"
          >
            <option>Toutes</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Grille livres */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-sable/20 p-4 animate-pulse">
                <div className="h-1.5 bg-sable/30 rounded mb-4" />
                <div className="h-3 bg-sable/30 rounded w-1/2 mb-2" />
                <div className="h-4 bg-sable/20 rounded w-3/4 mb-1" />
                <div className="h-3 bg-sable/20 rounded w-1/2 mb-4" />
                <div className="h-6 bg-sable/20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {livresFiltres.map((livre) => {
              const dispo        = livre.disponibles ?? livre.nombre_exemplaires;
              const total        = livre.nombre_exemplaires;
              const indisponible = dispo <= 0;
              const categorienom = livre.categories?.nom || "—";
              const couleur      = couleurParCategorie[categorienom] || "bg-terre";

              return (
                <div
                  key={livre.id}
                  className={`bg-white rounded-xl border border-sable/20 overflow-hidden ${indisponible ? "opacity-60" : ""}`}
                >
                  <div className={`h-1.5 ${couleur}`} />
                  <div className="p-4">
                    <span className="text-[9px] font-medium text-terre bg-amande px-2 py-0.5 rounded-full">
                      {categorienom}
                    </span>
                    <h3 className="text-sm font-medium text-[#3A2E24] mt-2">{livre.titre}</h3>
                    <p className="text-[11px] text-[#7A6A5A] mt-0.5">{livre.auteur}</p>
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-[#7A6A5A]">Disponibilité</span>
                        <span className="text-[10px] text-terre font-medium">{dispo} / {total} ex.</span>
                      </div>
                      <div className="h-1 bg-sable/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-terre rounded-full"
                          style={{ width: `${total > 0 ? (dispo / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      {indisponible ? (
                        <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
                          INDISPONIBLE
                        </span>
                      ) : (
                        <button
                          onClick={() => ouvrirModal(livre)}
                          className="w-full text-[11px] bg-terre text-amande py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Emprunter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal emprunt */}
      {modalLivre && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[420px]">
            {!confirme ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#3A2E24]">Confirmer l'emprunt</h3>
                  <button
                    onClick={() => setModalLivre(null)}
                    className="text-[#7A6A5A] text-lg hover:text-[#3A2E24]"
                  >×</button>
                </div>

                {/* Erreur */}
                {erreurEmprunt && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-[11px] text-red-600">{erreurEmprunt}</p>
                  </div>
                )}

                {/* Infos livre */}
                <div className="bg-amande rounded-xl p-4 mb-4">
                  <p className="text-[9px] text-terre uppercase tracking-wide mb-1">
                    {modalLivre.categories?.nom}
                  </p>
                  <p className="text-sm font-semibold text-[#3A2E24]">{modalLivre.titre}</p>
                  <p className="text-[11px] text-[#7A6A5A]">{modalLivre.auteur}</p>
                </div>

                <div className="flex justify-between mb-2">
                  <span className="text-[11px] text-[#7A6A5A]">Date d'emprunt</span>
                  <span className="text-[11px] text-[#3A2E24] font-medium">
                    {new Date().toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-[11px] text-[#7A6A5A]">Date de retour prévue</span>
                  <span className="text-[11px] bg-mousse text-amande px-2 py-0.5 rounded-full font-medium">
                    {dateRetourStr}
                  </span>
                </div>

                <p className="text-[10px] text-[#7A6A5A] bg-amande rounded-lg p-3 mb-4">
                  ℹ️ Vous avez 14 jours pour retourner ce livre. Passé ce délai, une pénalité de 100 FCFA par jour sera appliquée.
                </p>

                <button
                  onClick={emprunterLivre}
                  disabled={emprunting}
                  className={`w-full py-3 rounded-xl text-[12px] font-medium transition-all mb-2 ${
                    emprunting
                      ? "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                      : "bg-terre text-amande hover:opacity-90"
                  }`}
                >
                  {emprunting ? "Enregistrement…" : "Confirmer l'emprunt"}
                </button>
                <button
                  onClick={() => setModalLivre(null)}
                  className="w-full text-[11px] text-[#7A6A5A] hover:text-[#3A2E24] transition-colors"
                >
                  Annuler
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-mousse/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-mousse" />
                </div>
                <h3 className="text-sm font-semibold text-[#3A2E24] mb-2">Emprunt enregistré !</h3>
                <p className="text-[11px] text-[#7A6A5A] mb-1">
                  <span className="font-medium text-[#3A2E24]">{modalLivre.titre}</span> est maintenant emprunté
                </p>
                <p className="text-[11px] text-mousse font-medium mb-6">
                  Retour prévu le {dateRetourStr}
                </p>
                <button
                  onClick={() => setModalLivre(null)}
                  className="w-full bg-terre text-amande py-2.5 rounded-xl text-[12px] font-medium hover:opacity-90 transition-opacity"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}