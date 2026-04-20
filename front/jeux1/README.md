# Save The Recipe

**Save The Recipe** est un jeu de plateforme dynamique inspiré de l'univers de Bob l'éponge. Incarnez notre héros et empêchez Plankton de s'emparer de la célèbre recette secrète du Pâté de Crabe !

Une vidéo de démonstration est disponible ici : https://youtu.be/5gMsZkk8MOc?si=Ndh1NeVXA1eTROHF

## Présentation du Jeu

Plankton a encore frappé ! Il tente de s'échapper avec la formule secrète. Votre mission est de naviguer à travers différents niveaux, d'éviter les pièges, de vaincre les sbires de Plankton et de l'affronter directement pour récupérer le précieux trésor.

## Fonctionnalités

- **Progression par Niveaux** : Plusieurs niveaux aux difficultés croissantes.
- **Combat de Boss** : Affrontement final contre Plankton.
- **Système de Combat** : Collectez des "ingrédients" pour tirer sur vos ennemis.
- **Bonus & Power-ups** :
  - **Munitions** : Récupérez des ingrédients pour attaquer.
  - **Vies** : Gagnez des cœurs pour rester dans la course.
  - **Freeze** : Gelez Plankton et ses projectiles temporairement.
  - **Score** : Augmentez votre score en collectant des bonus.
- **Système de High Score** : Votre meilleur score est sauvegardé localement.

## Processus de Développement

Le développement de ce projet a suivi une approche itérative intégrant plusieurs outils et intelligences artificielles :

1. **Organisation** : Initialement sur un autre dépôt GitHub, nous avons migré vers ce nouveau repository suite à des problèmes d'organisation interne.
2. **Squelette & Graphisme** : Nous avons d'abord conçu la structure technique (le squelette) du jeu, puis nous avons utilisé **Gemini** (Google) pour transformer ce socle en une version graphique aboutie.
3. **Gestion de Conflits** : **ChatGPT** (OpenAI) a été sollicité pour nous aider à résoudre les conflits de code et les bugs complexes rencontrés durant l'intégration.
4. **Documentation** : La première version du README a été rédigée manuellement avant d'être optimisée et mise en forme par **ClaudeAI** (Anthropic) pour un rendu plus professionnel.

## Répartition du Travail

- **El Rifai Riham (70%)** : Conception graphique et visuelle du jeu, création des sprites et des animations, gestion de l'interface utilisateur, optimisation des performances visuelles.
- **Rahmouni Mohamed Khalil (30%)** : Architecture technique et mécanique du jeu, système de collisions et de physique, implémentation du combat et des power-ups, gestion du high score.

## Défis & Solutions

| Défi | Resolution |
| :--- | :--- |
| **Conflits de fusion de code** | Utilisation de ChatGPT pour identifier et résoudre les bugs d'intégration complexes |
| **Transition squelette vers graphismes** | Collaboration avec Gemini pour transformer le code brut en version visuelle cohérente |
| **Organisation du projet** | Migration vers un nouveau repository pour améliorer la structure et la gestion du code |
| **Double saut et physique du joueur** | Implémentation d'un système de sauts imbriqués avec gestion des collisions |

## Justification des Choix

**Pourquoi Save The Recipe ?** : Nous avons choisi l'univers de Bob l'éponge car il offre un cadre ludique et accessible, avec des personnages reconnaissables qui motivent le joueur. La recette du Pâté de Crabe représente un objectif clair et narratif fort.

**Pourquoi un jeu de plateforme ?** : Le genre plateforme permet une courbe de difficulté progressive et des mécaniques simples mais amusantes (sauts, collectibles, boss).

**Pourquoi ces power-ups ?** : Munitions, vies et freeze offrent une variété stratégique sans surcharger le gameplay. Ils encouragent l'exploration et récompensent le joueur.

## Controles

| Action | Touches |
| :--- | :--- |
| **Deplacement** | Fleches Gauche/Droite ou A / D |
| **Sauter** | Fleche Haut ou Espace (Double saut disponible) |
| **Grimper** | Fleches Haut/Bas ou W / S (sur les echelles) |
| **Tirer** | Touche F ou Entree |
| **Redemarrer** | Touche R (lors d'un Game Over ou Victoire) |
| **Menu** | Touche Echap |

## Installation & Lancement

1. Clonez ou téléchargez le dépôt.
2. Ouvrez simplement le fichier `index.html` dans votre navigateur Web préféré.
3. Cliquez sur **Commencer** pour lancer l'aventure !

## Collaborateurs

Ce projet a été réalisé par :
- **Rahmouni Mohamed Khalil**
- **El Rifai Riham**

## Références des jeux

- Code du 1er jeu : https://github.com/rihamrifaii12-droid/TP_Khalil_Riham
- Code du 2ème jeu : https://github.com/khalilouro/Jeu_DOM
- Code du 3ème jeu : https://github.com/rihamrifaii12-droid/JeuKhalilRiham

---
*Développé dans le cadre d'un projet universitaire.*