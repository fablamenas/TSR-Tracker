# Stock TSR dashboard

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/fablamenas-projects/v0-stock-tsr-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/mXOwjLBw2Qh)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Sources de données et indicateurs

Le tableau de bord interroge les endpoints publics Yahoo Finance pour récupérer les prix et métadonnées des actions. La recherche de titres utilise l'API `v1/finance/search`, limitée aux actions (quoteType `EQUITY`). Les données de prix proviennent de l'API `v8/finance/chart` avec un historique quotidien sur 13 mois, ce qui permet de calculer des périodes glissantes et d'afficher une sparkline des 30 derniers jours.

### Indicateurs affichés

- **Prix courant** : valeur `regularMarketPrice` renvoyée par Yahoo Finance, affichée avec la devise de l'instrument.
- **Sparkline 30 jours** : série des cours quotidiens des 30 derniers jours (ajustés si disponible).
- **TSR 1M / 3M / 6M / 1Y** : variation en pourcentage entre le prix courant et le prix le plus proche de la date cible. Le calcul est basé sur les cours ajustés (`adjclose`) lorsque Yahoo Finance les fournit ; sinon il utilise les cours de clôture (`close`). Cela donne une approximation du rendement total (incluant les effets de dividendes et de splits via l'ajustement) mais ne remplace pas un calcul de TSR complet si les ajustements ne sont pas disponibles.

## Deployment

Your project is live at:

**[https://vercel.com/fablamenas-projects/v0-stock-tsr-dashboard](https://vercel.com/fablamenas-projects/v0-stock-tsr-dashboard)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/mXOwjLBw2Qh](https://v0.app/chat/mXOwjLBw2Qh)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
