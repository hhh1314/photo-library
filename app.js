const config = window.PIXVAULT_SUPABASE || {};
const missingConfig = !config.url || !config.anonKey || config.url.includes("PASTE_") || config.anonKey.includes("PASTE_");
const supabaseClient = missingConfig ? null : window.supabase.createClient(config.url, config.anonKey);
const bucketName = config.bucket || "photos";
const ADMIN_USER = "123456";
const ADMIN_PASSWORD = "123456";
const LOGIN_SESSION_KEY = "pixvault-admin-session";

const state = {
  captchaAnswer: "",
  photos: [],
  filter: "all",
  category: "all",
  search: "",
  sort: "newest",
  selectedId: null,
  weatherCoords: null
};

const categoryLabels = {
  nature: "自然",
  city: "城市",
  people: "人物",
  science: "科研",
  other: "其他"
};

const weatherDescriptions = {
  0: ["晴朗", "sun"],
  1: ["大部晴朗", "sun"],
  2: ["局部多云", "cloud"],
  3: ["阴天", "cloud"],
  45: ["有雾", "cloud"],
  48: ["雾凇", "cloud"],
  51: ["小毛毛雨", "rain"],
  53: ["毛毛雨", "rain"],
  55: ["较强毛毛雨", "rain"],
  61: ["小雨", "rain"],
  63: ["中雨", "rain"],
  65: ["大雨", "rain"],
  71: ["小雪", "cloud"],
  73: ["中雪", "cloud"],
  75: ["大雪", "cloud"],
  80: ["阵雨", "rain"],
  81: ["较强阵雨", "rain"],
  82: ["强阵雨", "rain"],
  95: ["雷雨", "rain"]
};

