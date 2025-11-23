/**
 * GLOBAL CONSTANTS & STATE
 */
const DB_KEY = "ws_employees_light_v5";

const ROLES_CONFIG = {
  Receptionist: { icon: "fa-bell-concierge", color: "#a2845e" },
  "IT Technician": { icon: "fa-server", color: "#8e8e93" },
  "Security Agent": { icon: "fa-shield-halved", color: "#636366" },
  Manager: { icon: "fa-user-tie", color: "#32d74b" },
  Cleaner: { icon: "fa-broom", color: "#64d2ff" },
  Developer: { icon: "fa-code", color: "#0a84ff" },
  HR: { icon: "fa-users", color: "#bf5af2" },
};

const ZONES_CONFIG = {
  conference: { name: "Conference", max: 10, restricted: [] },
  reception: {
    name: "Reception",
    max: 2,
    restricted: ["Receptionist", "Manager", "Cleaner"],
  },
  servers: {
    name: "Servers",
    max: 2,
    restricted: ["IT Technician", "Manager", "Cleaner"],
  },
  security: {
    name: "Security",
    max: 2,
    restricted: ["Security Agent", "Manager", "Cleaner"],
  },
  staff: { name: "Staff Lounge", max: 15, restricted: [] },
  vault: {
    name: "Vault",
    max: 2,
    restricted: [
      "Receptionist",
      "IT Technician",
      "Security Agent",
      "Manager",
      "Developer",
      "HR",
    ],
  },
};

const INITIAL_DATA = [
  {
    id: "1",
    name: "Alice Dupont",
    role: "Receptionist",
    location: "reception",
    email: "alice@ws.com",
    phone: "0601010101",
    photo: "",
    exps: [],
  },
  {
    id: "2",
    name: "Bob Martin",
    role: "IT Technician",
    location: "servers",
    email: "bob@ws.com",
    phone: "0602020202",
    photo: "",
    exps: [],
  },
  {
    id: "3",
    name: "Charlie Security",
    role: "Security Agent",
    location: "security",
    email: "charlie@ws.com",
    phone: "0603030303",
    photo: "",
    exps: [],
  },
  {
    id: "4",
    name: "Diana Boss",
    role: "Manager",
    location: "conference",
    email: "diana@ws.com",
    phone: "0604040404",
    photo: "",
    exps: [],
  },
  {
    id: "5",
    name: "Evan Dev",
    role: "Developer",
    location: "unassigned",
    email: "evan@ws.com",
    phone: "0605050505",
    photo: "",
    exps: [],
  },
];

let employees = [];
let draggedId = null;
let currentProfileId = null; // Track opened profile for actions

/**
 * DATA FUNCTIONS
 */
function initApp() {
  // Fill Role Select
  const select = document.getElementById("emp-role");
  if (select.options.length <= 1) {
    // Only fill if empty (apart from placeholder)
    Object.keys(ROLES_CONFIG).forEach((role) => {
      const opt = document.createElement("option");
      opt.value = role;
      opt.innerText = role;
      select.appendChild(opt);
    });
  }

  loadData();
}

function loadData() {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    employees = JSON.parse(stored);
  } else {
    employees = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveData();
  }
  renderApp();
}

function saveData() {
  localStorage.setItem(DB_KEY, JSON.stringify(employees));
}

function getEmployeeById(id) {
  return employees.find((e) => e.id === id);
}

function addEmployee(emp) {
  employees.push(emp);
  saveData();
  renderApp();
}

function updateEmployee(id, data) {
  const idx = employees.findIndex((e) => e.id === id);
  if (idx !== -1) {
    employees[idx] = { ...employees[idx], ...data };
    saveData();
    renderApp();
  }
}

function deleteEmployee(id) {
  employees = employees.filter((e) => e.id !== id);
  saveData();
  renderApp();
}

function moveEmployee(id, newZoneId) {
  const emp = getEmployeeById(id);
  if (emp) {
    emp.location = newZoneId;
    saveData();
    renderApp();
  }
}

