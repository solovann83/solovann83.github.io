const makeWorks = (category, start, end, extension = "jpg") =>
  Array.from({ length: end - start + 1 }, (_, i) => {
    const id = String(start + i).padStart(2, "0");
    return { category, id, original: `${id}.${extension}` };
  });

const aiOriginals = [
  "42.png",
  "43.jpg",
  "44.jpg",
  "45.png",
  "46.png",
  "47.png",
  "48.jpg",
  "49.png",
  "50.png",
  "51.jpg",
  "52.png",
  "53.jpg",
  "54.jpg",
  "55.png",
];

const works = [
  ...makeWorks("retouch", 8, 20),
  ...makeWorks("design", 21, 41),
  ...makeWorks("3d", 1, 7),
  ...aiOriginals.map((original) => ({
    category: "ai",
    id: original.split(".")[0],
    original,
  })),
];

const workKey = (category, id) =>
  `${category}-${String(id).padStart(2, "0")}`;

const single = (category, id) => ({
  type: "single",
  key: workKey(category, id),
});

const group = (category, ids) => ({
  type: "group",
  keys: ids.map((id) => workKey(category, id)),
});

const layoutPlans = {
  all: [
    [single("retouch", 8), single("retouch", 10), single("retouch", 11), single("retouch", 12)],
    [group("design", [21, 22, 23]), single("retouch", 13)],
    [group("design", [24, 25]), single("retouch", 14), single("ai", 45)],
    [group("design", [26, 27, 28]), single("design", 38)],
    [group("design", [29, 30, 31]), single("design", 32)],
    [group("design", [34, 35]), single("design", 33), single("ai", 54)],
    [single("retouch", 16), single("ai", 46), single("design", 36), single("ai", 55)],
    [single("design", 37), single("design", 39), single("design", 40), single("design", 41)],
    [single("retouch", 9), single("retouch", 15), single("3d", 2), single("3d", 4)],
    [single("retouch", 17), single("retouch", 18), single("retouch", 19), single("retouch", 20)],
    [single("3d", 1), single("3d", 3), single("3d", 5), single("3d", 7)],
    [single("3d", 6), single("ai", 42), single("ai", 43), single("ai", 44)],
    [single("ai", 47), single("ai", 48), single("ai", 49), single("ai", 52)],
    [single("ai", 50), single("ai", 51), single("ai", 53)],
  ],

  retouch: [
    [single("retouch", 8), single("retouch", 10), single("retouch", 11), single("retouch", 12)],
    [single("retouch", 13), single("retouch", 14), single("retouch", 16), single("retouch", 9)],
    [single("retouch", 15), single("retouch", 17), single("retouch", 18), single("retouch", 19)],
    [single("retouch", 20)],
  ],

  design: [
    [group("design", [21, 22, 23]), single("design", 32)],
    [group("design", [24, 25]), single("design", 33), single("design", 36)],
    [group("design", [26, 27, 28]), single("design", 37)],
    [group("design", [29, 30, 31]), single("design", 38)],
    [group("design", [34, 35]), single("design", 39), single("design", 40)],
    [single("design", 41)],
  ],

  "3d": [
    [single("3d", 1), single("3d", 2), single("3d", 3), single("3d", 4)],
    [single("3d", 5), single("3d", 6), single("3d", 7)],
  ],

  ai: [
    [single("ai", 42), single("ai", 43), single("ai", 44), single("ai", 46)],
    [single("ai", 47), single("ai", 48), single("ai", 49), single("ai", 52)],
    [single("ai", 45), single("ai", 54), single("ai", 55), single("ai", 50)],
    [single("ai", 51), single("ai", 53)],
  ],
};

const workByKey = new Map(works.map((work) => [
  workKey(work.category, work.id),
  work,
]));

const previewPath = (work) =>
  `assets/img/previews/${work.category}/preview-${work.id}.jpg`;

const originalPath = (work) =>
  `assets/img/originals/${work.category}/${work.original}`;

const grid = document.querySelector("#gallery");
const modal = document.querySelector("#modal");
const modalImage = modal.querySelector("img");
let visible = [];
let current = 0;

function getColumnCount() {
  if (window.matchMedia("(max-width: 430px)").matches) return 1;
  if (window.matchMedia("(max-width: 760px)").matches) return 2;
  return 4;
}

