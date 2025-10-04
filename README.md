# The Richest

Une application web monopage qui permet de suivre les montants payés par différents utilisateurs et affiche un classement des plus riches.

## Fonctionnalités

- Affichage du Top 3 des utilisateurs avec les montants les plus élevés
- Carte personnelle "Moi" montrant votre position et montant
- Possibilité d'ajouter des paiements via un modal
- Persistance des données dans le navigateur (localStorage)
- Réinitialisation automatique des montants chaque mois (avec archivage)
- Export et import des données au format JSON

## Installation et démarrage

Aucune installation n'est nécessaire. L'application est entièrement statique et peut être servie par n'importe quel serveur web.

Pour démarrer localement avec un serveur simple :

```bash
# Si vous avez Python installé
python -m http.server

# Si vous avez Node.js installé
npx serve
```

Puis ouvrez votre navigateur à l'adresse indiquée (généralement http://localhost:8000 ou http://localhost:3000).

## Paramètres d'URL

L'application supporte les paramètres d'URL suivants :

- `?pseudo=VotrePseudo` - Définit le nom affiché pour votre carte
- `?avatar=URL_IMAGE` - Définit l'avatar affiché pour votre carte

Exemple : `index.html?pseudo=Jean&avatar=https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg`

## Persistance des données

Les données sont stockées localement dans le navigateur via localStorage sous les clés suivantes :

- `richest:v1:season:YYYY-MM` - Données de la saison en cours (mois actuel)
- `richest:v1:currentUser` - Informations sur l'utilisateur courant

Chaque mois, une nouvelle saison est automatiquement créée, réinitialisant les montants tout en conservant l'historique des saisons précédentes.

## Fonctionnement

1. Le Top 3 des utilisateurs est affiché en haut avec des cartes orange
2. Votre carte personnelle est affichée en blanc en dessous (si vous n'êtes pas dans le Top 3)
3. Cliquez sur "Payer" pour ajouter un montant à votre total
4. Le classement est automatiquement mis à jour après chaque paiement
5. En cas d'égalité de montant, l'utilisateur ayant effectué son premier paiement en premier est mieux classé

## Export et Import

- Utilisez le bouton "Exporter JSON" pour télécharger l'état actuel de l'application
- Utilisez le bouton "Importer JSON" pour charger un état précédemment exporté

Ces fonctionnalités sont utiles pour sauvegarder vos données ou les transférer entre différents navigateurs.
