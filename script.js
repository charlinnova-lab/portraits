/* =========================================================
   GALERIE — L'INNOVATION, UNE HISTOIRE COLLECTIVE
   innov'a (c) Charlotte Piau
   Création : 24 août 2026
   Last Modification

   Ce fichier :

   1. récupère les portraits depuis Cloudflare
   2. affiche les cartes
   3. gère les catégories et leurs couleurs
   4. ouvre une grande interview
   5. permet de revenir à la galerie

   IMPORTANT :
   Le token Airtable n'est JAMAIS présent ici.
   Il est conservé comme secret dans Cloudflare.
========================================================= */


/* =========================================================
   1. CONFIGURATION
========================================================= */

const API_URL =
    "https://portaitsexpo.charlottepiau-innova.workers.dev";


/* =========================================================
   2. CATÉGORIES
========================================================= */

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
   3. ÉCHAPPEMENT HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

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
   4. RÉCUPÉRER L'IMAGE AIRTABLE
========================================================= */

function getImageURL(fields) {

    const imageField =
        fields["Visuel"];


    if (
        !Array.isArray(imageField) ||
        imageField.length === 0
    ) {

        return "";
    }


    return (

        imageField[0]?.thumbnails?.large?.url ||

        imageField[0]?.url ||

        ""
    );
}


/* =========================================================
   5. CHARGEMENT DES PORTRAITS
========================================================= */