function validateMove(empId, zoneId) {
  if (zoneId === "unassigned") return { valid: true };
  const emp = getEmployeeById(empId);
  if (!emp) return { valid: false, msg: "Employee not found" };

  const zoneRule = ZONES_CONFIG[zoneId];
  const count = employees.filter((e) => e.location === zoneId).length;

  // Capacity
  if (count >= zoneRule.max && emp.location !== zoneId) {
    return { valid: false, msg: `Zone ${zoneRule.name} is full.` };
  }

  // Role Rules
  if (emp.role === "Manager") return { valid: true };

  if (zoneId === "vault" && emp.role === "Cleaner") {
    return { valid: false, msg: "Access Denied: Vault." };
  }

  if (
    zoneRule.restricted.length > 0 &&
    !zoneRule.restricted.includes(emp.role)
  ) {
    return {
      valid: false,
      msg: `Role ${emp.role} not authorized for ${zoneRule.name}`,
    };
  }
  return { valid: true };
}

function resetSimulation() {
  if (confirm("Reset all data to default?")) {
    localStorage.removeItem(DB_KEY);
    initApp();
  }
}

/**
 * UI RENDER FUNCTIONS
 */
function renderApp(filterText = "") {
  // Clear Zones
  document
    .querySelectorAll(".token-container")
    .forEach((el) => (el.innerHTML = ""));
  const unassignedZone = document.getElementById("unassigned-zone");
  unassignedZone.innerHTML = "";

  // Filter
  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(filterText.toLowerCase()) ||
      e.role.toLowerCase().includes(filterText.toLowerCase())
  );

  // Update Count
  document.getElementById("unassigned-count").innerText = filtered.filter(
    (e) => e.location === "unassigned"
  ).length;

  // Render Items
  filtered.forEach((emp) => {
    if (emp.location === "unassigned") {
      unassignedZone.appendChild(createListItem(emp));
    } else {
      const container = document.getElementById(`container-${emp.location}`);
      if (container) container.appendChild(createToken(emp));
    }
  });

  // Check Mandatory Zones
  checkMandatoryZones();
}

function filterView(text) {
  renderApp(text);
}

function createToken(emp) {
  const div = document.createElement("div");
  div.className = "token";
  const photoUrl =
    emp.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.name
    )}&background=random&color=fff&bold=true`;
  div.style.backgroundImage = `url('${photoUrl}')`;
  div.draggable = true;
  div.dataset.id = emp.id;

  // Drag Events
  div.ondragstart = handleDragStart;
  div.onclick = () => openProfile(emp.id);

  const roleConfig = ROLES_CONFIG[emp.role] || {
    icon: "fa-user",
    color: "#8e8e93",
  };

  div.innerHTML = `
                <div class="token-badge" style="border-color: rgba(0,0,0,0.1); color: ${roleConfig.color}">
                    <i class="fa-solid ${roleConfig.icon}"></i>
                </div>
                <div class="token-remove" onclick="event.stopPropagation(); moveEmployee('${emp.id}', 'unassigned')">
                    <i class="fa-solid fa-xmark"></i>
                </div>
            `;
  return div;
}

function createListItem(emp) {
  const div = document.createElement("div");
  div.className = "unassigned-item group";
  div.draggable = true;
  div.dataset.id = emp.id;
  div.ondragstart = handleDragStart;
  div.onclick = () => openModal("edit", emp.id);

  const photoUrl =
    emp.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.name
    )}&background=random&color=fff`;

  div.innerHTML = `
                <img src="${photoUrl}" alt="${emp.name}">
                <div class="flex-1 min-w-0">
                    <div class="u-name truncate group-hover:text-black transition-colors">${emp.name}</div>
                    <div class="u-role">${emp.role}</div>
                </div>
                <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-apple-brown group-hover:text-white transition-all">
                     <i class="fa-solid fa-pen text-[10px]"></i>
                </div>
            `;
  return div;
}

function checkMandatoryZones() {
  const mandatory = ["reception", "security"];
  mandatory.forEach((z) => {
    const el = document.getElementById(`zone-${z}`);
    const count = employees.filter((e) => e.location === z).length;
    if (count === 0) el.classList.add("required-empty");
    else el.classList.remove("required-empty");
  });
}

