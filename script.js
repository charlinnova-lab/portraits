/* =========================================================
   GALERIE — L'INNOVATION, UNE HISTOIRE COLLECTIVE
   innov'a (c) Charlotte Piau
   Création : 24 août 2026
   Last Modification

   Ce fichier :
   1. interroge le Worker Cloudflare
   2. récupère les portraits depuis Airtable
   3. associe chaque catégorie à sa couleur
   4. crée automatiquement les cartes

   IMPORTANT :
   Le token Airtable n'est PAS présent ici.   Il est stocké comme secret dans Cloudflare.
========================================================= 


/* =========================================================
   1. CONFIGURATION
========================================================= */

// Adresse publique de notre Worker Cloudflare.
// Le token Airtable n'est jamais exposé dans GitHub.
const API_URL =
    "https://portaitsexpo.charlottepiau-innova.workers.dev";


/* =========================================================
   2. CATÉGORIES
========================================================= */

// On conserve exactement les catégories définies dans Airtable.
// La couleur correspond à l'identité graphique de chaque étape.

const CATEGORIES = {

    "Là où les idées germent : écoles & laboratoires": {
        label: "L’idée germe",
        className: "category-germe"
    },

    "Là où l’idée grandit et est testées : centres techniques & dispositifs d’accompagnement": {
        label: "L’idée grandit",
        className: "category-grandit"
    },

    "Là où l’idée prend forme : start-up": {
        label: "L’idée prend forme",
        className: "category-forme"
    },

    "Là où l’idée se transforme en solution : entreprises": {
        label: "L’idée devient une solution",
        className: "category-solution"
    },

    "Là où l’idée se déploit : dynamiques collectives": {
        label: "L’idée se déploie",
        className: "category-deploie"
    }
};


/* =========================================================
   3. ÉCHAPPEMENT DU HTML
========================================================= */

// Petite fonction de sécurité.
// Elle empêche un caractère particulier présent dans Airtable
// de casser notre HTML.

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   4. RÉCUPÉRATION DES PORTRAITS
========================================================= */

async function chargerPortraits() {

    const gallery = document.getElementById("gallery");

    gallery.innerHTML =
        '<div class="loading">Chargement des portraits…</div>';

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                `Erreur du serveur : ${response.status}`
            );
        }

        const data = await response.json();

        /*
         * Airtable renvoie les données sous cette forme :
         *
         * {
         *   records: [
         *      {
         *          id: "...",
         *          fields: {
         *              Structure: "...",
         *              Category: "...",
         *              ...
         *          }
         *      }
         *   ]
         * }
         */

        const portraits = data.records || [];

        console.log(
            "Nombre de portraits reçus :",
            portraits.length
        );

        afficherPortraits(portraits);

    } catch (error) {

        console.error(
            "Impossible de charger les portraits :",
            error
        );

        gallery.innerHTML = `
            <div class="error">
                Impossible de charger les portraits.
                <br>
                Veuillez réessayer dans quelques instants.
            </div>
        `;
    }
}


/* =========================================================
   5. AFFICHAGE DE LA GALERIE
========================================================= */

function afficherPortraits(portraits) {

    const gallery = document.getElementById("gallery");

    gallery.innerHTML = "";

    /*
     * On trie les portraits selon leur Panel ID.
     * Cela permet de conserver l'ordre de lecture défini
     * dans Airtable.
     */

    portraits.sort((a, b) => {

        const panelA = Number(a.fields?.["Panel ID"]) || 9999;
        const panelB = Number(b.fields?.["Panel ID"]) || 9999;

        return panelA - panelB;
    });


    /*
     * Création de chaque carte.
     */

    portraits.forEach(portrait => {

        const card = creerCartePortrait(portrait);

        gallery.appendChild(card);
    });
}


/* =========================================================
   6. CRÉATION D'UNE CARTE
========================================================= */

function creerCartePortrait(record) {

    const fields = record.fields || {};

    const structure =
        fields["Structure"] || "Structure";

    const category =
        fields["Category"] ||
        fields["Catégory"] ||
        "";

    const tagline =
        fields["Un mot pour vous résumer ?"] ||
        "";


    /* -----------------------------------------------------
       Déterminer la catégorie
    ----------------------------------------------------- */

    const categoryInfo =
        CATEGORIES[category] || {

            label: "L’innovation",
            className: ""
        };


    /* -----------------------------------------------------
       Récupérer l'image Airtable
    ----------------------------------------------------- */

    let imageURL = "";

    const imageField =
        fields["Visuel"];

    if (
        Array.isArray(imageField) &&
        imageField.length > 0
    ) {

        /*
         * Airtable fournit plusieurs tailles.
         * "large" est idéale pour notre galerie.
         */

        imageURL =
            imageField[0]?.thumbnails?.large?.url ||
            imageField[0]?.url ||
            "";
    }


    /* -----------------------------------------------------
       Création de la carte
    ----------------------------------------------------- */

    const card =
        document.createElement("article");

    card.className =
        "portrait-card";


    /* -----------------------------------------------------
       Image
    ----------------------------------------------------- */

    if (imageURL) {

        const image =
            document.createElement("img");

        image.className =
            "portrait-image";

        image.src =
            imageURL;

        image.alt =
            structure;

        image.loading =
            "lazy";

        card.appendChild(image);
    }


    /* -----------------------------------------------------
       Contenu
    ----------------------------------------------------- */

    const content =
        document.createElement("div");

    content.className =
        "portrait-content";


    /* -----------------------------------------------------
       Pastille de chapitre
    ----------------------------------------------------- */

    const badge =
        document.createElement("div");

    badge.className =
        `chapter-badge ${categoryInfo.className}`;

    badge.textContent =
        categoryInfo.label;

    content.appendChild(badge);


    /* -----------------------------------------------------
       Nom de la structure
    ----------------------------------------------------- */

    const title =
        document.createElement("h2");

    title.className =
        "portrait-title";

    title.textContent =
        structure;

    content.appendChild(title);


    /* -----------------------------------------------------
       Tagline
    ----------------------------------------------------- */

    if (tagline) {

        const taglineElement =
            document.createElement("p");

        taglineElement.className =
            "portrait-tagline";

        taglineElement.textContent =
            tagline;

        content.appendChild(
            taglineElement
        );
    }


    card.appendChild(content);


    /* -----------------------------------------------------
       Clic sur la carte
       
       Pour le moment, on affiche simplement les données
       dans la console.

       À l'étape suivante, ce clic ouvrira la grande
       interview.
    ----------------------------------------------------- */

    card.addEventListener(
        "click",
        () => {

            console.log(
                "Portrait sélectionné :",
                structure
            );

            console.log(
                "Données Airtable :",
                fields
            );
        }
    );


    return card;
}


/* =========================================================
   7. LANCEMENT
========================================================= */

/*
 * Lorsque la page est chargée,
 * on lance automatiquement le chargement
 * des 39 portraits.
 */

document.addEventListener(
    "DOMContentLoaded",
    chargerPortraits
);
