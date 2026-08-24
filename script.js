/* =========================================================
   GALERIE — L'INNOVATION, UNE HISTOIRE COLLECTIVE
   innov'a (c) Charlotte Piau

   Création : 24 août 2026
   Last Modification : 24 août 2026
   Objet : interconnexion avec la frise
   
========================================================= */

/* =========================================================
   1. CONFIGURATION & VARIABLES GLOBALES
========================================================= */

const API_URL = "https://portaitsexpo.charlottepiau-innova.workers.dev";

// Stocke la totalité des cartes reçues d'Airtable
let allPortraits = [];

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
   3. ÉCHAPPEMENT + FORMATAGE DU TEXTE
========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatText(value) {
    const safeText = escapeHTML(value);
    return safeText
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(/\r?\n/g, "<br>");
}

/* =========================================================
   4. RÉCUPÉRER L'IMAGE AIRTABLE
========================================================= */

function getImageURL(fields) {
    const imageField = fields["Visuel"];
    if (!Array.isArray(imageField) || imageField.length === 0) return "";
    return imageField[0]?.thumbnails?.large?.url || imageField[0]?.url || "";
}

/* =========================================================
   5. CHARGEMENT DES PORTRAITS
========================================================= */

async function chargerPortraits() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = `<div class="loading">Chargement des portraits…</div>`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erreur du serveur : ${response.status}`);

        const data = await response.json();
        allPortraits = data.records || [];

        // Vérifie si un filtre est présent dans l'URL (?cat=germe)
        verifierFiltreUrl();

        // Filtre et affiche les cartes
        filtrerEtAfficher();

    } catch (error) {
        console.error("Erreur lors du chargement :", error);
        gallery.innerHTML = `
            <div class="error">
                Impossible de charger les portraits.<br>
                Veuillez réessayer dans quelques instants.
            </div>
        `;
    }
}

/* =========================================================
   6. LOGIQUE DE FILTRAGE ET RECHERCHE
========================================================= */

function filtrerEtAfficher() {
    const searchInput = document.getElementById("searchInput");
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const activeBtn = document.querySelector(".filter-btn.active");
    const selectedCat = activeBtn ? activeBtn.getAttribute("data-filter") : "all";

    const portraitsFiltres = allPortraits.filter(record => {
        const fields = record.fields || {};

        // Recherche textuelle globale
        const contentText = JSON.stringify(fields).toLowerCase();
        const matchesSearch = !searchVal || contentText.includes(searchVal);

        // Filtre de catégorie
        let rawCategory = fields["Category"] || fields["Catégory"] || "";
        if (Array.isArray(rawCategory)) rawCategory = rawCategory.join(" ");
        const category = rawCategory.toLowerCase();

        let matchesCat = false;
        if (selectedCat === "all") matchesCat = true;
        else if (selectedCat === "germe" && (category.includes("germent") || category.includes("ecoles") || category.includes("écoles"))) matchesCat = true;
        else if (selectedCat === "grandit" && (category.includes("grandit") || category.includes("centres techniques"))) matchesCat = true;
        else if (selectedCat === "forme" && (category.includes("start-up") || category.includes("startup"))) matchesCat = true;
        else if (selectedCat === "solution" && (category.includes("solution") || category.includes("entreprises"))) matchesCat = true;
        else if (selectedCat === "deploie" && (category.includes("deplo") || category.includes("dynamiques collectives"))) matchesCat = true;

        return matchesSearch && matchesCat;
    });

    afficherPortraits(portraitsFiltres);
}

function verifierFiltreUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get("cat");

    if (catParam) {
        const targetBtn = document.querySelector(`.filter-btn[data-filter="${catParam}"]`);
        if (targetBtn) {
            document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
            targetBtn.classList.add("active");
        }
    }
}

/* =========================================================
   7. AFFICHER LA GALERIE
========================================================= */

function afficherPortraits(portraits) {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = "";

    if (portraits.length === 0) {
        gallery.innerHTML = `<div class="error" style="background:transparent; text-align:center;">Aucun portrait ne correspond à votre recherche.</div>`;
        return;
    }

    portraits.sort((a, b) => {
        const panelA = Number(a.fields?.["Panel ID"]) || 9999;
        const panelB = Number(b.fields?.["Panel ID"]) || 9999;
        return panelA - panelB;
    });

    portraits.forEach(portrait => {
        const card = creerCartePortrait(portrait);
        gallery.appendChild(card);
    });
}

/* =========================================================
   8. CRÉER UNE CARTE PORTRAIT
========================================================= */

function creerCartePortrait(record) {
    const fields = record.fields || {};
    const structure = fields["Structure"] || "Structure";
    const category = fields["Category"] || fields["Catégory"] || "";
    const tagline = fields["Un mot pour vous résumer ?"] || "";
    const categoryInfo = CATEGORIES[category] || { label: "L’innovation", className: "" };
    const imageURL = getImageURL(fields);

    const card = document.createElement("article");
    card.className = "portrait-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");

    if (imageURL) {
        const image = document.createElement("img");
        image.className = "portrait-image";
        image.src = imageURL;
        image.alt = structure;
        image.loading = "lazy";
        card.appendChild(image);
    }

    const content = document.createElement("div");
    content.className = "portrait-content";

    const badge = document.createElement("div");
    badge.className = `chapter-badge ${categoryInfo.className}`;
    badge.textContent = categoryInfo.label;
    content.appendChild(badge);

    const title = document.createElement("h2");
    title.className = "portrait-title";
    title.textContent = structure;
    content.appendChild(title);

    if (tagline) {
        const taglineElement = document.createElement("p");
        taglineElement.className = "portrait-tagline";
        taglineElement.textContent = tagline;
        content.appendChild(taglineElement);
    }

    const arrow = document.createElement("span");
    arrow.className = "card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    content.appendChild(arrow);

    card.appendChild(content);

    card.addEventListener("click", () => ouvrirInterview(record));
    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            ouvrirInterview(record);
        }
    });

    return card;
}

/* =========================================================
   9. OUVRIR UNE INTERVIEW
========================================================= */

function ouvrirInterview(record) {
    const fields = record.fields || {};
    const gallery = document.getElementById("gallery");
    const detail = document.getElementById("detail");
    const detailContent = document.getElementById("detail-content");

    if (!gallery || !detail || !detailContent) return;

    const structure = fields["Structure"] || "Structure";
    const category = fields["Category"] || fields["Catégory"] || "";
    const tagline = fields["Un mot pour vous résumer ?"] || "";
    const genesis = fields["Genèse & Inspiration"] || "";
    const collaboration = fields["Collaborations & Écosystème"] || "";
    const transformation = fields["Transformation & Défis"] || "";
    const perspectives = fields["Perspectives"] || "";
    const interviewPerson = fields["Interview réalisée auprès de"] || "";
    const photoCredit = fields["Photo"] || fields["Photo credits"] || fields["Photo Credits"] || "";
    const addedInfos = fields["Added_infos"] || "";
    const imageURL = getImageURL(fields);

    const categoryInfo = CATEGORIES[category] || { label: "L’innovation", className: "" };

    detailContent.innerHTML = "";

    const header = document.createElement("header");
    header.className = "detail-header";

    const badge = document.createElement("div");
    badge.className = `detail-badge ${categoryInfo.className}`;
    badge.textContent = categoryInfo.label;
    header.appendChild(badge);

    const title = document.createElement("h1");
    title.className = `detail-title ${categoryInfo.className}`;
    title.textContent = structure;
    header.appendChild(title);

    if (tagline) {
        const taglineElement = document.createElement("p");
        taglineElement.className = "detail-tagline";
        taglineElement.textContent = tagline;
        header.appendChild(taglineElement);
    }

    detailContent.appendChild(header);

    if (imageURL) {
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "detail-image-wrapper";

        const image = document.createElement("img");
        image.className = "detail-image";
        image.src = imageURL;
        image.alt = structure;
        image.loading = "eager";

        imageWrapper.appendChild(image);
        detailContent.appendChild(imageWrapper);
    }

    const interviewContent = document.createElement("div");
    interviewContent.className = "interview-content";

    ajouterSectionInterview(interviewContent, "Genèse & Inspiration", genesis);
    ajouterSectionInterview(interviewContent, "Collaborations & Écosystème", collaboration);
    ajouterSectionInterview(interviewContent, "Transformation & Défis", transformation);
    ajouterSectionInterview(interviewContent, "Perspectives", perspectives);

    if (interviewPerson) {
        const person = document.createElement("p");
        person.className = "interview-person";
        person.innerHTML = `Interview réalisée auprès de : ${formatText(interviewPerson)}`;
        interviewContent.appendChild(person);
    }

    if (photoCredit) {
        const credit = document.createElement("p");
        credit.className = "photo-credit";
        credit.textContent = `Crédit photo : ${photoCredit}`;
        interviewContent.appendChild(credit);
    }

    if (addedInfos) {
        const resources = document.createElement("div");
        resources.className = "detail-resources";
        resources.innerHTML = `
            <h2 class="detail-resources-title">Pour aller plus loin</h2>
            <div>${escapeHTML(addedInfos)}</div>
        `;
        interviewContent.appendChild(resources);
    }

    detailContent.appendChild(interviewContent);

    gallery.hidden = false;
    detail.hidden = false;

    document.body.classList.add("detail-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   10. AJOUTER UNE SECTION D'INTERVIEW
========================================================= */

function ajouterSectionInterview(container, titre, texte) {
    if (texte === null || texte === undefined || String(texte).trim() === "") return;

    const section = document.createElement("section");
    section.className = "interview-section";

    const title = document.createElement("h2");
    title.className = "interview-section-title";
    title.textContent = titre;

    const paragraph = document.createElement("p");
    paragraph.className = "interview-text";
    paragraph.innerHTML = formatText(texte);

    section.appendChild(title);
    section.appendChild(paragraph);
    container.appendChild(section);
}

/* =========================================================
   11. RETOUR À LA GALERIE
========================================================= */

function revenirGalerie() {
    const gallery = document.getElementById("gallery");
    const detail = document.getElementById("detail");

    if (!gallery || !detail) return;

    detail.hidden = true;
    gallery.hidden = false;

    document.body.classList.remove("detail-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   12. ÉCOUTEURS D'ÉVÉNEMENTS
========================================================= */

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const detail = document.getElementById("detail");
        if (detail && !detail.hidden) revenirGalerie();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const backButton = document.getElementById("back-button");
    if (backButton) {
        backButton.addEventListener("click", revenirGalerie);
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filtrerEtAfficher);
    }

    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            filterButtons.forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            filtrerEtAfficher();
        });
    });

    chargerPortraits();
});
