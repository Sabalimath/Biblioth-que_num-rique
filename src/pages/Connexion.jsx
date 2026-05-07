import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabase";

export default function Connexion() {
  const navigate = useNavigate();
  const { connecter, inscrire } = useAuth();
  const [mode, setMode]       = useState("connexion");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState("");
  const [form, setForm]       = useState({
    nom: "", email: "", telephone: "", password: "", confirm: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErreur("");
  }
async function handleConnexion() {
  if (!form.email || !form.password) {
    setErreur("Veuillez remplir tous les champs.");
    return;
  }
  setLoading(true);
  try {
    const { data, error } = await connecter(form.email, form.password);
    if (error) {
      setErreur("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // On récupère le rôle directement ici sans setTimeout
    const { data: profilData } = await supabase
      .from("profils")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profilData?.role === "admin" || profilData?.role === "bibliothecaire") {
      navigate("/circulation");
    } else {
      navigate("/membre/dashboard");
    }
    setLoading(false);

  } catch (_e) {
    setErreur("Une erreur est survenue. Réessayez.");
    setLoading(false);
  }
}

  async function handleInscription() {
    if (!form.nom || !form.email || !form.password) {
      setErreur("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (form.password !== form.confirm) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await inscrire(
        form.email, form.password, form.nom, form.telephone
      );
      if (error) {
        setErreur("Erreur : " + error.message);
        setLoading(false);
        return;
      }
      setTimeout(() => {
    navigate("/membre/dashboard");
    setLoading(false);
    }, 1000);

    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-amande flex">

      {/* Gauche : image */}
      <div className="hidden lg:block w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="Bibliothèque"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-terre/60 flex flex-col items-center justify-center text-center px-10">
          <h1 className="text-3xl font-semibold text-amande mb-3">ARCHIVE</h1>
          <p className="text-amande/70 text-sm max-w-xs">
            Votre bibliothèque numérique, simple et élégante.
          </p>
        </div>
      </div>

      {/* Droite : formulaire */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">

          {/* Tabs */}
          <div className="flex bg-white rounded-xl p-1 mb-8 border border-sable/20">
            <button
              onClick={() => { setMode("connexion"); setErreur(""); }}
              className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                mode === "connexion" ? "bg-terre text-amande" : "text-[#7A6A5A]"
              }`}
            >
              Se connecter
            </button>
            <button
              onClick={() => { setMode("inscription"); setErreur(""); }}
              className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                mode === "inscription" ? "bg-terre text-amande" : "text-[#7A6A5A]"
              }`}
            >
              S'inscrire
            </button>
          </div>

          {/* Message d'erreur */}
          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-[11px] text-red-600">{erreur}</p>
            </div>
          )}

          {mode === "connexion" ? (
            <>
              <h2 className="text-xl font-semibold text-[#3A2E24] mb-1">Bon retour 👋</h2>
              <p className="text-[11px] text-[#7A6A5A] mb-6">
                Connectez-vous à votre compte ARCHIVE
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Email
                  </label>
                  <input
                    name="email" type="email" placeholder="votre@email.com"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Mot de passe
                  </label>
                  <input
                    name="password" type="password" placeholder="••••••••"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <button
                  onClick={handleConnexion}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl text-[12px] font-medium transition-all mt-2 ${
                    loading
                      ? "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                      : "bg-terre text-amande hover:opacity-90"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Connexion…
                    </span>
                  ) : "Se connecter"}
                </button>
              </div>
              <p className="text-center text-[11px] text-[#7A6A5A] mt-4">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => setMode("inscription")}
                  className="text-terre font-medium hover:underline"
                >
                  S'inscrire
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-[#3A2E24] mb-1">Créer un compte</h2>
              <p className="text-[11px] text-[#7A6A5A] mb-6">Rejoignez la communauté ARCHIVE</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Nom complet <span className="text-danger">*</span>
                  </label>
                  <input
                    name="nom" type="text" placeholder="Jean Dupont"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    name="email" type="email" placeholder="votre@email.com"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Téléphone
                  </label>
                  <input
                    name="telephone" type="tel" placeholder="+221 77 000 00 00"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Mot de passe <span className="text-danger">*</span>
                  </label>
                  <input
                    name="password" type="password" placeholder="••••••••"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7A6A5A] uppercase tracking-wide mb-1 block">
                    Confirmer le mot de passe <span className="text-danger">*</span>
                  </label>
                  <input
                    name="confirm" type="password" placeholder="••••••••"
                    onChange={handleChange}
                    className="w-full bg-white border border-sable/30 rounded-lg px-3 py-2.5 text-[12px] text-[#3A2E24] outline-none focus:border-terre transition-colors"
                  />
                </div>
                <button
                  onClick={handleInscription}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl text-[12px] font-medium transition-all mt-2 ${
                    loading
                      ? "bg-sable/30 text-[#7A6A5A] cursor-not-allowed"
                      : "bg-terre text-amande hover:opacity-90"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Création du compte…
                    </span>
                  ) : "Créer mon compte"}
                </button>
              </div>
              <p className="text-center text-[11px] text-[#7A6A5A] mt-4">
                Déjà un compte ?{" "}
                <button
                  onClick={() => setMode("connexion")}
                  className="text-terre font-medium hover:underline"
                >
                  Se connecter
                </button>
              </p>
            </>
          )}

          <button
            onClick={() => navigate("/")}
            className="block text-center text-[10px] text-[#7A6A5A] hover:text-terre mt-6 mx-auto transition-colors"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}