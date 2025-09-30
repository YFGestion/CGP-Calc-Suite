# CGP Calc Suite

Bienvenue dans "CGP Calc Suite", une application React + Vite + TypeScript conçue pour fournir des outils de calculs financiers et patrimoniaux.

## Comment lancer le projet

Suivez ces étapes pour configurer et exécuter le projet en local :

1.  **Installer les dépendances :**
    Ouvrez votre terminal à la racine du projet et exécutez :
    ```bash
    npm install
    # ou
    yarn install
    # ou
    pnpm install
    ```

2.  **Lancer l'application en mode développement :**
    ```bash
    npm run dev
    # ou
    yarn dev
    # ou
    pnpm dev
    ```
    L'application sera accessible à l'adresse `http://localhost:8080` (ou un autre port si 8080 est déjà utilisé).

3.  **Construire l'application pour la production :**
    ```bash
    npm run build
    # ou
    yarn build
    # ou
    pnpm build
    ```
    Cela créera une version optimisée de l'application dans le dossier `dist/`.

4.  **Prévisualiser la version de production :**
    ```bash
    npm run preview
    # ou
    yarn preview
    # ou
    pnpm preview
    ```

5.  **Exécuter les tests :**
    ```bash
    npm test
    # ou
    yarn test
    # ou
    pnpm test
    ```

6.  **Vérifier les types TypeScript :**
    ```bash
    npm run typecheck
    # ou
    yarn typecheck
    # ou
    pnpm typecheck
    ```

7.  **Exécuter le linter :**
    ```bash
    npm run lint
    # ou
    yarn lint
    # ou
    pnpm lint
    ```

## Structure du projet

-   `/src/app` : Fichiers principaux de l'application (main, i18n, theme, layout).
-   `/src/components` : Composants UI réutilisables (shadcn/ui et personnalisés).
-   `/src/modules` : Pages et logique spécifiques à chaque module de calcul.
-   `/src/lib` : Utilitaires et fonctions helper.
-   `/src/pages` : Pages de niveau supérieur (Accueil, 404, À propos).
-   `/src/store` : Gestion de l'état global avec Zustand.

## Technologies utilisées

-   **React** & **Vite** & **TypeScript**
-   **React Router** pour la navigation
-   **Tailwind CSS** & **shadcn/ui** pour l'interface utilisateur
-   **next-themes** pour la gestion du thème clair/sombre
-   **react-i18next** pour l'internationalisation
-   **Zustand** pour la gestion de l'état
-   **Zod** pour la validation des formulaires
-   **Recharts** pour les graphiques
-   **Vitest** & **@testing-library/react** pour les tests
-   **Sonner** pour les notifications toast

---

**Note de conformité :** Cet outil fournit des estimations à visée pédagogique. Il ne se substitue pas à un calcul réglementaire ni à un conseil fiscal ou financier. Paramètres à vérifier et mettre à jour.