function makeRows(plan, columnCount) {
  const rows = [];

  for (const plannedRow of plan) {
    let row = [];
    let usedColumns = 0;

    const flush = () => {
      if (row.length) rows.push(row);
      row = [];
      usedColumns = 0;
    };

    for (const block of plannedRow) {
      const span = block.type === "group" ? block.keys.length : 1;

      if (span > columnCount) {
        flush();
        rows.push([block]);
        continue;
      }

      if (usedColumns + span > columnCount) flush();

      row.push(block);
      usedColumns += span;
    }

    flush();
  }

  return rows;
}

function makeCard(work) {
  const card = document.createElement("article");
  card.className = "item";

  const image = document.createElement("img");
  image.loading = "lazy";
  image.src = previewPath(work);
  image.alt = "Работа из портфолио";

  const photo = document.createElement("div");
  photo.className = "photo";
  photo.append(image);
  card.append(photo);

  card.addEventListener("click", () => {
    const index = visible.indexOf(work);
    if (index !== -1) openModal(index);
  });

  return card;
}

function makeBlock(block) {
  if (block.type === "single") {
    const work = workByKey.get(block.key);
    if (!work) return null;

    const card = makeCard(work);
    card.classList.add("grid-single");
    return card;
  }

  const members = block.keys
    .map((key) => workByKey.get(key))
    .filter(Boolean);

  if (!members.length) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "gallery-group";
  wrapper.style.setProperty("--member-count", members.length);
  wrapper.style.setProperty("--span", members.length);

  members.forEach((work) => wrapper.append(makeCard(work)));
  return wrapper;
}

function draw(filter = "all") {
  grid.replaceChildren();

  visible = works.filter(
    (work) => filter === "all" || work.category === filter,
  );

  const plan = layoutPlans[filter] || layoutPlans.all;
  const rows = makeRows(plan, getColumnCount());

  for (const rowBlocks of rows) {
    const row = document.createElement("div");
    row.className = "gallery-row";

    for (const block of rowBlocks) {
      const element = makeBlock(block);
      if (element) row.append(element);
    }

    grid.append(row);
  }
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter.active")?.classList.remove("active");
    button.classList.add("active");
    draw(button.dataset.filter);
  });
});

// Увеличенный просмотр
function showModal() {
  const work = visible[current];
  if (!work) return;

  modalImage.src = originalPath(work);
  modalImage.alt = "Работа из портфолио";
}

function openModal(index) {
  current = index;
  showModal();
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

function step(direction) {
  if (!visible.length) return;
  current = (current + direction + visible.length) % visible.length;
  showModal();
}

modal.querySelector(".close").addEventListener("click", closeModal);
modal.querySelector(".prev").addEventListener("click", () => step(-1));
modal.querySelector(".next").addEventListener("click", () => step(1));
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (modal.classList.contains("open")) {
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  if (event.key === "Escape") closeMenu();
});

// Мобильное меню
const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const header = document.querySelector(".top");

function closeMenu() {
  menuButton.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Открыть меню");
  siteNav.classList.remove("is-open");
  header.classList.remove("menu-open");
  document.body.style.overflow = "";
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";

  menuButton.classList.toggle("is-open", !isOpen);
  siteNav.classList.toggle("is-open", !isOpen);
  header.classList.toggle("menu-open", !isOpen);
  document.body.style.overflow = isOpen ? "" : "hidden";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Открыть меню" : "Закрыть меню",
  );

  if (!isOpen) siteNav.querySelector("a")?.focus();
});

siteNav.querySelector(".nav-close").addEventListener("click", closeMenu);
siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// Кнопка «Наверх»
const toTop = document.querySelector(".to-top");

function updateToTop() {
  toTop.classList.toggle("is-visible", window.scrollY > 420);
}

window.addEventListener("scroll", updateToTop, { passive: true });
toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
updateToTop();

// Почта
const mail = ["solovann83", "yandex.ru"].join("@");
document.querySelector("#emailLink").addEventListener("click", (event) => {
  event.preventDefault();
  const link = event.currentTarget;
  link.href = `mailto:${mail}`;
  link.textContent = `${mail} ↗`;
  window.location.href = link.href;
});

// Пересчитать число колонок при изменении ширины окна
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const activeFilter =
      document.querySelector(".filter.active")?.dataset.filter || "all";
    draw(activeFilter);
  }, 120);
});

draw();
