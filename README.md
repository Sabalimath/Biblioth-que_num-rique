# Biblioth-que_num-rique
Application web de gestion de bibliothèque — React, Tailwind CSS &amp; Supabase. Gestion des membres, emprunts, retours et pénalités avec 3 espaces distincts : Membre, Bibliothécaire et Administrateur.
# 📚 ARCHIVE — Système de Gestion de Bibliothèque

Application web complète pour gérer une bibliothèque moderne.

## 🚀 Fonctionnalités

### 👤 Espace Membre
- Inscription et connexion sécurisée
- Consultation du catalogue de livres
- Emprunt de livres (max 3 simultanément)
- Suivi des emprunts en cours et historique
- Consultation des pénalités
- Notifications d'échéance
- Avis sur la bibliothèque

### 📚 Espace Bibliothécaire
- Suivi des emprunts en cours
- Enregistrement des retours
- Calcul automatique des pénalités
- Encaissement des pénalités

### 🔑 Espace Administrateur
- Dashboard avec KPIs en temps réel
- Gestion du catalogue (ajout, modification)
- Gestion des membres
- Supervision des pénalités
- Statistiques globales

## ⚙️ Règles métier
- Maximum 3 emprunts simultanés par membre
- Pénalité automatique : 100 FCFA / jour de retard
- Blocage automatique si pénalité non réglée
- Déblocage automatique après paiement
- Date de retour : J+14 automatique

## 🛠️ Stack technique
- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth)
- **Déploiement** : Vercel

## 📦 Installation

```bash
git clone https://github.com/TON_USERNAME/archive-bibliotheque.git
cd archive-bibliotheque
npm install
npm run dev
```

## 🔐 Variables d'environnement

Crée un fichier `.env` à la racine :

```
VITE_SUPABASE_URL=ta_url_supabase
VITE_SUPABASE_ANON_KEY=ta_clé_supabase
```
