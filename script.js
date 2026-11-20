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

const linkedSets = [
  ["design-21", "design-22", "design-23"],
  ["design-24", "design-25"],
  ["design-26", "design-27", "design-28"],
  ["design-29", "design-30", "design-31"],
  ["design-34", "design-35"],
];

const workKey = (work) => `${work.category}-${work.id}`;
const previewPath = (work) =>
  `assets/img/previews/${work.category}/preview-${work.id}.jpg`;
const originalPath = (work) =>
  `assets/img/originals/${work.category}/${work.original}`;

const grid = document.querySelector("#gallery");
let visible = [];

function buildGroups(items) {
  const byKey = new Map(items.map((work) => [workKey(work), work]));
  const used = new Set();
  const groups = [];

  for (const work of items) {
    const key = workKey(work);
    if (used.has(key)) continue;

    const linked = linkedSets.find((set) => set.includes(key));
    const group = linked
      ? linked.map((memberKey) => byKey.get(memberKey)).filter(Boolean)
      : [work];

    group.forEach((member) => used.add(workKey(member)));
    groups.push(group);
  }

  return groups;
}

function makeCard(work) {
  const item = document.createElement("article");
  item.className = "item";
  item.innerHTML = `
    <div class="photo">
      <img
        loading="lazy"
        src="${previewPath(work)}"
        alt="Работа из портфолио"
      >
    </div>
  `;
  item.onclick = () => openModal(visible.indexOf(work));
  return item;
}

function draw(filter = "all") {
  grid.innerHTML = "";
  visible = works.filter(
    (work) => filter === "all" || work.category === filter,
  );

  for (const bundle of buildGroups(visible)) {
    if (bundle.length === 1) {
      grid.append(makeCard(bundle[0]));
      continue;
    }

    const group = document.createElement("div");
    group.className = `masonry-group group-${bundle.length}`;

    for (const work of bundle) {
      group.append(makeCard(work));
    }

    grid.append(group);
  }
}

document.querySelectorAll(".filter").forEach((button) => {
  button.onclick = () => {
    document.querySelector(".filter.active").classList.remove("active");
    button.classList.add("active");
    draw(button.dataset.filter);
  };
});

// Увеличенный просмотр работ
const modal = document.querySelector("#modal");
const modalImage = modal.querySelector("img");
let current = 0;

function showModal() {
  const work = visible[current];
  modalImage.src = originalPath(work);
  modalImage.alt = "Работа из портфолио";
}

function openModal(index) {
  current = index;
  showModal();
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function step(direction) {
  current = (current + direction + visible.length) % visible.length;
  showModal();
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

modal.querySelector(".close").onclick = closeModal;
modal.querySelector(".prev").onclick = () => step(-1);
modal.querySelector(".next").onclick = () => step(1);
modal.onclick = (event) => {
  if (event.target === modal) closeModal();
};

document.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("open")) return;
  if (event.key === "Escape") closeModal();
  if (event.key === "ArrowRight") step(1);
  if (event.key === "ArrowLeft") step(-1);
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

menuButton.onclick = () => {
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

  if (!isOpen) siteNav.querySelector("a").focus();
};

siteNav.querySelector(".nav-close").onclick = closeMenu;
siteNav.querySelectorAll("a").forEach((link) => {
  link.onclick = closeMenu;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

// Кнопка «Наверх»
const toTop = document.querySelector(".to-top");
function updateToTop() {
  toTop.classList.toggle("is-visible", window.scrollY > 420);
}
window.addEventListener("scroll", updateToTop, { passive: true });
updateToTop();
toTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

// Почта
const mail = ["solovann83", "yandex.ru"].join("@");
document.querySelector("#emailLink").onclick = (event) => {
  event.preventDefault();
  const link = event.currentTarget;
  link.href = `mailto:${mail}`;
  link.textContent = `${mail} ↗`;
  window.location.href = link.href;
};

draw();