const el = {
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  username: document.querySelector("#username"),
  password: document.querySelector("#password"),
  captcha: document.querySelector("#captcha"),
  captchaImage: document.querySelector("#captchaImage"),
  refreshCaptcha: document.querySelector("#refreshCaptcha"),
  loginMessage: document.querySelector("#loginMessage"),
  signupButton: document.querySelector("#signupButton"),
  logoutButton: document.querySelector("#logoutButton"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  uploadForm: document.querySelector("#uploadForm"),
  fileInput: document.querySelector("#fileInput"),
  titleInput: document.querySelector("#titleInput"),
  categoryInput: document.querySelector("#categoryInput"),
  tagsInput: document.querySelector("#tagsInput"),
  uploadMessage: document.querySelector("#uploadMessage"),
  sortSelect: document.querySelector("#sortSelect"),
  gallery: document.querySelector("#gallery"),
  galleryTitle: document.querySelector("#galleryTitle"),
  galleryMeta: document.querySelector("#galleryMeta"),
  emptyState: document.querySelector("#emptyState"),
  viewer: document.querySelector("#viewer"),
  closeViewer: document.querySelector("#closeViewer"),
  viewerImage: document.querySelector("#viewerImage"),
  viewerTitle: document.querySelector("#viewerTitle"),
  viewerTags: document.querySelector("#viewerTags"),
  viewerDate: document.querySelector("#viewerDate"),
  favoriteButton: document.querySelector("#favoriteButton"),
  downloadButton: document.querySelector("#downloadButton"),
  weatherOrb: document.querySelector("#weatherOrb"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherSummary: document.querySelector("#weatherSummary"),
  weatherPlace: document.querySelector("#weatherPlace"),
  weatherFeels: document.querySelector("#weatherFeels"),
  weatherHumidity: document.querySelector("#weatherHumidity"),
  weatherWind: document.querySelector("#weatherWind"),
  refreshWeather: document.querySelector("#refreshWeather")
};

function requireClient() {
  if (!supabaseClient) {
    throw new Error("还没有填写 Supabase Project URL 和 anon public key。");
  }
  return supabaseClient;
}

function refreshCaptcha() {
  const answer = String(1000 + Math.floor(Math.random() * 9000));
  state.captchaAnswer = answer;
  el.captcha.value = "";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="58" viewBox="0 0 160 58">
  <rect width="160" height="58" rx="8" fill="#eef6f1"/>
  <path d="M8 43 C28 14, 52 48, 78 22 S126 39, 152 16" fill="none" stroke="#00a678" stroke-width="3" opacity=".45"/>
  <path d="M12 18 L151 43 M24 51 L139 8" stroke="#6d7d74" stroke-width="1.4" opacity=".35"/>
  <text x="80" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="7" fill="#13221b">${answer}</text>
</svg>`;
  el.captchaImage.src = `data:image/svg+xml;base64,${btoa(svg)}`;
}

function checkCaptcha() {
  if (el.captcha.value.trim() !== state.captchaAnswer) {
    refreshCaptcha();
    throw new Error("验证码不正确，请重新输入。");
  }
}

async function login(event) {
  event.preventDefault();
  el.loginMessage.textContent = "";

  try {
    checkCaptcha();
    requireClient();
    if (el.username.value.trim() !== ADMIN_USER || el.password.value !== ADMIN_PASSWORD) {
      throw new Error("管理员账号或密码不正确。");
    }
    sessionStorage.setItem(LOGIN_SESSION_KEY, "ok");
    await showApp();
  } catch (error) {
    el.loginMessage.textContent = error.message;
  }
}

async function signup() {
  el.loginMessage.textContent = "";
  refreshCaptcha();
}

async function logout() {
  sessionStorage.removeItem(LOGIN_SESSION_KEY);
  el.appShell.classList.add("hidden");
  el.loginScreen.classList.remove("hidden");
  refreshCaptcha();
}

async function showApp() {
  el.loginScreen.classList.add("hidden");
  el.appShell.classList.remove("hidden");
  loadWeather();
  await loadPhotos();
}

async function loadPhotos() {
  const client = requireClient();
  const { data, error } = await client
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const photos = await Promise.all((data || []).map(async photo => {
    const publicUrl = client.storage
      .from(bucketName)
      .getPublicUrl(photo.storage_path);

    return {
      id: photo.id,
      title: photo.title,
      category: photo.category || "other",
      tags: photo.tags || [],
      src: publicUrl.data?.publicUrl || "",
      storagePath: photo.storage_path,
      createdAt: photo.created_at,
      favorite: Boolean(photo.favorite),
      size: Number(photo.file_size || 0),
      ownerId: photo.owner_id
    };
  }));

  state.photos = photos;
  renderGallery();
}

function filteredPhotos() {
  let photos = [...state.photos];
  const query = state.search.toLowerCase().trim();

  if (state.filter === "favorites") {
    photos = photos.filter(photo => photo.favorite);
  } else if (state.filter === "recent") {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    photos = photos.filter(photo => new Date(photo.createdAt).getTime() >= weekAgo);
  }

  if (state.category !== "all") {
    photos = photos.filter(photo => photo.category === state.category);
  }

  if (query) {
    photos = photos.filter(photo => {
      const text = [photo.title, photo.category, ...(photo.tags || [])].join(" ").toLowerCase();
      return text.includes(query);
    });
  }

  photos.sort((a, b) => {
    if (state.sort === "favorite") return Number(b.favorite) - Number(a.favorite);
    if (state.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return photos;
}

function renderGallery() {
  const photos = filteredPhotos();
  el.gallery.innerHTML = "";
  el.emptyState.classList.toggle("hidden", photos.length > 0);
  el.galleryTitle.textContent = state.filter === "favorites"
    ? "收藏照片"
    : state.filter === "recent"
      ? "最近上传"
      : "全部照片";
  el.galleryMeta.textContent = `${photos.length} 张照片来自 Supabase。`;

  const fragment = document.createDocumentFragment();
  photos.forEach(photo => fragment.appendChild(createCard(photo)));
  el.gallery.appendChild(fragment);
}

function createCard(photo) {
  const card = document.createElement("article");
  card.className = "photo-card";

  const image = document.createElement("img");
  image.src = photo.src;
  image.alt = photo.title;
  image.loading = "lazy";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const favorite = document.createElement("button");
  favorite.className = `icon-button ${photo.favorite ? "favorite-on" : ""}`;
  favorite.type = "button";
  favorite.textContent = "♥";
  favorite.title = photo.favorite ? "取消收藏" : "收藏";
  favorite.addEventListener("click", event => {
    event.stopPropagation();
    toggleFavorite(photo.id);
  });

  const open = document.createElement("button");
  open.className = "icon-button";
  open.type = "button";
  open.textContent = "↗";
  open.title = "查看";
  open.addEventListener("click", event => {
    event.stopPropagation();
    openViewer(photo.id);
  });

  actions.append(favorite, open);

  const overlay = document.createElement("div");
  overlay.className = "photo-overlay";
  overlay.innerHTML = `
    <h3>${escapeHtml(photo.title)}</h3>
    <p>${escapeHtml(categoryLabels[photo.category] || "其他")} · ${formatDate(photo.createdAt)}</p>
  `;

  card.append(image, actions, overlay);
  card.addEventListener("click", () => openViewer(photo.id));
  return card;
}

async function uploadPhoto(event) {
  event.preventDefault();
  const file = el.fileInput.files[0];
  if (!file) return;

  el.uploadMessage.textContent = "正在上传...";
  try {
    const client = requireClient();
    const ext = extensionFor(file);
    const path = `uploads/${crypto.randomUUID()}${ext}`;
    const upload = await client.storage.from(bucketName).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });
    if (upload.error) throw upload.error;

    const tags = el.tagsInput.value
      .split(/[,，]/)
      .map(tag => tag.trim())
      .filter(Boolean)
      .slice(0, 12);

    const insert = await client.from("photos").insert({
      title: sanitizeText(el.titleInput.value, file.name.replace(/\.[^.]+$/, "")),
      category: el.categoryInput.value || "other",
      tags,
      storage_path: path,
      file_size: file.size,
      content_type: file.type || "application/octet-stream",
      favorite: false
    });
    if (insert.error) throw insert.error;

    el.uploadForm.reset();
    el.categoryInput.value = "other";
    el.uploadMessage.textContent = "上传成功";
    await loadPhotos();
  } catch (error) {
    el.uploadMessage.textContent = error.message;
  }
}

async function toggleFavorite(id) {
  const client = requireClient();
  const photo = state.photos.find(item => item.id === id);
  if (!photo) return;

  const { data, error } = await client
    .from("photos")
    .update({ favorite: !photo.favorite })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    el.galleryMeta.textContent = `收藏失败：${error.message}`;
    return;
  }

  const updated = { ...photo, favorite: Boolean(data.favorite) };
  state.photos = state.photos.map(item => item.id === id ? updated : item);
  renderGallery();
  if (state.selectedId === id) fillViewer(updated);
}

function openViewer(id) {
  const photo = state.photos.find(item => item.id === id);
  if (!photo) return;
  state.selectedId = id;
  fillViewer(photo);
  el.viewer.showModal();
}

function fillViewer(photo) {
  el.viewerImage.src = photo.src;
  el.viewerImage.alt = photo.title;
  el.viewerTitle.textContent = photo.title;
  el.viewerTags.textContent = (photo.tags || []).map(tag => `#${tag}`).join(" ");
  el.viewerDate.textContent = `${categoryLabels[photo.category] || "其他"} · ${formatDate(photo.createdAt)} · ${formatBytes(photo.size)}`;
  el.favoriteButton.textContent = photo.favorite ? "取消收藏" : "收藏";
  el.downloadButton.href = photo.src;
  el.downloadButton.download = photo.title;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "未知大小";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function extensionFor(file) {
  const byType = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif"
  };
  const fallback = file.name.includes(".") ? `.${file.name.split(".").pop().toLowerCase()}` : ".jpg";
  return byType[file.type] || fallback;
}

function sanitizeText(value, fallback) {
  const text = String(value || "").trim();
  return text ? text.slice(0, 80) : fallback;
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("浏览器不支持定位"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: "当前位置"
      }),
      reject,
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 15 * 60 * 1000
      }
    );
  });
}

