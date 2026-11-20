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

/* Порядок работ из актуального script.js в GitHub */
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
    one("retouch", 8),
    one("ai", 54),
    one("retouch", 16),
    one("design", 37),
    one("design", 33),
    one("ai", 55),
    one("ai", 46),
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
    one("retouch", 14),
    one("retouch", 10),
    one("retouch", 12),
    one("retouch", 11),
    one("retouch", 8),
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

/* Прокручиваемая область изображения */
const modalViewport = document.createElement("div");
modalViewport.className = "modal-viewport";
modalImage.classList.add("modal-image");
modalImage.parentNode.insertBefore(modalViewport, modalImage);
modalViewport.append(modalImage);

/* Индикатор загрузки */
const loadingOverlay = document.createElement("div");
loadingOverlay.className = "image-loading";
loadingOverlay.hidden = true;
loadingOverlay.innerHTML = `
  <div class="image-loading-card" role="status" aria-live="polite">
    <p class="image-loading-text">Пожалуйста, подождите — идёт загрузка…</p>
    <div class="loading-track" aria-hidden="true">
      <div class="loading-indicator"></div>
    </div>
  </div>
`;
modalViewport.append(loadingOverlay);

/* Панель масштаба и сравнения */
const lightboxToolbar = document.createElement("div");
lightboxToolbar.className = "lightbox-toolbar";
lightboxToolbar.innerHTML = `
  <div class="zoom-controls" role="group" aria-label="Масштаб изображения">
    <button type="button" data-zoom="fit" aria-pressed="true">Вписать</button>
    <button type="button" data-zoom="native" aria-pressed="false">100%</button>
  </div>
  <div class="compare-controls" role="group" aria-label="Сравнение до и после" hidden>
    <button type="button" data-compare="before" aria-pressed="false">До</button>
    <button type="button" data-compare="after" aria-pressed="true">После</button>
  </div>
`;
modal.append(lightboxToolbar);

const compareControls = lightboxToolbar.querySelector(".compare-controls");
const zoomButtons = lightboxToolbar.querySelectorAll("[data-zoom]");

let visibleWorks = [];
let currentIndex = 0;
let currentFilter = "all";
let resizeTimer;
let compareState = "after";
let zoomScale = 0;
let imageRequestId = 0;
let imageReady = false;
let dragState = null;

const isWork15 = (work) =>
  work?.category === "retouch" && work.id === "15";

function previewPath(work) {
  return `assets/img/previews/${work.category}/preview-${work.id}.jpg`;
}

function originalPath(work) {
  return `assets/img/originals/${work.category}/${work.original}`;
}

function lightboxPath(work, state = "after") {
  if (isWork15(work)) {
    return state === "before"
      ? "assets/img/originals/retouch/15_before.jpg"
      : "assets/img/originals/retouch/15_after.jpg";
  }

  return originalPath(work);
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
      ...photos.map(
        (photo) => photo.getBoundingClientRect().bottom - groupRect.top,
      ),
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
    item.style.gridColumn = isWork15(work) ? "span 6" : "span 3";
  }

  if (isWork15(work)) item.classList.add("featured-work");

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
  groupElement.style.setProperty(
    "--group-span",
    Math.min(members.length * 3, columns),
  );
  groupElement.style.setProperty(
    "--group-columns",
    Math.min(members.length, columns / 3),
  );

  members.forEach((work) => {
    groupElement.append(makeCard(work, true));
  });

  return groupElement;
}

function setLoading(
  isLoading,
  message = "Пожалуйста, подождите — идёт загрузка…",
) {
  loadingOverlay.hidden = !isLoading;
  modalImage.classList.toggle("is-loading", isLoading);

  const text = loadingOverlay.querySelector(".image-loading-text");
  if (text) text.textContent = message;

  zoomButtons.forEach((button) => {
    button.disabled = isLoading || !imageReady;
  });
}

function getFitScale() {
  return Math.min(
    modalViewport.clientWidth / modalImage.naturalWidth,
    modalViewport.clientHeight / modalImage.naturalHeight,
    1,
  );
}

