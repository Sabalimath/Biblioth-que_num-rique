import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import { supabase } from "../supabase";

const categories = ["LITTÉRATURE", "HISTOIRE", "PHILOSOPHIE", "ÉCONOMIE", "SCIENCES", "ART"];

const couleurParCategorie = {
  "LITTÉRATURE": "bg-sable",
  "HISTOIRE":    "bg-mousse",
  "PHILOSOPHIE": "bg-terre",
  "ÉCONOMIE":    "bg-sauge",
  "SCIENCES":    "bg-mousse",
  "ART":         "bg-sable",
};

const formVide = {
  titre: "", auteur: "", categorie: "LITTÉRATURE",
  editeur: "", isbn: "", annee: "", exemplaires: 1, description: "",
};

function LivreCard({ livre }) {
  const dispo = livre.disponibles ?? livre.nombre_exemplaires;
  const total = livre.nombre_exemplaires;
  const indisponible = dispo === 0;
  const categorie = livre.categories?.nom || "—";
  const couleur = couleurParCategorie[categorie] || "bg-terre";

  return (
    <div className={`bg-white rounded-xl border border-sable/20 overflow-hidden ${indisponible ? "opacity-60" : ""}`}>
      <div className={`h-1.5 ${couleur}`} />
      <div className="p-4">
        <span className="text-[9px] font-medium text-terre bg-amande px-2 py-0.5 rounded-full">
          {categorie}
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
        <div className="mt-3 flex justify-between items-center">
          <span className="text-[9px] text-[#7A6A5A]">{livre.isbn || "—"}</span>
          {indisponible ? (
            <span className="text-[9px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium">
              INDISPONIBLE
            </span>
          ) : (
            <button className="text-[10px] bg-terre text-amande px-3 py-1 rounded-md hover:opacity-90 transition-opacity">
              Emprunter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Catalogue() {
  const [livres, setLivres]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [recherche, setRecherche]     = useState("");
  const [categorie, setCategorie]     = useState("Toutes");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm]               = useState(formVide);
  const [succes, setSucces]           = useState(false);
  const [saving, setSaving]           = useState(false);

  // ── Charger les livres depuis Supabase ──
  async function chargerLivres() {
    setLoading(true);
    const { data, error } = await supabase
      .from("livres")
      .select("*, categories(nom)")   // on récupère aussi le nom de la catégorie
      .is("deleted_at", null)         // soft delete : on ignore les supprimés
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement livres :", error);
    } else {
      setLivres(data);
    }
    setLoading(false);
  }

  // useEffect = se lance automatiquement quand la page s'ouvre
  useEffect(() => {
    chargerLivres();
  }, []);

  // ── Filtrer les livres ──
  const livresFiltres = livres.filter((l) => {
    const matchRecherche =
      l.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      l.auteur.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie =
      categorie === "Toutes" || l.categories?.nom === categorie;
    return matchRecherche && matchCategorie;
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ── Enregistrer un nouveau livre dans Supabase ──
  async function handleEnregistrer() {
    if (!form.titre || !form.auteur) return;
    setSaving(true);

    // On cherche l'ID de la catégorie choisie
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("nom", form.categorie)
      .single();

    // On insère le livre dans la base
    const { error } = await supabase.from("livres").insert({
      titre:              form.titre,
      auteur:             form.auteur,
      categorie_id:       catData?.id,
      isbn:               form.isbn,
      editeur:            form.editeur,
      annee:              form.annee,
      description:        form.description,
      nombre_exemplaires: Number(form.exemplaires),
    });

    if (error) {
      console.error("Erreur ajout livre :", error);
    } else {
      setSucces(true);
      await chargerLivres(); // on recharge la liste
      setTimeout(() => {
        setSucces(false);
        setModalOuvert(false);
        setForm(formVide);
      }, 1500);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Catalogue" subtitle="ARCHIVE / GESTION" />
      <main className="flex-1 overflow-y-auto p-6 bg-amande">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-[#3A2E24]">
            Catalogue
            {!loading && (
              <span className="text-[11px] text-[#7A6A5A] font-normal ml-2">
                ({livresFiltres.length} livres)
              </span>
            )}
          </h2>
          <button
            onClick={() => { setModalOuvert(true); setSucces(false); setForm(formVide); }}
            className="text-[11px] bg-terre text-amande px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Ajouter un livre
          </button>
        </div>

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

        {/* Contenu */}
        {loading ? (
          // Skeleton loader pendant le chargement
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-sable/20 p-4 animate-pulse">
                <div className="h-1.5 bg-sable/30 rounded mb-4" />
                <div className="h-3 bg-sable/30 rounded w-1/2 mb-2" />
                <div className="h-4 bg-sable/20 rounded w-3/4 mb-1" />
                <div className="h-3 bg-sable/20 rounded w-1/2 mb-4" />
                <div className="h-1 bg-sable/20 rounded mb-4" />
                <div className="h-6 bg-sable/20 rounded" />
              </div>
            ))}
          </div>
        ) : livresFiltres.length === 0 ? (
          // Empty state
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-sm font-medium text-[#3A2E24]">Aucun livre trouvé</p>
            <p className="text-[11px] text-[#7A6A5A] mt-1">Essaie une autre recherche ou une autre catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {livresFiltres.map((livre) => (
              <LivreCard key={livre.id} livre={livre} />
            ))}
          </div>
        )}
      </main>

      {/* ── MODAL AJOUT LIVRE ── */}
      {modalOuvert && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-sable/20">
              <div>
                <h3 className="text-sm font-semibold text-[#3A2E24]">Ajouter un livre</h3>
                <p className="text-[10px] text-[#7A6A5A] mt-0.5">Remplissez les informations du nouvel ouvrage</p>
              </div>
              <button
                onClick={() => setModalOuvert(false)}
                className="w-7 h-7 rounded-full bg-amande flex items-center justify-center text-[#7A6A5A] hover:text-[#3A2E24] text-lg"
              >
                ×
              </button>
            </div>

            {succes ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-mousse/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-mousse text-2xl">✓</span>
                </div>
                <p className="text-sm font-semibold text-[#3A2E24]">Livre ajouté avec succès !</p>
                <p className="text-[11px] text-[#7A6A5A] mt-1">{form.titre} a été ajouté au catalogue</p>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Titre <span className="text-danger">*</span>
                  </label>
                  <input name="titre" value={form.titre} onChange={handleChange}
                    placeholder="Ex : L'Étranger"
                    className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Auteur <span className="text-danger">*</span>
                  </label>
                  <input name="auteur" value={form.auteur} onChange={handleChange}
                    placeholder="Ex : Albert Camus"
                    className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">Catégorie</label>
                  <select name="categorie" value={form.categorie} onChange={handleChange}
                    className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors">
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">Éditeur</label>
                    <input name="editeur" value={form.editeur} onChange={handleChange}
                      placeholder="Ex : Gallimard"
                      className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">Année</label>
                    <input name="annee" value={form.annee} onChange={handleChange}
                      placeholder="Ex : 1942"
                      className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">ISBN</label>
                  <input name="isbn" value={form.isbn} onChange={handleChange}
                    placeholder="Ex : 978-2070360024"
                    className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Nombre d'exemplaires <span className="text-danger">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm({ ...form, exemplaires: Math.max(1, Number(form.exemplaires) - 1) })}
                      className="w-8 h-8 rounded-lg bg-amande border border-sable/30 text-terre font-semibold hover:bg-sable/20 transition-colors"
                    >−</button>
                    <span className="text-lg font-semibold text-[#3A2E24] w-8 text-center">{form.exemplaires}</span>
                    <button
                      onClick={() => setForm({ ...form, exemplaires: Number(form.exemplaires) + 1 })}
                      className="w-8 h-8 rounded-lg bg-amande border border-sable/30 text-terre font-semibold hover:bg-sable/20 transition-colors"
                    >+</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Résumé ou description du livre…" rows={3}
                    className="w-full bg-amande border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors resize-none" />
                </div>
                <button
                  onClick={handleEnregistrer}
                  disabled={!form.titre || !form.auteur || saving}
                  className={`w-full py-3 rounded-xl text-[12px] font-medium transition-all ${
                    form.titre && form.auteur && !saving
                      ? "bg-terre text-amande hover:opacity-90"
                      : "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                  }`}
                >
                  {saving ? "Enregistrement…" : "Enregistrer le livre"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}