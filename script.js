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