async function chargerPortraits() {

    const gallery =
        document.getElementById("gallery");


    gallery.innerHTML = `
        <div class="loading">
            Chargement des portraits…
        </div>
    `;


    try {

        const response =
            await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                `Erreur du serveur : ${response.status}`
            );
        }


        const data =
            await response.json();


        const portraits =
            data.records || [];


        console.log(
            "Portraits reçus :",
            portraits.length
        );


        afficherPortraits(portraits);


    } catch (error) {

        console.error(
            "Erreur lors du chargement :",
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
   6. AFFICHER LA GALERIE
========================================================= */

function afficherPortraits(portraits) {

    const gallery =
        document.getElementById("gallery");


    gallery.innerHTML = "";


    /*
       On conserve l'ordre défini par Panel ID.
    */

    portraits.sort(
        (a, b) => {

            const panelA =
                Number(
                    a.fields?.["Panel ID"]
                ) || 9999;


            const panelB =
                Number(
                    b.fields?.["Panel ID"]
                ) || 9999;


            return panelA - panelB;
        }
    );


    portraits.forEach(
        portrait => {

            const card =
                creerCartePortrait(
                    portrait
                );


            gallery.appendChild(card);
        }
    );
}


/* =========================================================
   7. CRÉER UNE CARTE
========================================================= */

function creerCartePortrait(record) {

    const fields =
        record.fields || {};


    const structure =
        fields["Structure"] ||
        "Structure";


    const category =
        fields["Category"] ||
        fields["Catégory"] ||
        "";


    const tagline =
        fields[
            "Un mot pour vous résumer ?"
        ] || "";


    const categoryInfo =
        CATEGORIES[category] || {

            label: "L’innovation",

            className: ""
        };


    const imageURL =
        getImageURL(fields);


    const card =
        document.createElement("article");


    card.className =
        "portrait-card";


    /* -----------------------------------------------------
       IMAGE
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
       CONTENU
    ----------------------------------------------------- */

    const content =
        document.createElement("div");


    content.className =
        "portrait-content";


    /* -----------------------------------------------------
       PASTILLE
    ----------------------------------------------------- */

    const badge =
        document.createElement("div");


    badge.className =
        `chapter-badge ${categoryInfo.className}`;


    badge.textContent =
        categoryInfo.label;


    content.appendChild(badge);


    /* -----------------------------------------------------
       TITRE
    ----------------------------------------------------- */

    const title =
        document.createElement("h2");


    title.className =
        "portrait-title";


    title.textContent =
        structure;


    content.appendChild(title);


    /* -----------------------------------------------------
       TAGLINE
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
       CLIC
       
       Maintenant le clic ouvre la grande interview.
    ----------------------------------------------------- */

    card.addEventListener(
        "click",
        () => {

            ouvrirInterview(record);
        }
    );


    return card;
}


/* =========================================================
   8. OUVRIR UNE INTERVIEW
========================================================= */

function ouvrirInterview(record) {

    const fields =
        record.fields || {};


    const gallery =
        document.getElementById("gallery");


    const detail =
        document.getElementById("detail");


    const detailContent =
        document.getElementById(
            "detail-content"
        );


    /* -----------------------------------------------------
       Récupération des données
    ----------------------------------------------------- */

    const structure =
        fields["Structure"] ||
        "Structure";


    const category =
        fields["Category"] ||
        fields["Catégory"] ||
        "";


    const tagline =
        fields[
            "Un mot pour vous résumer ?"
        ] || "";


    const genesis =
        fields[
            "Genèse & Inspiration"
        ] || "";


    const collaboration =
        fields[
            "Collaborations & Écosystème"
        ] || "";


    const transformation =
        fields[
            "Transformation & Défis"
        ] || "";


    const perspectives =
        fields[
            "Perspectives"
        ] || "";


    const interviewPerson =
        fields[
            "Interview réalisée auprès de"
        ] || "";


    const photoCredit =
        fields[
            "Photo"
        ] || "";


    const addedInfos =
        fields[
            "Added_infos"
        ] || "";


    const imageURL =
        getImageURL(fields);


    const categoryInfo =
        CATEGORIES[category] || {

            label: "L’innovation",

            className: ""
        };


    /* -----------------------------------------------------
       Construction de l'interview
    ----------------------------------------------------- */

    detailContent.innerHTML = "";


    /* -----------------------------------------------------
       EN-TÊTE
    ----------------------------------------------------- */

    const header =
        document.createElement("header");


    header.className =
        "detail-header";


    /* -----------------------------------------------------
       PASTILLE
    ----------------------------------------------------- */

    const badge =
        document.createElement("div");


    badge.className =
        `detail-badge ${categoryInfo.className}`;


    badge.textContent =
        categoryInfo.label;


    header.appendChild(badge);


    /* -----------------------------------------------------
       TITRE
    ----------------------------------------------------- */

    const title =
        document.createElement("h1");


    title.className =
        "detail-title";


    title.textContent =
        structure;


    header.appendChild(title);


    /* -----------------------------------------------------
       TAGLINE
    ----------------------------------------------------- */

    if (tagline) {

        const taglineElement =
            document.createElement("p");


        taglineElement.className =
            "detail-tagline";


        taglineElement.textContent =
            tagline;


        header.appendChild(
            taglineElement
        );
    }


    detailContent.appendChild(
        header
    );


    /* -----------------------------------------------------
       GRANDE IMAGE
    ----------------------------------------------------- */

    if (imageURL) {

        const imageWrapper =
            document.createElement("div");


        imageWrapper.className =
            "detail-image-wrapper";


        const image =
            document.createElement("img");


        image.className =
            "detail-image";


        image.src =
            imageURL;


        image.alt =
            structure;


        imageWrapper.appendChild(
            image
        );


        detailContent.appendChild(
            imageWrapper
        );
    }


    /* -----------------------------------------------------
       CONTENU DES 4 PARTIES
    ----------------------------------------------------- */

    const interviewContent =
        document.createElement("div");


    interviewContent.className =
        "interview-content";


    ajouterSectionInterview(
        interviewContent,
        "Genèse & Inspiration",
        genesis
    );


    ajouterSectionInterview(
        interviewContent,
        "Collaborations & Écosystème",
        collaboration
    );


    ajouterSectionInterview(
        interviewContent,
        "Transformation & Défis",
        transformation
    );


    ajouterSectionInterview(
        interviewContent,
        "Perspectives",
        perspectives
    );


    /* -----------------------------------------------------
       PERSONNE INTERVIEWÉE
    ----------------------------------------------------- */

    if (interviewPerson) {

        const person =
            document.createElement("p");


        person.className =
            "interview-person";


        person.textContent =
            `Interview réalisée auprès de : ${interviewPerson}`;


        interviewContent.appendChild(
            person
        );
    }


    /* -----------------------------------------------------
       CRÉDIT PHOTO
    ----------------------------------------------------- */

    if (photoCredit) {

        const credit =
            document.createElement("p");


        credit.className =
            "photo-credit";


        credit.textContent =
            `Crédit photo : ${photoCredit}`;


        interviewContent.appendChild(
            credit
        );
    }


    /* -----------------------------------------------------
       RESSOURCES
    ----------------------------------------------------- */

    if (addedInfos) {

        const resources =
            document.createElement("div");


        resources.className =
            "detail-resources";


        resources.innerHTML = `
            <h2 class="detail-resources-title">
                Pour aller plus loin
            </h2>

            <div>
                ${escapeHTML(addedInfos)}
            </div>
        `;


        interviewContent.appendChild(
            resources
        );
    }


    detailContent.appendChild(
        interviewContent
    );


    /* -----------------------------------------------------
       AFFICHAGE
    ----------------------------------------------------- */

    gallery.hidden =
        true;


    detail.hidden =
        false;


    /*
       On remonte en haut de l'iframe.
    */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   9. AJOUTER UNE SECTION D'INTERVIEW
========================================================= */

function ajouterSectionInterview(
    container,
    titre,
    texte
) {

    /*
       Si Airtable n'a pas de texte,
       on n'affiche pas la section.
    */

    if (!texte) {

        return;
    }


    const section =
        document.createElement("section");


    section.className =
        "interview-section";


    const title =
        document.createElement("h2");


    title.className =
        "interview-section-title";


    title.textContent =
        titre;


    const paragraph =
        document.createElement("p");


    paragraph.className =
        "interview-text";


    paragraph.textContent =
        texte;


    section.appendChild(
        title
    );


    section.appendChild(
        paragraph
    );


    container.appendChild(
        section
    );
}


/* =========================================================
   10. RETOUR À LA GALERIE
========================================================= */

function revenirGalerie() {

    const gallery =
        document.getElementById("gallery");


    const detail =
        document.getElementById("detail");


    detail.hidden =
        true;


    gallery.hidden =
        false;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   11. BOUTON RETOUR
========================================================= */

document
    .getElementById("back-button")
    .addEventListener(
        "click",
        revenirGalerie
    );


/* =========================================================
   12. LANCEMENT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    chargerPortraits
);
