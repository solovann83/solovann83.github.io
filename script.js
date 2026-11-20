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

const key = (category, id) =>
  `${category}-${String(id).padStart(2, "0")}`;

const one = (category, id) => ({
  type: "single",
  key: key(category, id),
});

const linked = (category, ids) => ({
  type: "group",
  keys: ids.map((id) => key(category, id)),
});

const layoutPlans = {
  all: [
    one("retouch", 13),
    one("retouch", 10),
    one("design", 36),
    one("retouch", 12),
    linked("design", [21, 22, 23]),
    one("retouch", 11),
    linked("design", [24, 25]),
    one("retouch", 14),
    one("ai", 45),
    linked("design", [26, 27, 28]),
    one("design", 38),
    linked("design", [29, 30, 31]),
    one("design", 32),
    linked("design", [34, 35]),
    one("design", 33),
    one("ai", 54),
    one("retouch", 16),
    one("ai", 46),
    one("retouch", 8),
    one("ai", 55),
    one("design", 37),
    one("design", 39),
    one("design", 40),
    one("design", 41),
    one("retouch", 9),
    one("retouch", 15),
    one("3d", 2),
    one("3d", 4),
    one("retouch", 17),
    one("retouch", 18),
    one("retouch", 19),
    one("retouch", 20),
    one("3d", 1),
    one("3d", 3),
    one("3d", 5),
    one("3d", 7),
    one("3d", 6),
    one("ai", 42),
    one("ai", 43),
    one("ai", 44),
    one("ai", 47),
    one("ai", 48),
    one("ai", 49),
    one("ai", 52),
    one("ai", 50),
    one("ai", 51),
    one("ai", 53),
  ],

  retouch: [
    one("retouch", 13),
    one("retouch", 10),
    one("retouch", 8),
    one("retouch", 12),
    one("retouch", 11),
    one("retouch", 14),
    one("retouch", 16),
    one("retouch", 9),
    one("retouch", 15),
    one("retouch", 17),
    one("retouch", 18),
    one("retouch", 19),
    one("retouch", 20),
  ],

  design: [
    linked("design", [21, 22, 23]),
    one("design", 32),
    linked("design", [24, 25]),
    one("design", 33),
    one("design", 36),
    linked("design", [26, 27, 28]),
    one("design", 37),
    linked("design", [29, 30, 31]),
    one("design", 38),
    linked("design", [34, 35]),
    one("design", 39),
    one("design", 40),
    one("design", 41),
  ],

  "3d": [
    one("3d", 1),
    one("3d", 2),
    one("3d", 3),
    one("3d", 4),
    one("3d", 5),
    one("3d", 6),
    one("3d", 7),
  ],

  ai: [
    one("ai", 42),
    one("ai", 43),
    one("ai", 44),
    one("ai", 46),
    one("ai", 47),
    one("ai", 48),
    one("ai", 49),
    one("ai", 52),
    one("ai", 45),
    one("ai", 54),
    one("ai", 55),
    one("ai", 50),
    one("ai", 51),
    one("ai", 53),
  ],
};

const workByKey = new Map(
  works.map((work) => [key(work.category, work.id), work]),
);

const grid = document.querySelector("#gallery");
const modal = document.querySelector("#modal");
const modalImage = modal.querySelector("img");

let visibleWorks = [];
let currentIndex = 0;
let currentFilter = "all";
let resizeTimer;

function previewPath(work) {
  return `assets/img/previews/${work.category}/preview-${work.id}.jpg`;
}

function originalPath(work) {
  return `assets/img/originals/${work.category}/${work.original}`;
}

function aspectRatio(work) {
  const id = Number(work.id);

  if (work.category === "retouch") {
    if (id === 11) return "450 / 800";
    if ([9, 17, 18].includes(id)) return "800 / 600";
    if ([15, 19, 20].includes(id)) return "800 / 450";
    return "600 / 800";
  }

  if (work.category === "design") {
    if ([37, 39, 40].includes(id)) return "800 / 600";
    if (id === 41) return "800 / 450";
    return "600 / 800";
  }

  if (work.category === "3d") {
    if ([2, 4].includes(id)) return "800 / 450";
    return "800 / 600";
  }

  if (work.category === "ai") {
    if ([45, 54, 55].includes(id)) return "600 / 800";
    if ([47, 48, 49, 52].includes(id)) return "800 / 450";
    return "800 / 600";
  }

  return "4 / 3";
}

function columnCount() {
  if (window.matchMedia("(max-width: 430px)").matches) return 3;
  if (window.matchMedia("(max-width: 760px)").matches) return 6;
  return 12;
}

