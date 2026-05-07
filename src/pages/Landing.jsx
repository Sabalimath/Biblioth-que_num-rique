import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-amande font-sans">

      {/* ── HERO ── */}
      <div className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Image de fond */}
        <img
          src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&q=80"
          alt="Bibliothèque"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay sombre pour lisibilité */}
        <div className="absolute inset-0 bg-[#3A2E24]/70" />
        {/* Contenu */}
        <div className="relative z-10">
          <p className="text-sable text-xs uppercase tracking-[4px] mb-4">Bienvenue sur</p>
          <h1 className="text-5xl font-semibold text-amande leading-tight mb-4">
            ARCHIVE
          </h1>
          <p className="text-amande/80 text-lg mb-2 max-w-xl">
            Votre bibliothèque numérique, simple et élégante.
          </p>
          <p className="text-amande/50 text-sm mb-10 max-w-md">
            Explorez des milliers d'ouvrages, gérez vos emprunts et rejoignez une communauté de lecteurs passionnés.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/inscription")}
              className="bg-terre text-amande px-8 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              S'inscrire gratuitement
            </button>
            <button
              onClick={() => navigate("/connexion")}
              className="border border-amande/50 text-amande px-8 py-3 rounded-xl text-sm font-medium hover:bg-amande/10 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
        {/* Flèche scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-amande/40 animate-bounce text-xl">↓</div>
      </div>

      {/* ── À PROPOS ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <p className="text-terre text-xs uppercase tracking-[3px] text-center mb-3">À propos</p>
        <h2 className="text-2xl font-semibold text-[#3A2E24] text-center mb-6">
          Une bibliothèque pensée pour vous
        </h2>
        <p className="text-[#7A6A5A] text-sm text-center leading-relaxed max-w-2xl mx-auto mb-4">
          ARCHIVE est une bibliothèque moderne qui met la culture à portée de tous. Fondée sur des valeurs de partage et d'accessibilité, nous proposons une collection riche et variée pour tous les goûts et tous les âges.
        </p>
        <p className="text-[#7A6A5A] text-sm text-center leading-relaxed max-w-2xl mx-auto">
          Notre équipe de bibliothécaires passionnés est disponible pour vous guider dans vos découvertes littéraires et vous accompagner dans chaque emprunt.
        </p>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-terre text-xs uppercase tracking-[3px] text-center mb-3">Nos services</p>
          <h2 className="text-2xl font-semibold text-[#3A2E24] text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { emoji: "📚", titre: "Catalogue en ligne",     desc: "Accédez à plus de 10 000 ouvrages classés par catégorie, auteur ou disponibilité en temps réel." },
              { emoji: "🔄", titre: "Emprunts simplifiés",    desc: "Empruntez jusqu'à 3 livres simultanément. La date de retour est calculée automatiquement." },
              { emoji: "🔔", titre: "Rappels automatiques",   desc: "Recevez une notification 2 jours avant la date de retour pour éviter toute pénalité de retard." },
              { emoji: "📖", titre: "Historique complet",     desc: "Consultez l'historique de tous vos emprunts passés et suivez vos lectures favorites." },
              { emoji: "💳", titre: "Gestion des pénalités",  desc: "Consultez vos pénalités en temps réel et réglez-les directement auprès du bibliothécaire." },
              { emoji: "👤", titre: "Espace personnel",       desc: "Un tableau de bord dédié pour suivre vos emprunts, votre statut et vos informations de compte." },
            ].map((s) => (
              <div key={s.titre} className="text-center">
                <div className="w-12 h-12 bg-amande rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">
                  {s.emoji}
                </div>
                <h3 className="text-sm font-semibold text-[#3A2E24] mb-2">{s.titre}</h3>
                <p className="text-[11px] text-[#7A6A5A] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-6 text-center bg-terre">
        <h2 className="text-2xl font-semibold text-amande mb-3">
          Prêt à rejoindre ARCHIVE ?
        </h2>
        <p className="text-amande/70 text-sm mb-8 max-w-md mx-auto">
          Créez votre compte en quelques secondes et accédez à toute notre collection dès aujourd'hui.
        </p>
        <button
          onClick={() => navigate("/inscription")}
          className="bg-amande text-terre px-10 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          S'inscrire maintenant
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#3A2E24] py-6 text-center">
        <p className="text-amande/40 text-[11px]">© 2026 ARCHIVE — Tous droits réservés</p>
      </footer>
    </div>
  );
}