function setZoomButtonState(mode) {
  lightboxToolbar
    .querySelector('[data-zoom="fit"]')
    .setAttribute("aria-pressed", String(mode === "fit"));

  lightboxToolbar
    .querySelector('[data-zoom="native"]')
    .setAttribute("aria-pressed", String(mode === "native"));
}

function applyZoom() {
  if (!imageReady || !modalImage.naturalWidth) return;

  if (zoomScale === 0) {
    modal.classList.remove("is-zoomed");
    modalImage.style.width = "";
    modalImage.style.height = "";
    setZoomButtonState("fit");
    return;
  }

  modal.classList.add("is-zoomed");
  modalImage.style.width =
    `${Math.round(modalImage.naturalWidth * zoomScale)}px`;
  modalImage.style.height =
    `${Math.round(modalImage.naturalHeight * zoomScale)}px`;

  setZoomButtonState(zoomScale === 1 ? "native" : "none");
}

function centerZoomedImage() {
  if (!imageReady || zoomScale === 0) return;

  modalViewport.scrollLeft = Math.max(
    0,
    (modalImage.offsetWidth - modalViewport.clientWidth) / 2,
  );
  modalViewport.scrollTop = Math.max(
    0,
    (modalImage.offsetHeight - modalViewport.clientHeight) / 2,
  );
}

function loadModalImage(src, alt) {
  const requestId = ++imageRequestId;
  imageReady = false;
  setLoading(true);
  modalImage.alt = alt;

  let handled = false;

  const finishLoad = async () => {
    if (handled) return;
    handled = true;

    try {
      if (modalImage.decode) await modalImage.decode();
    } catch {
      /* Браузер может отклонить decode для уже загруженного изображения. */
    }

    if (requestId !== imageRequestId) return;

    imageReady = true;
    loadingOverlay.hidden = true;
    modalImage.classList.remove("is-loading");

    zoomButtons.forEach((button) => {
      button.disabled = false;
    });

    applyZoom();

    // При переключении «До / После» сохраняем масштаб и центрируем новый кадр.
    if (zoomScale > 0) requestAnimationFrame(centerZoomedImage);
  };

  modalImage.onload = finishLoad;

  modalImage.onerror = () => {
    if (requestId !== imageRequestId) return;

    imageReady = false;
    setLoading(true, "Не удалось загрузить изображение.");
    loadingOverlay.querySelector(".loading-track").hidden = true;
  };

  modalImage.src = src;

  if (modalImage.complete && modalImage.naturalWidth) {
    finishLoad();
  }
}

function setZoom(nextScale, clientX = null, clientY = null) {
  if (!imageReady) return;

  const oldScale = zoomScale === 0 ? getFitScale() : zoomScale;
  const rect = modalViewport.getBoundingClientRect();
  const anchorX = clientX === null ? rect.width / 2 : clientX - rect.left;
  const anchorY = clientY === null ? rect.height / 2 : clientY - rect.top;
  const contentX = modalViewport.scrollLeft + anchorX;
  const contentY = modalViewport.scrollTop + anchorY;

  /* Ограничение: не больше натурального размера изображения, максимум 100%. */
  zoomScale = nextScale === 0 ? 0 : Math.min(1, nextScale);
  applyZoom();

  if (zoomScale === 0) {
    modalViewport.scrollTop = 0;
    modalViewport.scrollLeft = 0;
    return;
  }

  const appliedScale = zoomScale;

  requestAnimationFrame(() => {
    if (clientX === null || clientY === null) {
      centerZoomedImage();
      return;
    }

    modalViewport.scrollLeft = Math.max(
      0,
      contentX * (appliedScale / oldScale) - anchorX,
    );
    modalViewport.scrollTop = Math.max(
      0,
      contentY * (appliedScale / oldScale) - anchorY,
    );
  });
}

function setCompareState(state) {
  compareState = state;

  compareControls
    .querySelector('[data-compare="before"]')
    .setAttribute("aria-pressed", String(state === "before"));

  compareControls
    .querySelector('[data-compare="after"]')
    .setAttribute("aria-pressed", String(state === "after"));

  const work = visibleWorks[currentIndex];
  if (!isWork15(work)) return;

  loadModalImage(
    lightboxPath(work, state),
    state === "before"
      ? "Работа 15 до ретуши"
      : "Работа 15 после ретуши",
  );
}

