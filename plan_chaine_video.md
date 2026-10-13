# Plan chaîne vidéo Block Thud! (TikTok + YouTube Shorts + Reels)

Objectif : une chaîne qui apprend vite ce qui perce, puis réutilise les meilleures vidéos en pubs payantes (c'est ce que font les gros : ils recyclent le contenu qui a déjà percé).
Rien ici n'est garanti. Les chiffres externes viennent de blogs marketing, pas des plateformes : à mesurer sur TES comptes.

## 1. Positionnement (ce qui te différencie)
Le gameplay brut de Block Blast existe déjà par milliers. Ton angle unique : **la gravité**.
Nom de chaîne / promesse : « Puzzles where blocks FALL » — chaque vidéo montre un moment où la gravité change la solution.
Un seul personnage récurrent : toi (voix ou texte à l'écran), pas d'avatar IA au départ.

## 2. Quatre piliers de contenu (on teste tous, on garde les 1-2 meilleurs)
| Pilier | Format | Hook (0-2 s) | Fin |
|---|---|---|---|
| A. Défi « 1 coup » | plateau fixe, le joueur doit trouver le coup qui nettoie tout | « 95 % des gens ratent ce coup » + plateau | s'arrête avant la solution, solution en commentaire épinglé |
| B. ASMR gravité | 10-15 s de lignes qui explosent et blocs qui tombent, sons réels du jeu | direct sur la 1re explosion | boucle (la dernière image rejoint la première) |
| C. Comparaison | Block Blast vs Block Thud sur le même plateau ; « ce que fait la gravité » | « Ce plateau est perdu dans Block Blast… » | résultat inversé |
| D. Apprendre / analyser | « 3 erreurs qui font perdre à Block Blast », « pourquoi tu perds à 4 000 points » | l'erreur à l'écran | conseil + appel à essayer |

Pilier D = ce qui avait percé chez les autres (tutos, high score, comparaisons) d'après mes recherches ; A, B, C = ton avantage de jeu.

## 3. Règles de montage (tirées des sources, à valider sur tes stats)
- 1 à 2 premières secondes = le moment le plus fort. Jamais de menu ni d'intro.
- 15 à 30 s pour A/B/C ; 25 à 45 s pour D. La rétention compte plus que la durée.
- Sous-titres incrustés (beaucoup regardent sans le son), mais garder les vrais sons du jeu.
- Fin en boucle quand c'est possible (le rewatch est un signal fort).
- Appel à l'action unique et léger : « lien en bio » (jamais « télécharge » en gros).
- Pas de pub jouée comme du gameplay : ne pas montrer de faux écran de jeu (règles des plateformes).

## 4. Rythme et calendrier (4 semaines, 20 vidéos)
- 5 vidéos par semaine par plateforme (même vidéo, 3 plateformes), à des heures différentes : 12 h, 18 h, 21 h (heure du pays visé).
- Semaine 1 : 2 A, 1 B, 1 C, 1 D. Semaine 2 : on double les piliers qui font le plus de « temps regardé ».
- Semaine 3 : variantes des 3 meilleures vidéos (même idée, autre plateau/hook).
- Semaine 4 : bilan, on garde 1-2 piliers, on arrête le reste.

Les vidéos sont rendues par ton pipeline (`blockthud-video/`, Chrome headless + ffmpeg) à partir de vrais plateaux du jeu → je peux en produire 5 par lot.

## 5. Mesure (ce qui décide)
Pour chaque vidéo, noter dans un tableau (je peux le préparer) :
- TikTok : durée moyenne regardée, % vu en entier, partages, enregistrements.
- YouTube Shorts : « Choisi pour regarder / Passé » (Studio → Analytics → Contenu → Shorts), durée moyenne en %, vues engagées.
- Play Console : fiche → acquisition → installs par source. Lien de bio avec référent :
  `https://play.google.com/store/apps/details?id=com.king6code.blockthud&referrer=utm_source%3Dtiktok%26utm_campaign%3Dvideo_NN` (un NN par vidéo).
- Firebase : rétention J1/J7 des installs venant de ces liens (le jeu envoie déjà les événements).

Seuils de décision (à ajuster après 10 vidéos, ce sont mes hypothèses, pas des normes) :
- Une vidéo « fonctionne » si elle fait 3× ta médiane de vues ou >50 % de temps regardé.
- Un pilier est gardé s'il produit au moins 2 vidéos « qui fonctionnent » sur 5.
- Une vidéo qui dépasse 20 000 vues en 48 h → on la teste en pub payante (Spark Ads TikTok ou Shorts via Google Ads) avec 5 €/jour.

## 6. Attentes réalistes
- La plupart des vidéos feront 500 à 5 000 vues. Une sur dix ou vingt peut faire 10× plus. C'est pour ça qu'on fait du volume et du suivi.
- Conversion vue → install organique : aucun chiffre fiable trouvé. On mesure avec les liens avec référent ; ne rien présumer avant ~30 vidéos.
- Délai : premiers signaux utiles en 2-3 semaines ; décision « on continue / on change d'angle » à J30.

## 7. Étapes
1. (moi) Produire le lot 1 : 5 vidéos (2 défis, 1 ASMR, 1 comparaison, 1 tuto) + légendes + hashtags + tableau de suivi.
2. (toi) Créer / préparer les comptes TikTok, YouTube, Instagram au même nom ; mettre le lien avec référent en bio.
3. (moi) Après 7 jours : analyse des chiffres que tu me donnes (captures ou export), classement des vidéos, lot 2.
4. J30 : bilan, décision d'investir en pub sur les meilleures vidéos.

## Sources consultées (blogs marketing, à prendre comme indicatif)
- TikTok : signaux = temps regardé, % terminé, partages, rewatch, enregistrements (socialchamp, hootsuite, eclincher).
- YouTube Shorts : « choisi vs passé » dans Studio ; chaque boucle compte comme une vue depuis mars 2025 (vidiq, outlierkit).
- Block Blast : recycle des vidéos TikTok en pubs avec légendes de bénéfice (maf.ad, udonis).
