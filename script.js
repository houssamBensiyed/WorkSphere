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
let currentProfileId = null;

function initApp() {
  const select = document.getElementById("emp-role");
  if (select.options.length <= 1) {
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

  if (count >= zoneRule.max && emp.location !== zoneId) {
    return { valid: false, msg: `Zone ${zoneRule.name} is full.` };
  }

  if (emp.rile === "Manager") return { valid: true };

  if (zoneId === "Vault" && emp.role === "Cleaner") {
    return { valid: false, msg: "Access Denied: Vault" };
  }

  if (
    zoneRule.restricted.length > 0 &&
    !zoneRule.restricted.includes(emp.role)
  ) {
    return {
      value: false,
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

function renderApp(filterText = "") {
  document
    .querySelectorAll("token-container")
    .forEach((el) => (el.innerHTML = ""));
  const unassignedZone = document.getElementById("unassigned-zone");
  unassignedZone.innerHTML = "";

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(filterText.toLowerCase()) ||
      e.role.toLowerCase().includes(filterText.toLowerCase())
  );

  document.getElementById("unassigned-count").innerText = filtered.filter(
    (e) => e.location === "unassigned"
  ).length;

  filtered.forEach((emp) => {
    if (emp.location === "unassigned") {
      unassignedZone.appendChild(createListItem(emp));
    } else {
      const container = document.getElementById(`container-${emp.location}`);
      if (container) container.appendChild(createToken(emp));
    }
  });

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