async function loadWeather(force = false) {
  if (!el.weatherTemp) return;
  el.weatherTemp.textContent = "读取中";
  el.weatherSummary.textContent = "正在获取当地天气。";

  let coords = state.weatherCoords;
  let usedFallback = false;
  if (!coords || force) {
    try {
      coords = await getBrowserPosition();
    } catch {
      usedFallback = true;
      coords = {
        latitude: 31.2304,
        longitude: 121.4737,
        label: "上海"
      };
    }
    state.weatherCoords = coords;
  }

  try {
    const params = new URLSearchParams({
      latitude: coords.latitude,
      longitude: coords.longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
      timezone: "auto"
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("天气接口不可用");
    const data = await response.json();
    renderWeather(data.current, coords.label, usedFallback);
  } catch {
    el.weatherTemp.textContent = "--";
    el.weatherSummary.textContent = "天气暂时读取失败，稍后再刷新。";
    el.weatherPlace.textContent = coords.label;
  }
}

function renderWeather(current, place, usedFallback) {
  const code = Number(current.weather_code);
  const [description, mood] = weatherDescriptions[code] || ["天气变化中", "cloud"];
  const temp = Math.round(current.temperature_2m);
  const feels = Math.round(current.apparent_temperature);

  el.weatherOrb.classList.remove("rain", "cloud");
  if (mood !== "sun") el.weatherOrb.classList.add(mood);
  el.weatherTemp.textContent = `${temp}°C`;
  el.weatherSummary.textContent = usedFallback
    ? `${description}。未获得定位权限，当前显示上海天气。`
    : `${description}。天气数据来自 Open-Meteo。`;
  el.weatherPlace.textContent = place;
  el.weatherFeels.textContent = `${feels}°C`;
  el.weatherHumidity.textContent = `${current.relative_humidity_2m}%`;
  el.weatherWind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bindEvents() {
  el.loginForm.addEventListener("submit", login);
  el.signupButton.addEventListener("click", signup);
  el.refreshCaptcha.addEventListener("click", refreshCaptcha);
  el.logoutButton.addEventListener("click", logout);
  el.uploadForm.addEventListener("submit", uploadPhoto);

  el.searchForm.addEventListener("submit", event => event.preventDefault());
  el.searchInput.addEventListener("input", () => {
    state.search = el.searchInput.value;
    renderGallery();
  });
  el.categoryFilter.addEventListener("change", () => {
    state.category = el.categoryFilter.value;
    renderGallery();
  });
  el.sortSelect.addEventListener("change", () => {
    state.sort = el.sortSelect.value;
    renderGallery();
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      state.filter = tab.dataset.filter;
      renderGallery();
    });
  });

  el.closeViewer.addEventListener("click", () => el.viewer.close());
  el.favoriteButton.addEventListener("click", () => {
    if (state.selectedId) toggleFavorite(state.selectedId);
  });
  el.refreshWeather.addEventListener("click", () => loadWeather(true));
}

async function init() {
  bindEvents();
  refreshCaptcha();

  if (!supabaseClient) {
    el.loginMessage.textContent = "请先在 supabase-config.js 填入 Project URL 和 anon public key。";
    return;
  }

  if (sessionStorage.getItem(LOGIN_SESSION_KEY) === "ok") {
    await showApp();
  }
}

init().catch(error => {
  el.loginMessage.textContent = error.message;
});