function showModal() {
  const work = visibleWorks[currentIndex];
  if (!work) return;

  zoomScale = 0;
  modal.classList.remove("is-zoomed");
  modalViewport.classList.remove("is-dragging");
  setZoomButtonState("fit");

  if (isWork15(work)) {
    compareControls.hidden = false;
    compareState = "after";

    compareControls
      .querySelector('[data-compare="before"]')
      .setAttribute("aria-pressed", "false");

    compareControls
      .querySelector('[data-compare="after"]')
      .setAttribute("aria-pressed", "true");

    loadModalImage(lightboxPath(work, "after"), "Работа 15 после ретуши");
    return;
  }

  compareControls.hidden = true;
  loadModalImage(originalPath(work), "Работа из портфолио");
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
    members.forEach((work) => used.add(key(work.category, work.id)));
  }

  visibleWorks.forEach((work) => {
    const workKey = key(work.category, work.id);
    if (!used.has(workKey)) grid.append(makeCard(work));
  });

  updateGridSpans();
}

/* Масштаб кнопками и колесом мыши */
lightboxToolbar
  .querySelector('[data-zoom="fit"]')
  .addEventListener("click", () => setZoom(0));

lightboxToolbar
  .querySelector('[data-zoom="native"]')
  .addEventListener("click", () => setZoom(1));

modalViewport.addEventListener(
  "wheel",
  (event) => {
    if (!modal.classList.contains("open") || !imageReady) return;
    if (window.matchMedia("(max-width: 760px)").matches) return;

    event.preventDefault();

    const fitScale = getFitScale();
    const baseScale = zoomScale === 0 ? fitScale : zoomScale;
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nextScale = Math.min(1, Math.max(fitScale, baseScale * factor));

    if (nextScale <= fitScale * 1.01) {
      setZoom(0);
    } else {
      setZoom(nextScale, event.clientX, event.clientY);
    }
  },
  { passive: false },
);

/* Перетаскивание увеличенного изображения мышью */
modalViewport.addEventListener("pointerdown", (event) => {
  if (
    !modal.classList.contains("is-zoomed") ||
    event.pointerType === "touch" ||
    event.button !== 0
  ) {
    return;
  }

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startScrollLeft: modalViewport.scrollLeft,
    startScrollTop: modalViewport.scrollTop,
  };

  modalViewport.classList.add("is-dragging");
  modalViewport.setPointerCapture(event.pointerId);
  event.preventDefault();
});

modalViewport.addEventListener("pointermove", (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  modalViewport.scrollLeft =
    dragState.startScrollLeft - (event.clientX - dragState.startX);
  modalViewport.scrollTop =
    dragState.startScrollTop - (event.clientY - dragState.startY);
});

function stopImageDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  dragState = null;
  modalViewport.classList.remove("is-dragging");
}

modalViewport.addEventListener("pointerup", stopImageDrag);
modalViewport.addEventListener("pointercancel", stopImageDrag);
modalViewport.addEventListener("lostpointercapture", () => {
  dragState = null;
  modalViewport.classList.remove("is-dragging");
});

compareControls.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    setCompareState(button.dataset.compare);
  });
});

// Фильтры
document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter.active")?.classList.remove("active");
    button.classList.add("active");
    draw(button.dataset.filter);
  });
});

// Лайтбокс
function openModal(index) {
  currentIndex = index;
  showModal();
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.classList.remove("is-zoomed");
  modalViewport.classList.remove("is-dragging");
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

document.addEventListener("keydown", (event) => {
  if (modal.classList.contains("open")) {
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  if (event.key === "Escape") closeMenu();
});

// Почта
const mail = ["solovann83", "yandex.ru"].join("@");

document.querySelector("#emailLink").addEventListener("click", (event) => {
  event.preventDefault();

  const link = event.currentTarget;
  link.href = `mailto:${mail}`;
  link.textContent = `${mail} ↗`;
  window.location.href = link.href;
});

// Перестройка сетки при изменении ширины
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => draw(currentFilter), 150);
});

draw();
