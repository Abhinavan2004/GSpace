// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

document.getElementById('username-display').textContent =
    '👤 ' + (localStorage.getItem('username') || '');

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}

// ─── Helpers ──────────────────────────────────────────────────
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(mime) { return mime && mime.startsWith('image/'); }
function isVideo(mime) { return mime && mime.startsWith('video/'); }
function isPdf(mime)   { return mime === 'application/pdf'; }
function canPreview(mime) { return isImage(mime) || isVideo(mime) || isPdf(mime); }

function fileIcon(mime) {
    if (!mime) return '📄';
    if (isImage(mime)) return '🖼️';
    if (isPdf(mime))   return '📕';
    if (isVideo(mime)) return '🎬';
    return '📄';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function authFetch(url, opts = {}) {
    return fetch(url, {
        ...opts,
        headers: {
            ...(opts.headers || {}),
            Authorization: 'Bearer ' + token
        }
    });
}

// ─── Load files ───────────────────────────────────────────────
let allFiles = [];

async function loadFiles() {
    try {
        const res = await authFetch('/api/files');
        if (res.status === 401) { logout(); return; }
        allFiles = await res.json();
        renderFiles(allFiles);
    } catch (e) {
        document.getElementById('fileGrid').innerHTML =
            '<p style="color:var(--danger)">Could not load files. Is server running?</p>';
    }
}

// ─── Render cards ─────────────────────────────────────────────
function renderFiles(files) {
    const grid = document.getElementById('fileGrid');

    if (!files.length) {
        grid.innerHTML = '<p style="color:var(--muted)">No files yet. Upload something!</p>';
        return;
    }

    grid.innerHTML = files.map(f => {
        // Top preview area
        let previewHtml;
        if (isImage(f.mimetype)) {
            // Placeholder first; real thumbnail loaded below via loadThumbnails()
            previewHtml = `<div class="file-preview">
        <img data-stored="${escapeHtml(f.storedName)}" src="" alt="${escapeHtml(f.originalName)}"/>
      </div>`;
        } else if (isVideo(f.mimetype)) {
            previewHtml = `<div class="file-preview">
        <span class="file-icon-large">🎬</span>
        <span class="play-badge">▶</span>
      </div>`;
        } else {
            previewHtml = `<div class="file-preview">
        <span class="file-icon-large">${fileIcon(f.mimetype)}</span>
      </div>`;
        }

        const preview = canPreview(f.mimetype);
        // data attributes used by the card click handler
        const cardAttrs = preview
            ? `data-stored="${escapeHtml(f.storedName)}" data-name="${escapeHtml(f.originalName)}" data-mime="${escapeHtml(f.mimetype || '')}"`
            : '';

        return `
      <div class="file-card" ${cardAttrs} onclick="handleCardClick(event, this)">
        ${previewHtml}
        <div class="file-info">
          <div class="file-name">${escapeHtml(f.originalName)}</div>
          <div class="file-size">${formatSize(f.size)}</div>
        </div>
        <div class="file-actions">
          <button class="btn-download"
            onclick="event.stopPropagation(); downloadFile('${escapeHtml(f.storedName)}','${escapeHtml(f.originalName)}')">
            ⬇ Download
          </button>
          <button class="btn-delete"
            onclick="event.stopPropagation(); deleteFile(${f.id})">
            🗑
          </button>
        </div>
      </div>`;
    }).join('');

    loadThumbnails();
}

// Card click → open preview if file supports it
function handleCardClick(event, card) {
    // Ignore if a button inside was clicked (stopPropagation handles it)
    const stored = card.getAttribute('data-stored');
    const name   = card.getAttribute('data-name');
    const mime   = card.getAttribute('data-mime');
    if (stored && name) openPreview(stored, name, mime);
}

// ─── Load image thumbnails ─────────────────────────────────────
// Loads images in batches so we don't hit server with 50 requests at once
async function loadThumbnails() {
    const imgs = Array.from(document.querySelectorAll('.file-preview img[data-stored]'));
    // Process 4 at a time
    for (let i = 0; i < imgs.length; i += 4) {
        const batch = imgs.slice(i, i + 4);
        await Promise.all(batch.map(async img => {
            try {
                const res = await authFetch('/api/files/download/' + encodeURIComponent(img.dataset.stored));
                if (res.ok) {
                    const blob = await res.blob();
                    img.src = URL.createObjectURL(blob);
                }
            } catch (e) { /* silent fail — icon stays */ }
        }));
    }
}

// ─── Search ───────────────────────────────────────────────────
function filterFiles() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderFiles(allFiles.filter(f => f.originalName.toLowerCase().includes(q)));
}

