const CLE_BDD = "ws_employes_fr_v1";

const CONFIG_ROLES = {
  Réceptionniste: { icone: "fa-bell-concierge", couleur: "#a2845e" },
  "Technicien IT": { icone: "fa-server", couleur: "#8e8e93" },
  "Agent de Sécurité": { icone: "fa-shield-halved", couleur: "#636366" },
  Manager: { icone: "fa-user-tie", couleur: "#32d74b" },
  "Agent d'Entretien": { icone: "fa-broom", couleur: "#64d2ff" },
  Développeur: { icone: "fa-code", couleur: "#0a84ff" },
  RH: { icone: "fa-users", couleur: "#bf5af2" },
};

const CONFIG_ZONES = {
  conference: { nom: "Conférence", max: 10, restreint: [] },
  reception: {
    nom: "Réception",
    max: 2,
    restreint: ["Réceptionniste", "Manager", "Agent d'Entretien"],
  },
  serveurs: {
    nom: "Serveurs",
    max: 2,
    restreint: ["Technicien IT", "Manager", "Agent d'Entretien"],
  },
  securite: {
    nom: "Sécurité",
    max: 2,
    restreint: ["Agent de Sécurité", "Manager", "Agent d'Entretien"],
  },
  personnel: { nom: "Salle de Pause", max: 15, restreint: [] },
  archives: {
    nom: "Archives",
    max: 2,
    restreint: [
      "Réceptionniste",
      "Technicien IT",
      "Agent de Sécurité",
      "Manager",
      "Développeur",
      "RH",
    ],
  },
};

const DONNEES_INITIALES = [
  {
    id: "1",
    nom: "Alice Dupont",
    role: "Réceptionniste",
    emplacement: "reception",
    email: "alice@ws.com",
    tel: "0601010101",
    photo: "",
    exps: [],
  },
  {
    id: "2",
    nom: "Bob Martin",
    role: "Technicien IT",
    emplacement: "serveurs",
    email: "bob@ws.com",
    tel: "0602020202",
    photo: "",
    exps: [],
  },
  {
    id: "3",
    nom: "Charlie Secur",
    role: "Agent de Sécurité",
    emplacement: "securite",
    email: "charlie@ws.com",
    tel: "0603030303",
    photo: "",
    exps: [],
  },
  {
    id: "4",
    nom: "Diana Boss",
    role: "Manager",
    emplacement: "conference",
    email: "diana@ws.com",
    tel: "0604040404",
    photo: "",
    exps: [],
  },
  {
    id: "5",
    nom: "Evan Dev",
    role: "Développeur",
    emplacement: "non_assigne",
    email: "evan@ws.com",
    tel: "0605050505",
    photo: "",
    exps: [],
  },
];

let employes = [];
let idGlissement = null;
let idProfilCourant = null;

function initialiserApp() {
  const select = document.getElementById("emp-role");
  if (select.options.length <= 1) {
    Object.keys(CONFIG_ROLES).forEach((role) => {
      const opt = document.createElement("option");
      opt.value = role;
      opt.innerText = role;
      select.appendChild(opt);
    });
  }
  chargerDonnees();
}

function chargerDonnees() {
  const stocke = localStorage.getItem(CLE_BDD);
  if (stocke) {
    employes = JSON.parse(stocke);
  } else {
    employes = JSON.parse(JSON.stringify(DONNEES_INITIALES));
    sauvegarderDonnees();
  }
  afficherApplication();
}

function sauvegarderDonnees() {
  localStorage.setItem(CLE_BDD, JSON.stringify(employes));
}

function obtenirEmployeParId(id) {
  return employes.find((e) => e.id === id);
}

function ajouterEmploye(emp) {
  employes.push(emp);
  sauvegarderDonnees();
  afficherApplication();
}

function mettreAJourEmploye(id, donnees) {
  const idx = employes.findIndex((e) => e.id === id);
  if (idx !== -1) {
    employes[idx] = { ...employes[idx], ...donnees };
    sauvegarderDonnees();
    afficherApplication();
  }
}

function supprimerEmploye(id) {
  employes = employes.filter((e) => e.id !== id);
  sauvegarderDonnees();
  afficherApplication();
}

function deplacerEmploye(id, nouvelleZoneId) {
  const emp = obtenirEmployeParId(id);
  if (emp) {
    emp.emplacement = nouvelleZoneId;
    sauvegarderDonnees();
    afficherApplication();
  }
}

