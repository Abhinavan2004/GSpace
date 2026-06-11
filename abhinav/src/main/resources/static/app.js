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

function fileIcon(mime) {
    if (!mime) return '📄';
    if (mime.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf') return '📕';
    if (mime.startsWith('video/')) return '🎬';
    return '📄';
}

function isImage(mime) { return mime && mime.startsWith('image/'); }
function isVideo(mime) { return mime && mime.startsWith('video/'); }
function isPdf(mime)   { return mime === 'application/pdf'; }
function canPreview(mime) { return isImage(mime) || isVideo(mime) || isPdf(mime); }

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
    return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

// ─── Load files ───────────────────────────────────────────────
let allFiles = [];

async function loadFiles() {
    const res = await fetch('/api/files', {
        headers: { Authorization: 'Bearer ' + token }
    });

    if (res.status === 401) { logout(); return; }

    allFiles = await res.json();
    renderFiles(allFiles);
}

// ─── Render — original card layout, just adds View button ─────
function renderFiles(files) {
    const grid = document.getElementById('fileGrid');

    if (files.length === 0) {
        grid.innerHTML = '<p style="color:var(--muted)">No files yet. Upload something!</p>';
        return;
    }

    grid.innerHTML = files.map(f => `
    <div class="file-card">
      <div class="file-icon">${fileIcon(f.mimetype)}</div>
      <div class="file-name">${escapeHtml(f.originalName)}</div>
      <div class="file-size">${formatSize(f.size)}</div>
      <div class="file-actions">
        ${canPreview(f.mimetype)
        ? `<button class="btn-view" onclick="openPreview('${escapeAttr(f.storedName)}','${escapeAttr(f.originalName)}','${escapeAttr(f.mimetype)}')">👁 View</button>`
        : ''}
        <button class="btn-download" onclick="downloadFile('${escapeAttr(f.storedName)}', '${escapeAttr(f.originalName)}')">⬇ Download</button>
        <button class="btn-delete" onclick="deleteFile(${f.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

function filterFiles() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderFiles(allFiles.filter(f => f.originalName.toLowerCase().includes(q)));
}

// ─── Download (unchanged) ─────────────────────────────────────
async function downloadFile(storedName, originalName) {
    const res = await fetch('/api/files/download/' + encodeURIComponent(storedName), {
        headers: { Authorization: 'Bearer ' + token }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Delete (unchanged) ───────────────────────────────────────
async function deleteFile(id) {
    if (!confirm('Delete this file?')) return;
    await fetch('/api/files/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
    });
    loadFiles();
}

// ─── Preview Modal (new) ──────────────────────────────────────
async function openPreview(storedName, originalName, mimetype) {
    document.getElementById('previewTitle').textContent = originalName;
    document.getElementById('modalDownloadBtn').onclick =
        () => downloadFile(storedName, originalName);

    const body = document.getElementById('previewBody');
    body.innerHTML = '<p style="color:var(--muted);padding:2rem">Loading...</p>';
    document.getElementById('previewModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch('/api/files/download/' + encodeURIComponent(storedName), {
            headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);

        if (isImage(mimetype)) {
            body.innerHTML = `<img src="${url}" alt="${escapeHtml(originalName)}"/>`;
        } else if (isVideo(mimetype)) {
            body.innerHTML =
                `<video controls autoplay><source src="${url}" type="${escapeHtml(mimetype)}">
         Your browser cannot play this video.</video>`;
        } else if (isPdf(mimetype)) {
            body.innerHTML = `<iframe src="${url}" title="${escapeHtml(originalName)}"></iframe>`;
        } else {
            body.innerHTML = `<div class="no-preview">
        <div class="big-icon">📄</div>
        <p>No preview available.<br>Use Download to open this file.</p>
      </div>`;
        }
    } catch (e) {
        body.innerHTML = `<div class="no-preview">
      <div class="big-icon">⚠️</div>
      <p>Could not load preview. Try downloading instead.</p>
    </div>`;
    }
}

function closeModal() {
    document.getElementById('previewModal').classList.remove('active');
    document.body.style.overflow = '';
    const body = document.getElementById('previewBody');
    const video = body.querySelector('video');
    if (video) { video.pause(); video.src = ''; }
    body.innerHTML = '';
}

function closePreview(e) {
    if (e.target === document.getElementById('previewModal')) closeModal();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ─── Upload (unchanged) ───────────────────────────────────────
const fileInput    = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

fileInput.addEventListener('change', () => uploadFiles(fileInput.files));

async function uploadFiles(files) {
    if (!files.length) return;
    uploadStatus.textContent = `Uploading ${files.length} file(s)...`;

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: formData
        });

        if (!res.ok) {
            uploadStatus.textContent = '❌ Failed to upload: ' + file.name;
            return;
        }
    }

    uploadStatus.textContent = '✅ Upload complete!';
    setTimeout(() => uploadStatus.textContent = '', 3000);
    fileInput.value = '';
    loadFiles();
}

// ─── Drag & Drop (unchanged) ──────────────────────────────────
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