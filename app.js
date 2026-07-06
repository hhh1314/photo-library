const DB_NAME = "pixvault-photo-library";
const STORE_NAME = "photos";

const samplePhotos = [
  {
    id: "sample-forest",
    title: "晨雾森林",
    category: "nature",
    tags: ["森林", "晨雾", "自然"],
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-01T09:00:00.000Z",
    favorite: true,
    width: 1200,
    height: 1600
  },
  {
    id: "sample-lab",
    title: "光学实验",
    category: "science",
    tags: ["科研", "激光", "实验室"],
    src: "https://images.unsplash.com/photo-1581093458791-9d42f8601b51?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-02T10:30:00.000Z",
    favorite: false,
    width: 1200,
    height: 800
  },
  {
    id: "sample-city",
    title: "城市天际线",
    category: "city",
    tags: ["城市", "建筑", "夜景"],
    src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-02T16:15:00.000Z",
    favorite: false,
    width: 1200,
    height: 1500
  },
  {
    id: "sample-portrait",
    title: "窗边肖像",
    category: "people",
    tags: ["人物", "肖像", "自然光"],
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-03T08:25:00.000Z",
    favorite: true,
    width: 1200,
    height: 1500
  },
  {
    id: "sample-camera",
    title: "复古相机",
    category: "other",
    tags: ["相机", "器材", "静物"],
    src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-04T11:10:00.000Z",
    favorite: false,
    width: 1200,
    height: 900
  },
  {
    id: "sample-coast",
    title: "海岸日落",
    category: "nature",
    tags: ["海岸", "日落", "旅行"],
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-05T18:40:00.000Z",
    favorite: false,
    width: 1200,
    height: 800
  },
  {
    id: "sample-desk",
    title: "创作桌面",
    category: "other",
    tags: ["桌面", "灵感", "工作"],
    src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-05T20:05:00.000Z",
    favorite: false,
    width: 1200,
    height: 1350
  },
  {
    id: "sample-street",
    title: "街头色彩",
    category: "city",
    tags: ["街头", "色彩", "城市"],
    src: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    createdAt: "2026-07-06T07:20:00.000Z",
    favorite: true,
    width: 1200,
    height: 1600
  }
];

const categoryLabels = {
  all: "全部",
  nature: "自然",
  city: "城市",
  people: "人物",
  science: "科研",
  other: "其他"
};

const state = {
  photos: [],
  activeCategory: "all",
  activeView: "all",
  search: "",
  type: "all",
  sort: "newest",
  selectedPhotoId: null
};