function validerDeplacement(empId, zoneId) {
  if (zoneId === "non_assigne") return { valide: true };
  const emp = obtenirEmployeParId(empId);
  if (!emp) return { valide: false, msg: "Employé introuvable" };

  const regleZone = CONFIG_ZONES[zoneId];
  const compte = employes.filter((e) => e.emplacement === zoneId).length;

  if (emp.emplacement !== zoneId && compte >= regleZone.max) {
    return {
      valide: false,
      msg: `La zone ${regleZone.nom} est pleine (Max ${regleZone.max}).`,
    };
  }

  if (emp.role === "Manager") return { valide: true };

  if (zoneId === "archives" && emp.role === "Agent d'Entretien") {
    return { valide: false, msg: "Accès Refusé : Archives." };
  }

  if (
    regleZone.restreint.length > 0 &&
    !regleZone.restreint.includes(emp.role)
  ) {
    return {
      valide: false,
      msg: `Rôle ${emp.role} non autorisé pour ${regleZone.nom}`,
    };
  }
  return { valide: true };
}

function reinitialiserSimulation() {
  if (confirm("Réinitialiser toutes les données par défaut ?")) {
    localStorage.removeItem(CLE_BDD);
    initialiserApp();
  }
}

function afficherApplication(texteFiltre = "") {
  document
    .querySelectorAll(".conteneur-jetons")
    .forEach((el) => (el.innerHTML = ""));
  const zoneNonAssigne = document.getElementById("zone-non-assigne");
  zoneNonAssigne.innerHTML = "";

  const filtre = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(texteFiltre.toLowerCase()) ||
      e.role.toLowerCase().includes(texteFiltre.toLowerCase())
  );

  document.getElementById("compteur-non-assignes").innerText = filtre.filter(
    (e) => e.emplacement === "non_assigne"
  ).length;

  filtre.forEach((emp) => {
    if (emp.emplacement === "non_assigne") {
      zoneNonAssigne.appendChild(creerElementListe(emp));
    } else {
      const conteneur = document.getElementById(`conteneur-${emp.emplacement}`);
      if (conteneur) conteneur.appendChild(creerJeton(emp));
    }
  });

  verifierZonesObligatoires();
}

function filtrerVue(texte) {
  afficherApplication(texte);
}

function creerJeton(emp) {
  const div = document.createElement("div");
  div.className = "jeton";
  const urlPhoto =
    emp.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.nom
    )}&background=random&color=fff&bold=true`;
  div.style.backgroundImage = `url('${urlPhoto}')`;
  div.draggable = true;
  div.dataset.id = emp.id;

  div.ondragstart = gererDebutGlissement;
  div.onclick = () => ouvrirProfil(emp.id);

  const configRole = CONFIG_ROLES[emp.role] || {
    icone: "fa-user",
    couleur: "#8e8e93",
  };

  div.innerHTML = `
        <div class="badge-jeton" style="border-color: rgba(0,0,0,0.1); color: ${configRole.couleur}">
            <i class="fa-solid ${configRole.icone}"></i>
        </div>
        <div class="suppr-jeton" onclick="event.stopPropagation(); deplacerEmploye('${emp.id}', 'non_assigne')">
            <i class="fa-solid fa-xmark"></i>
        </div>
    `;
  return div;
}

function creerElementListe(emp) {
  const div = document.createElement("div");
  div.className = "element-non-assigne group";
  div.draggable = true;
  div.dataset.id = emp.id;
  div.ondragstart = gererDebutGlissement;
  div.onclick = () => ouvrirModale("edition", emp.id);

  const urlPhoto =
    emp.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.nom
    )}&background=random&color=fff`;

  div.innerHTML = `
        <img src="${urlPhoto}" alt="${emp.nom}">
        <div class="flex-1 min-w-0">
            <div class="u-nom truncate group-hover:text-black transition-colors">${emp.nom}</div>
            <div class="u-role">${emp.role}</div>
        </div>
        <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-apple-brown group-hover:text-white transition-all">
                <i class="fa-solid fa-pen text-[10px]"></i>
        </div>
    `;
  return div;
}

function verifierZonesObligatoires() {
  const obligatoires = ["reception", "securite"];
  obligatoires.forEach((z) => {
    const el = document.getElementById(`zone-${z}`);
    const compte = employes.filter((e) => e.emplacement === z).length;
    if (compte === 0) el.classList.add("vide-requise");
    else el.classList.remove("vide-requise");
  });
}

