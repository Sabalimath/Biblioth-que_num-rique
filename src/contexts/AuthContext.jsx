import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

// On crée le contexte — c'est comme une "boîte" partagée
const AuthContext = createContext({});

// Hook personnalisé pour utiliser le contexte facilement
// Au lieu d'écrire useContext(AuthContext) partout
// on écrit juste useAuth()
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);  // l'utilisateur connecté
  const [profil, setProfil]   = useState(null);  // ses infos (nom, rôle...)
  const [loading, setLoading] = useState(true);  // on attend la réponse

  // Charger le profil depuis la table profils
  async function chargerProfil(userId) {
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("id", userId)
      .single();
    setProfil(data);
  }

  useEffect(() => {
    // Vérifier si quelqu'un est déjà connecté au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) chargerProfil(session.user.id);
      setLoading(false);
    });

    // Écouter les changements de connexion en temps réel
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await chargerProfil(session.user.id);
        } else {
          setProfil(null);
        }
        setLoading(false);
      }
    );

    // Nettoyer l'écouteur quand le composant se démonte
    return () => subscription.unsubscribe();
  }, []);

  // Fonction d'inscription
  async function inscrire(email, password, nom, telephone) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, telephone } // transmis au trigger automatique
      }
    });
    return { data, error };
  }

  // Fonction de connexion
  async function connecter(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  // Fonction de déconnexion
  async function deconnecter() {
    await supabase.auth.signOut();
    setUser(null);
    setProfil(null);
  }

  // Tout ce qu'on partage avec les autres composants
  const value = {
    user,
    profil,
    loading,
    inscrire,
    connecter,
    deconnecter,
    estConnecte: !!user,
    estMembre:        profil?.role === "membre",
    estBibliothecaire: profil?.role === "bibliothecaire",
    estAdmin:         profil?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {/* On n'affiche rien tant qu'on vérifie la session */}
      {!loading && children}
    </AuthContext.Provider>
  );
}