function toast(msg, type = "info") {
  const div = document.createElement("div");
  const colors = {
    error: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-orange-500 text-white",
    info: "bg-gray-900 text-white",
  };
  div.className = `fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-xs font-medium z-[60] tracking-wide transition-all duration-500 translate-y-10 opacity-0 flex items-center gap-2 backdrop-blur-md ${
    colors[type] || colors["info"]
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

/**
 * INTERACTION & EVENT HANDLERS
 */
function handleDragStart(e) {
  draggedId = e.target.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedId);
}

function handleDragOver(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  if (!zone.classList.contains("drag-over")) zone.classList.add("drag-over");
}

// Global dragleave listener handles removal of class
document.addEventListener("dragleave", (e) => {
  if (e.target.classList && e.target.classList.contains("zone-droppable")) {
    e.target.classList.remove("drag-over");
  }
});

function handleDrop(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove("drag-over");

  const zoneId = zone.dataset.zone;
  if (!draggedId) return;

  const validation = validateMove(draggedId, zoneId);

  if (validation.valid) {
    moveEmployee(draggedId, zoneId);
  } else {
    toast(validation.msg, "error");
    zone.classList.add("invalid-drop");
    setTimeout(() => zone.classList.remove("invalid-drop"), 500);
  }
  draggedId = null;
}

function autoOrganize() {
  const mandatory = ["reception", "servers", "security"];

  employees.forEach((emp) => {
    let placed = false;

    // 1. Mandatory Zones Priority
    for (let z of mandatory) {
      if (validateMove(emp.id, z).valid && Math.random() > 0.4) {
        // Re-check count inside loop
        const count = employees.filter((e) => e.location === z).length;
        const max = ZONES_CONFIG[z].max;
        if (count < max) {
          emp.location = z;
          placed = true;
          break;
        }
      }
    }

    // 2. Random other zones
    if (!placed) {
      const open = ["conference", "staff", "vault"];
      const randomZone = open[Math.floor(Math.random() * open.length)];
      if (validateMove(emp.id, randomZone).valid) {
        emp.location = randomZone;
      } else {
        emp.location = "unassigned";
      }
    }
  });

  saveData();
  renderApp();
  toast("Auto-Organization Complete", "success");
}

function openQuickAdd(zoneId) {
  // Find first eligible unassigned person
  const eligible = employees.filter(
    (e) => e.location === "unassigned" && validateMove(e.id, zoneId).valid
  );

  if (eligible.length === 0) {
    toast("No eligible staff available.", "warning");
    return;
  }

  // Move the first one
  moveEmployee(eligible[0].id, zoneId);
  toast(
    `${eligible[0].name} assigned to ${ZONES_CONFIG[zoneId].name}`,
    "success"
  );
}

/**
 * MODAL HANDLERS
 */
function openModal(mode, id = null) {
  const modal = document.getElementById("modal-employee");
  modal.classList.add("active");
  document.getElementById("employee-form").reset();
  document.getElementById("experiences-container").innerHTML = "";
  document.getElementById("emp-id").value = "";
  document.getElementById("preview-photo").src = "";

  if (mode === "edit" && id) {
    document.getElementById("modal-title").innerText = "Edit Personnel";
    document.getElementById("emp-id").value = id;
    const emp = getEmployeeById(id);
    if (emp) {
      document.getElementById("emp-name").value = emp.name;
      document.getElementById("emp-role").value = emp.role;
      document.getElementById("emp-email").value = emp.email;
      document.getElementById("emp-phone").value = emp.phone;
      document.getElementById("emp-photo").value = emp.photo || "";
      updatePhotoPreview();
      if (emp.exps) emp.exps.forEach((exp) => addExperienceField(exp));
    }
  } else {
    document.getElementById("modal-title").innerText = "New Personnel";
    addExperienceField();
  }
}

function closeModal(type) {
  const id = type === "employee" ? "modal-employee" : "modal-profile";
  document.getElementById(id).classList.remove("active");
}

function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("emp-id").value;
  const name = document.getElementById("emp-name").value;
  const role = document.getElementById("emp-role").value;
  const email = document.getElementById("emp-email").value;
  const phone = document.getElementById("emp-phone").value;
  const photo = document.getElementById("emp-photo").value;

  // Basic Validation
  let valid = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("err-email").classList.remove("hidden");
    valid = false;
  } else document.getElementById("err-email").classList.add("hidden");

  if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
    document.getElementById("err-phone").classList.remove("hidden");
    valid = false;
  } else document.getElementById("err-phone").classList.add("hidden");

  if (!valid) return;

  // Experiences
  const exps = [];
  document.querySelectorAll(".exp-item").forEach((item) => {
    exps.push({
      title: item.querySelector(".exp-title").value,
      start: item.querySelector(".exp-start").value,
      end: item.querySelector(".exp-end").value,
    });
  });

  const empData = { name, role, email, phone, photo, exps };

  if (id) {
    updateEmployee(id, empData);
  } else {
    addEmployee({
      id: crypto.randomUUID(),
      location: "unassigned",
      ...empData,
    });
  }
  closeModal("employee");
}

function addExperienceField(data = { title: "", start: "", end: "" }) {
  const div = document.createElement("div");
  div.className =
    "exp-item flex gap-3 mb-3 items-start p-3 bg-white rounded-xl border border-gray-200";
  div.innerHTML = `
                <div class="flex-1 grid grid-cols-1 gap-3">
                    <input type="text" placeholder="Job Title" class="exp-title form-input w-full px-3 py-2 text-xs" value="${data.title}" required>
                    <div class="flex gap-3">
                        <input type="date" class="exp-start form-input w-1/2 px-3 py-2 text-xs" value="${data.start}" required>
                        <input type="date" class="exp-end form-input w-1/2 px-3 py-2 text-xs" value="${data.end}">
                    </div>
                </div>
                <button type="button" onclick="this.parentElement.remove()" class="text-gray-400 hover:text-red-500 mt-1 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
            `;
  document.getElementById("experiences-container").appendChild(div);
}

function updatePhotoPreview() {
  const url = document.getElementById("emp-photo").value;
  const name = document.getElementById("emp-name").value || "?";
  const preview = document.getElementById("preview-photo");
  preview.src =
    url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&color=fff`;
  preview.onerror = () => {
    preview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&color=fff`;
  };
}

function openProfile(id) {
  currentProfileId = id;
  const emp = getEmployeeById(id);
  if (!emp) return;

  const modal = document.getElementById("modal-profile");
  document.getElementById("prof-name").innerText = emp.name;
  document.getElementById("prof-role").innerText = emp.role;
  document.getElementById("prof-email").innerText = emp.email;
  document.getElementById("prof-phone").innerText = emp.phone;

  const photoUrl =
    emp.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.name
    )}&background=random&color=fff`;
  document.getElementById("prof-photo").src = photoUrl;

  const expContainer = document.getElementById("prof-experiences");
  expContainer.innerHTML = "";
  if (emp.exps && emp.exps.length > 0) {
    emp.exps.forEach((exp) => {
      expContainer.innerHTML += `
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div class="font-semibold text-gray-800 text-xs mb-0.5">${
                              exp.title
                            }</div>
                            <div class="text-[10px] text-gray-500">${
                              exp.start
                            } — ${exp.end || "Present"}</div>
                        </div>`;
    });
  } else {
    expContainer.innerHTML =
      '<span class="text-gray-400 italic text-xs">No history recorded.</span>';
  }

  modal.classList.add("active");
}

function unassignCurrentProfile() {
  if (currentProfileId) {
    moveEmployee(currentProfileId, "unassigned");
    closeModal("profile");
  }
}

function deleteCurrentProfile() {
  if (currentProfileId && confirm("Permanently delete this record?")) {
    deleteEmployee(currentProfileId);
    closeModal("profile");
  }
}

// Init
initApp();