// ─── Download ─────────────────────────────────────────────────
async function downloadFile(storedName, originalName) {
    const res = await authFetch('/api/files/download/' + encodeURIComponent(storedName));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Delete ───────────────────────────────────────────────────
async function deleteFile(id) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    const res = await authFetch('/api/files/' + id, { method: 'DELETE' });
    if (res.ok) loadFiles();
    else alert('Delete failed. Please try again.');
}

// ─── Preview Modal ────────────────────────────────────────────
async function openPreview(storedName, originalName, mimetype) {
    document.getElementById('previewTitle').textContent = originalName;
    document.getElementById('modalDownloadBtn').onclick =
        () => downloadFile(storedName, originalName);

    const body = document.getElementById('previewBody');
    body.innerHTML = '<p style="color:var(--muted);padding:2rem;text-align:center">Loading...</p>';
    document.getElementById('previewModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        const res = await authFetch('/api/files/download/' + encodeURIComponent(storedName));
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);

        if (isImage(mimetype)) {
            body.innerHTML = `<img src="${url}" alt="${escapeHtml(originalName)}"/>`;
        } else if (isVideo(mimetype)) {
            body.innerHTML = `<video controls autoplay>
        <source src="${url}" type="${escapeHtml(mimetype)}">
        Your browser cannot play this video.
      </video>`;
        } else if (isPdf(mimetype)) {
            body.innerHTML = `<iframe src="${url}" title="${escapeHtml(originalName)}"></iframe>`;
        } else {
            body.innerHTML = `<div class="no-preview">
        <span class="big-icon">📄</span>
        <p>No preview available for this file type.<br>Use the Download button to open it.</p>
      </div>`;
        }
    } catch (e) {
        body.innerHTML = `<div class="no-preview">
      <span class="big-icon">⚠️</span>
      <p>Could not load preview.<br>Try downloading instead.</p>
    </div>`;
    }
}

function closeModal() {
    document.getElementById('previewModal').classList.remove('active');
    document.body.style.overflow = '';
    const body = document.getElementById('previewBody');
    const video = body.querySelector('video');
    if (video) { video.pause(); video.src = ''; }
    const img = body.querySelector('img');
    if (img && img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
    const iframe = body.querySelector('iframe');
    if (iframe && iframe.src.startsWith('blob:')) URL.revokeObjectURL(iframe.src);
    body.innerHTML = '';
}

function closePreview(e) {
    if (e.target === document.getElementById('previewModal')) closeModal();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ─── Upload ───────────────────────────────────────────────────
const fileInput    = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

fileInput.addEventListener('change', () => uploadFiles(fileInput.files));

async function uploadFiles(files) {
    if (!files.length) return;
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadStatus.textContent = `Uploading ${file.name} (${i + 1}/${total})...`;
        const formData = new FormData();
        formData.append('file', file);

        const res = await authFetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            uploadStatus.textContent = '❌ Failed: ' + file.name;
            return;
        }
    }

    uploadStatus.textContent = `✅ ${total} file(s) uploaded!`;
    setTimeout(() => uploadStatus.textContent = '', 3000);
    fileInput.value = '';
    loadFiles();
}

// ─── Drag & Drop ──────────────────────────────────────────────
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    uploadFiles(e.dataTransfer.files);
});

// ─── Init ─────────────────────────────────────────────────────
loadFiles();