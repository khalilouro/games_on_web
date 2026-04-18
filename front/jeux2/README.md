# Fragment

Fragment est un jeu de puzzle JavaScript inspiré du Jigo Solitaire. Le joueur doit reconstituer une image en déplaçant et en échangeant des morceaux, avec une progression de niveaux croissante et un système de récompense visuel.

## Objectif du projet

L'application vise à présenter un puzzle interactif avec :

- une progression persistante via `localStorage`,
- un choix de niveaux et de difficultés adaptatives,
- une interface de menu ergonomique,
- une mécanique de regroupement et de déplacement de pièces,
- une expérience de fin de jeu avec animation de victoire.

## Fonctionnalités

- 9 niveaux différents, chacun avec une image unique.
- Grilles adaptatives selon le niveau : 3x3, 3x4, 4x4, 4x5 et 5x5.
- Déblocage automatique du niveau suivant après réussite.
- Révélation progressive d'une image mystère dans l'écran d'accueil.
- Interaction par sélection de morceaux et déplacement de groupes.
- Vérification de victoire basée sur l'alignement exact des segments d'image.
- Effet de fusion visuel lorsque des morceaux adjacents sont correctement placés.
- Écran de victoire avec animation de confettis.

## Architecture du code

Le projet est structuré pour séparer les responsabilités :

- `index.html` : structure de l'interface et chargement des scripts.
- `css/style.css` : styles de présentation et animations.
- `js/modules/` : code principal organisé en modules.
  - `state.js` : état global, variables partagées et références DOM.
  - `data.js` : définition des positions correctes et des niveaux.
  - `progress.js` : gestion de la progression et du stockage local.
  - `menu.js` : affichage de l'écran d'accueil et navigation.
  - `puzzle.js` : génération du puzzle, interactions et logique de déplacement.
  - `victory.js` : gestion de la fin de partie et effets de victoire.
- `js/legacy/` : versions précédentes du jeu conservées à titre de référence.

## Structure des dossiers

- `index.html`
- `README.md`
- `css/`
  - `style.css`
- `js/`
  - `modules/`
    - `state.js`
    - `data.js`
    - `progress.js`
    - `menu.js`
    - `puzzle.js`
    - `victory.js`
  - `legacy/`
    - `script.js`
    - `script2.js`
    - `script3.js`
- `asset/image/`
  - `image1.jpg`
  - `image2.png`
  - `image3.png`
  - `image4.png`
  - `image5.png`
  - `image6.png`
  - `image7.png`
  - `image8.png`
  - `image9.png`
  - `image10.png`

## Installation et lancement

1. Cloner ou copier le dépôt dans un dossier local.
2. Ouvrir `index.html` dans un navigateur compatible.
3. Aucune installation supplémentaire n'est requise.

> Pour un usage local sans serveur, le jeu fonctionne directement en ouvrant le fichier HTML.

## Utilisation

1. Ouvrir `index.html` dans un navigateur.
2. Cliquer sur le bouton principal pour démarrer le niveau en cours.
3. Sélectionner une première case, puis une seconde pour déplacer un groupe de pièces.
4. Réorganiser les pièces jusqu'à reconstituer l'image.
5. Le niveau suivant se débloque automatiquement une fois le puzzle terminé.

## Détails techniques

- La grille est générée dynamiquement avec des cellules `div`.
- Chaque cellule utilise `background-image`, `background-size` et `background-position` pour afficher la partie correcte de l'image.
- Le mélange est généré aléatoirement au démarrage de chaque niveau.
- Le système de groupe repose sur des classes CSS temporaires (`merged-right`, `merged-left`, `merged-top`, `merged-bottom`) pour déterminer les pièces connexes.
- La victoire est détectée lorsque chaque segment atteint sa position cible.
- La gestion des images a été plus complexe que prévu : le changement de formats et la cohérence visuelle entre niveaux ont nécessité plusieurs itérations.
- Certaines images de niveaux ont été générées avec une assistance IA pour garantir une disponibilité rapide de visuels adaptés.
- Un problème supplémentaire rencontré a été l'adaptation du dimensionnement du puzzle sur différentes tailles d'écran, ce qui a conduit à ajuster le rendu des cellules.

## Répartition du travail

- **Rahmouni Mohamed Khalil** (40%) : architecture initiale du projet, création du squelette HTML/CSS, première version du puzzle, prototype de génération de grille, positionnement des cellules et prototypes de déplacement.
- **El Rifai Riham** (60%) : développement des niveaux supplémentaires, ajout du système de progression et de l'écran d'accueil, gestion des niveaux déblocables, intégration de l'écran de victoire, finalisation et tests.

## Difficultés rencontrées et résolutions

- Problème : adaptation des images aux différents formats et niveaux.
  - Solution : utilisation de visuels générés par IA pour obtenir rapidement des images cohérentes et homogènes.
- Problème : rendu du puzzle sur différentes tailles d'écran.
  - Solution : ajustement du dimensionnement des cellules et des grilles pour améliorer la compatibilité responsive.
- Problème : logique de déplacement de groupes et détection de fusion.
  - Solution : implémentation d'un système de classes CSS et d'une fonction `getGroup` pour gérer les blocs de pièces connectées.

## Justification des choix

- Choix du jeu : le puzzle visuel se prête bien à une mise en œuvre DOM et permet d'exploiter les propriétés CSS (`background-position`, `background-size`).
- Choix du format : un jeu de type puzzle offre une expérience accessible à la fois ludique et technique, tout en restant adapté à un projet en JavaScript pur.
- Choix du découpage : séparer le code en modules (`state`, `data`, `progress`, `menu`, `puzzle`, `victory`) améliore la lisibilité et facilite la maintenance.

## Auteurs

- Rahmouni Mohamed Khalil : conception du squelette du jeu, prototype initial et structure générale.
- El Rifai Riham : extension du contenu, ajout de niveaux, amélioration de la progression et finalisation du projet.