function notifier(msg, type = "info") {
  const div = document.createElement("div");
  const couleurs = {
    error: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-orange-500 text-white",
    info: "bg-gray-900 text-white",
  };
  div.className = `fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-xs font-medium z-[60] tracking-wide transition-all duration-500 translate-y-10 opacity-0 flex items-center gap-2 backdrop-blur-md ${
    couleurs[type] || couleurs["info"]
  }`;
  div.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${msg}`;
  document.body.appendChild(div);
  requestAnimationFrame(() =>
    div.classList.remove("translate-y-10", "opacity-0")
  );
  setTimeout(() => {
    div.classList.add("translate-y-10", "opacity-0");
    setTimeout(() => div.remove(), 500);
  }, 3000);
}

function gererDebutGlissement(e) {
  idGlissement = e.target.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", idGlissement);
}

function gererSurvol(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  if (!zone.classList.contains("glisser-dessus"))
    zone.classList.add("glisser-dessus");
}

document.addEventListener("dragleave", (e) => {
  if (e.target.classList && e.target.classList.contains("zone-droppable")) {
    e.target.classList.remove("glisser-dessus");
  }
});

function gererDepot(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove("glisser-dessus");

  const zoneId = zone.dataset.zone;
  if (!idGlissement) return;

  const validation = validerDeplacement(idGlissement, zoneId);

  if (validation.valide) {
    deplacerEmploye(idGlissement, zoneId);
  } else {
    notifier(validation.msg, "error");
    zone.classList.add("depot-invalide");
    setTimeout(() => zone.classList.remove("depot-invalide"), 500);
  }
  idGlissement = null;
}

function repartitionAuto() {
  const obligatoires = ["reception", "serveurs", "securite"];

  employes.forEach((emp) => {
    let place = false;
    for (let z of obligatoires) {
      if (validerDeplacement(emp.id, z).valide && Math.random() > 0.4) {
        const compte = employes.filter((e) => e.emplacement === z).length;
        const max = CONFIG_ZONES[z].max;
        if (compte < max) {
          emp.emplacement = z;
          place = true;
          break;
        }
      }
    }
    if (!place) {
      const ouvertes = ["conference", "personnel", "archives"];
      const zoneAleatoire =
        ouvertes[Math.floor(Math.random() * ouvertes.length)];
      if (validerDeplacement(emp.id, zoneAleatoire).valide) {
        emp.emplacement = zoneAleatoire;
      } else {
        emp.emplacement = "non_assigne";
      }
    }
  });
  sauvegarderDonnees();
  afficherApplication();
  notifier("Organisation automatique terminée", "success");
}

function ajoutRapide(zoneId) {
  const compteActuel = employes.filter((e) => e.emplacement === zoneId).length;
  const max = CONFIG_ZONES[zoneId].max;

  if (compteActuel >= max) {
    notifier(`Zone ${CONFIG_ZONES[zoneId].nom} pleine (Max ${max}).`, "error");
    return;
  }

  const eligible = employes.filter(
    (e) =>
      e.emplacement === "non_assigne" && validerDeplacement(e.id, zoneId).valide
  );

  if (eligible.length === 0) {
    notifier("Aucun employé éligible disponible.", "warning");
    return;
  }

  deplacerEmploye(eligible[0].id, zoneId);
  notifier(
    `${eligible[0].nom} assigné à ${CONFIG_ZONES[zoneId].nom}`,
    "success"
  );
}

function ouvrirModale(mode, id = null) {
  const modale = document.getElementById("modale-employe");
  modale.classList.add("actif");
  document.getElementById("formulaire-employe").reset();
  document.getElementById("conteneur-experiences").innerHTML = "";
  document.getElementById("emp-id").value = "";
  document.getElementById("apercu-photo").src = "";

  if (mode === "edition" && id) {
    document.getElementById("titre-modale").innerText = "Modifier Employé";
    document.getElementById("emp-id").value = id;
    const emp = obtenirEmployeParId(id);
    if (emp) {
      document.getElementById("emp-nom").value = emp.nom;
      document.getElementById("emp-role").value = emp.role;
      document.getElementById("emp-email").value = emp.email;
      document.getElementById("emp-tel").value = emp.tel;
      document.getElementById("emp-photo").value = emp.photo || "";
      mettreAJourApercu();
      if (emp.exps) emp.exps.forEach((exp) => ajouterChampExperience(exp));
    }
  } else {
    document.getElementById("titre-modale").innerText = "Nouvel Employé";
    ajouterChampExperience();
  }
}

function fermerModale(type) {
  const id = type === "employe" ? "modale-employe" : "modale-profil";
  document.getElementById(id).classList.remove("actif");
}

function gererSoumissionFormulaire(e) {
  e.preventDefault();
  const id = document.getElementById("emp-id").value;
  const nom = document.getElementById("emp-nom").value;
  const role = document.getElementById("emp-role").value;
  const email = document.getElementById("emp-email").value;
  const tel = document.getElementById("emp-tel").value;
  const photo = document.getElementById("emp-photo").value;

  // Validation
  let valide = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("err-email").classList.remove("hidden");
    valide = false;
  } else document.getElementById("err-email").classList.add("hidden");

  if (!/^\d{10}$/.test(tel.replace(/\s/g, ""))) {
    document.getElementById("err-tel").classList.remove("hidden");
    valide = false;
  } else document.getElementById("err-tel").classList.add("hidden");

  if (!valide) return;

  // Validation des Expériences
  const exps = [];
  const elementsExp = document.querySelectorAll(".element-exp");
  let erreurDate = false;

  elementsExp.forEach((item) => {
    const titre = item.querySelector(".exp-titre").value;
    const debut = item.querySelector(".exp-debut").value;
    const fin = item.querySelector(".exp-fin").value;

    if (debut && fin) {
      if (new Date(debut) > new Date(fin)) {
        erreurDate = true;
        item.querySelector(".exp-debut").classList.add("border-red-500");
        item.querySelector(".exp-fin").classList.add("border-red-500");
      } else {
        item.querySelector(".exp-debut").classList.remove("border-red-500");
        item.querySelector(".exp-fin").classList.remove("border-red-500");
      }
    }
    exps.push({ titre, debut, fin });
  });

  if (erreurDate) {
    alert("La date de début ne peut pas être après la date de fin.");
    return;
  }

  const donneesEmp = { nom, role, email, tel, photo, exps };

  if (id) {
    mettreAJourEmploye(id, donneesEmp);
  } else {
    ajouterEmploye({
      id: crypto.randomUUID(),
      emplacement: "non_assigne",
      ...donneesEmp,
    });
  }
  fermerModale("employe");
}

function ajouterChampExperience(donnees = { titre: "", debut: "", fin: "" }) {
  const div = document.createElement("div");
  div.className =
    "element-exp flex gap-3 mb-3 items-start p-3 bg-white rounded-xl border border-gray-200";
  div.innerHTML = `
        <div class="flex-1 grid grid-cols-1 gap-3">
            <input type="text" placeholder="Intitulé du poste" class="exp-titre champ-formulaire w-full px-3 py-2 text-xs" value="${donnees.titre}" required>
            <div class="flex gap-3">
                <input type="date" class="exp-debut champ-formulaire w-1/2 px-3 py-2 text-xs" value="${donnees.debut}" required>
                <input type="date" class="exp-fin champ-formulaire w-1/2 px-3 py-2 text-xs" value="${donnees.fin}">
            </div>
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="text-gray-400 hover:text-red-500 mt-1 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
    `;
  document.getElementById("conteneur-experiences").appendChild(div);
}

function mettreAJourApercu() {
  const url = document.getElementById("emp-photo").value;
  const nom = document.getElementById("emp-nom").value || "?";
  const apercu = document.getElementById("apercu-photo");
  apercu.src =
    url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nom
    )}&background=random&color=fff`;
  apercu.onerror = () => {
    apercu.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nom
    )}&background=random&color=fff`;
  };
}

function ouvrirProfil(id) {
  idProfilCourant = id;
  const emp = obtenirEmployeParId(id);
  if (!emp) return;

  const modale = document.getElementById("modale-profil");
  document.getElementById("prof-nom").innerText = emp.nom;
  document.getElementById("prof-role").innerText = emp.role;
  document.getElementById("prof-email").innerText = emp.email;
  document.getElementById("prof-tel").innerText = emp.tel;

  const urlPhoto =
    emp.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.nom
    )}&background=random&color=fff`;
  document.getElementById("prof-photo").src = urlPhoto;

  const conteneurExp = document.getElementById("prof-experiences");
  conteneurExp.innerHTML = "";
  if (emp.exps && emp.exps.length > 0) {
    emp.exps.forEach((exp) => {
      conteneurExp.innerHTML += `
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div class="font-semibold text-gray-800 text-xs mb-0.5">${
                      exp.titre
                    }</div>
                    <div class="text-[10px] text-gray-500">${exp.debut} — ${
        exp.fin || "Présent"
      }</div>
                </div>`;
    });
  } else {
    conteneurExp.innerHTML =
      '<span class="text-gray-400 italic text-xs">Aucun historique enregistré.</span>';
  }

  modale.classList.add("actif");
}

function retirerProfilCourant() {
  if (idProfilCourant) {
    deplacerEmploye(idProfilCourant, "non_assigne");
    fermerModale("profil");
  }
}

function supprimerProfilCourant() {
  if (idProfilCourant && confirm("Supprimer définitivement cet employé ?")) {
    supprimerEmploye(idProfilCourant);
    fermerModale("profil");
  }
}

initialiserApp();