function getContentHeight(element) {
  if (element.classList.contains("gallery-group")) {
    const groupRect = element.getBoundingClientRect();
    const photos = [...element.querySelectorAll(".photo")];

    return Math.max(
      0,
      ...photos.map((photo) => photo.getBoundingClientRect().bottom - groupRect.top),
    );
  }

  return element.querySelector(".photo")?.getBoundingClientRect().height || 0;
}

function updateGridSpans() {
  requestAnimationFrame(() => {
    const styles = getComputedStyle(grid);
    const rowUnit =
      parseFloat(styles.getPropertyValue("--gallery-row-unit")) || 1;
    const rowGap =
      parseFloat(styles.getPropertyValue("--gallery-row-gap")) || 1;
    const targetGap =
      parseFloat(styles.getPropertyValue("--gallery-target-gap")) || 20;

    for (const element of grid.children) {
      const height = getContentHeight(element);
      const span = Math.max(
        1,
        Math.ceil((height + targetGap) / (rowUnit + rowGap)),
      );

      element.style.gridRowEnd = `span ${span}`;
    }
  });
}

function makeCard(work, insideGroup = false) {
  const item = document.createElement("article");
  item.className = insideGroup ? "item group-item" : "item grid-single";

  if (!insideGroup) {
    item.style.gridColumn = "span 3";
  }

  const photo = document.createElement("div");
  photo.className = "photo";
  photo.style.setProperty("--image-ratio", aspectRatio(work));

  const image = document.createElement("img");
  image.loading = "lazy";
  image.src = previewPath(work);
  image.alt = "Работа из портфолио";
  image.addEventListener("load", updateGridSpans, { once: true });

  photo.append(image);
  item.append(photo);

  item.addEventListener("click", () => {
    const index = visibleWorks.indexOf(work);
    if (index !== -1) openModal(index);
  });

  return item;
}

function makeGroup(block) {
  const members = block.keys
    .map((memberKey) => workByKey.get(memberKey))
    .filter(Boolean);

  if (!members.length) return null;

  const groupElement = document.createElement("div");
  groupElement.className = "gallery-group";

  const columns = columnCount();
  const groupSpan = Math.min(members.length * 3, columns);
  const innerColumns = Math.min(members.length, columns / 3);

  groupElement.style.setProperty("--group-span", groupSpan);
  groupElement.style.setProperty("--group-columns", innerColumns);

  members.forEach((work) => {
    groupElement.append(makeCard(work, true));
  });

  return groupElement;
}

function draw(filter = "all") {
  currentFilter = filter;
  grid.replaceChildren();

  visibleWorks = works.filter(
    (work) => filter === "all" || work.category === filter,
  );

  const plan = layoutPlans[filter] || layoutPlans.all;
  const used = new Set();

  for (const block of plan) {
    if (block.type === "single") {
      const work = workByKey.get(block.key);

      if (!work || (filter !== "all" && work.category !== filter)) continue;

      grid.append(makeCard(work));
      used.add(block.key);
      continue;
    }

    const members = block.keys
      .map((memberKey) => workByKey.get(memberKey))
      .filter((work) => work && (filter === "all" || work.category === filter));

    if (!members.length) continue;

    const groupElement = makeGroup({
      keys: members.map((work) => key(work.category, work.id)),
    });

    if (groupElement) grid.append(groupElement);

    members.forEach((work) => {
      used.add(key(work.category, work.id));
    });
  }

  visibleWorks.forEach((work) => {
    const workKey = key(work.category, work.id);
    if (!used.has(workKey)) grid.append(makeCard(work));
  });

  updateGridSpans();
}

// Фильтры
document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter.active")?.classList.remove("active");
    button.classList.add("active");
    draw(button.dataset.filter);
  });
});

// Лайтбокс
function showModal() {
  const work = visibleWorks[currentIndex];
  if (!work) return;

  modalImage.src = originalPath(work);
  modalImage.alt = "Работа из портфолио";
}

function openModal(index) {
  currentIndex = index;
  showModal();
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

function step(direction) {
  if (!visibleWorks.length) return;

  currentIndex =
    (currentIndex + direction + visibleWorks.length) % visibleWorks.length;
  showModal();
}

modal.querySelector(".close").addEventListener("click", closeModal);
modal.querySelector(".prev").addEventListener("click", () => step(-1));
modal.querySelector(".next").addEventListener("click", () => step(1));

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
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

// Перестроение сетки при изменении ширины
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => draw(currentFilter), 150);
});

draw();