const elements = {
  gallery: document.querySelector("#gallery"),
  emptyState: document.querySelector("#emptyState"),
  galleryTitle: document.querySelector("#galleryTitle"),
  galleryMeta: document.querySelector("#galleryMeta"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  typeFilter: document.querySelector("#typeFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  uploadDialog: document.querySelector("#uploadDialog"),
  openUpload: document.querySelector("#openUpload"),
  uploadForm: document.querySelector("#uploadForm"),
  fileInput: document.querySelector("#fileInput"),
  dropZone: document.querySelector("#dropZone"),
  photoTitle: document.querySelector("#photoTitle"),
  photoCategory: document.querySelector("#photoCategory"),
  photoTags: document.querySelector("#photoTags"),
  clearForm: document.querySelector("#clearForm"),
  lightbox: document.querySelector("#lightbox"),
  lightboxImage: document.querySelector("#lightboxImage"),
  lightboxTitle: document.querySelector("#lightboxTitle"),
  lightboxTags: document.querySelector("#lightboxTags"),
  lightboxCategory: document.querySelector("#lightboxCategory"),
  lightboxDate: document.querySelector("#lightboxDate"),
  lightboxSize: document.querySelector("#lightboxSize"),
  toggleFavorite: document.querySelector("#toggleFavorite"),
  downloadPhoto: document.querySelector("#downloadPhoto"),
  closeLightbox: document.querySelector("#closeLightbox"),
  themeToggle: document.querySelector("#themeToggle")
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = callback(store);

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getSavedPhotos() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function savePhoto(photo) {
  return withStore("readwrite", store => store.put(photo));
}

async function deletePhoto(id) {
  return withStore("readwrite", store => store.delete(id));
}

function getAllPhotos() {
  const savedIds = new Set(state.photos.map(photo => photo.id));
  const samples = samplePhotos.filter(photo => !savedIds.has(photo.id));
  return [...state.photos, ...samples];
}

function filterPhotos() {
  const query = state.search.trim().toLowerCase();
  let photos = getAllPhotos();

  if (state.activeView === "favorites") {
    photos = photos.filter(photo => photo.favorite);
  }

  if (state.activeView === "recent") {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    photos = photos.filter(photo => new Date(photo.createdAt).getTime() >= sevenDaysAgo);
  }

  const category = state.type !== "all" ? state.type : state.activeCategory;
  if (category !== "all") {
    photos = photos.filter(photo => photo.category === category);
  }

  if (query) {
    photos = photos.filter(photo => {
      const haystack = [photo.title, photo.category, ...(photo.tags || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  photos.sort((a, b) => {
    if (state.sort === "liked") return Number(b.favorite) - Number(a.favorite);
    if (state.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return photos;
}

function renderGallery() {
  const photos = filterPhotos();
  elements.gallery.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", photos.length > 0);

  elements.galleryTitle.textContent = state.activeView === "favorites"
    ? "收藏照片"
    : state.activeView === "recent"
      ? "最近上传"
      : `${categoryLabels[state.activeCategory]}照片`;
  elements.galleryMeta.textContent = `${photos.length} 张照片，可搜索、收藏、预览和下载。`;

  const fragment = document.createDocumentFragment();
  photos.forEach(photo => fragment.appendChild(createPhotoCard(photo)));
  elements.gallery.appendChild(fragment);
}

function createPhotoCard(photo) {
  const card = document.createElement("article");
  card.className = "photo-card";
  card.tabIndex = 0;
  card.dataset.id = photo.id;

  const image = document.createElement("img");
  image.src = photo.src;
  image.alt = photo.title;
  image.loading = "lazy";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const favorite = document.createElement("button");
  favorite.className = `icon-button ${photo.favorite ? "favorite-on" : ""}`;
  favorite.type = "button";
  favorite.title = photo.favorite ? "取消收藏" : "收藏";
  favorite.textContent = "♥";
  favorite.addEventListener("click", event => {
    event.stopPropagation();
    toggleFavorite(photo.id);
  });

  const view = document.createElement("button");
  view.className = "icon-button";
  view.type = "button";
  view.title = "查看";
  view.textContent = "↗";
  view.addEventListener("click", event => {
    event.stopPropagation();
    openLightbox(photo.id);
  });

  actions.append(favorite, view);

  const overlay = document.createElement("div");
  overlay.className = "photo-overlay";
  overlay.innerHTML = `
    <p class="photo-title">${escapeHtml(photo.title)}</p>
    <div class="photo-meta">
      <span>${escapeHtml(categoryLabels[photo.category] || "其他")}</span>
      <span>${formatDate(photo.createdAt)}</span>
    </div>
  `;

  card.append(image, actions, overlay);
  card.addEventListener("click", () => openLightbox(photo.id));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter") openLightbox(photo.id);
  });

  return card;
}

async function toggleFavorite(id) {
  const photo = getAllPhotos().find(item => item.id === id);
  if (!photo) return;

  const nextPhoto = { ...photo, favorite: !photo.favorite };
  await savePhoto(nextPhoto);
  state.photos = await getSavedPhotos();
  renderGallery();

  if (state.selectedPhotoId === id) {
    fillLightbox(nextPhoto);
  }
}

async function removePhoto(id) {
  if (!id.startsWith("sample-")) {
    await deletePhoto(id);
    state.photos = await getSavedPhotos();
    renderGallery();
  }
}

function openLightbox(id) {
  const photo = getAllPhotos().find(item => item.id === id);
  if (!photo) return;
  state.selectedPhotoId = id;
  fillLightbox(photo);
  elements.lightbox.showModal();
}

function fillLightbox(photo) {
  elements.lightboxImage.src = photo.src;
  elements.lightboxImage.alt = photo.title;
  elements.lightboxTitle.textContent = photo.title;
  elements.lightboxTags.textContent = (photo.tags || []).map(tag => `#${tag}`).join(" ");
  elements.lightboxCategory.textContent = categoryLabels[photo.category] || "其他";
  elements.lightboxDate.textContent = formatDate(photo.createdAt);
  elements.lightboxSize.textContent = photo.width && photo.height ? `${photo.width} × ${photo.height}` : "未知";
  elements.toggleFavorite.textContent = photo.favorite ? "取消收藏" : "收藏";
  elements.downloadPhoto.href = photo.src;
  elements.downloadPhoto.download = `${photo.title || "photo"}.jpg`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readImageSize(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = src;
  });
}

async function handleUpload(event) {
  event.preventDefault();
  const files = [...elements.fileInput.files].filter(file => file.type.startsWith("image/"));
  if (!files.length) return;

  for (const [index, file] of files.entries()) {
    const src = await readFileAsDataUrl(file);
    const size = await readImageSize(src);
    const baseTitle = elements.photoTitle.value.trim() || file.name.replace(/\.[^.]+$/, "");
    const title = files.length > 1 ? `${baseTitle} ${index + 1}` : baseTitle;
    const tags = elements.photoTags.value
      .split(/[,，]/)
      .map(tag => tag.trim())
      .filter(Boolean);

    await savePhoto({
      id: `local-${crypto.randomUUID()}`,
      title,
      category: elements.photoCategory.value,
      tags,
      src,
      createdAt: new Date().toISOString(),
      favorite: false,
      ...size
    });
  }

  state.photos = await getSavedPhotos();
  elements.uploadDialog.close();
  resetUploadForm();
  renderGallery();
}

function resetUploadForm() {
  elements.uploadForm.reset();
  elements.photoCategory.value = "other";
}

function bindEvents() {
  elements.searchForm.addEventListener("submit", event => {
    event.preventDefault();
    state.search = elements.searchInput.value;
    state.type = elements.typeFilter.value;
    renderGallery();
  });

  elements.searchInput.addEventListener("input", () => {
    state.search = elements.searchInput.value;
    renderGallery();
  });

  elements.typeFilter.addEventListener("change", () => {
    state.type = elements.typeFilter.value;
    renderGallery();
  });

  elements.sortSelect.addEventListener("change", () => {
    state.sort = elements.sortSelect.value;
    renderGallery();
  });

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(item => item.classList.remove("selected"));
      chip.classList.add("selected");
      state.activeCategory = chip.dataset.category;
      state.type = "all";
      elements.typeFilter.value = "all";
      renderGallery();
    });
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
      link.classList.add("active");
      state.activeView = link.dataset.view;
      renderGallery();
    });
  });

  document.querySelectorAll("[data-upload-shortcut]").forEach(button => {
    button.addEventListener("click", () => elements.uploadDialog.showModal());
  });

  elements.openUpload.addEventListener("click", () => elements.uploadDialog.showModal());
  elements.uploadForm.addEventListener("submit", handleUpload);
  elements.clearForm.addEventListener("click", resetUploadForm);
  elements.closeLightbox.addEventListener("click", () => elements.lightbox.close());

  elements.toggleFavorite.addEventListener("click", () => {
    if (state.selectedPhotoId) toggleFavorite(state.selectedPhotoId);
  });

  elements.dropZone.addEventListener("dragover", event => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });

  elements.dropZone.addEventListener("dragleave", () => {
    elements.dropZone.classList.remove("dragging");
  });

  elements.dropZone.addEventListener("drop", event => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
    elements.fileInput.files = event.dataTransfer.files;
  });

  elements.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("pixvault-theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Delete" && state.selectedPhotoId) {
      removePhoto(state.selectedPhotoId);
      elements.lightbox.close();
      state.selectedPhotoId = null;
    }
  });
}

async function init() {
  if (localStorage.getItem("pixvault-theme") === "dark") {
    document.body.classList.add("dark");
  }

  bindEvents();
  state.photos = await getSavedPhotos();
  renderGallery();
}

init().catch(error => {
  console.error(error);
  elements.gallery.innerHTML = "<p>照片库初始化失败，请检查浏览器是否支持 IndexedDB。</p>";
});
