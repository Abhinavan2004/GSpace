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

function isImage(mime) {
    return mime && mime.startsWith('image/');
}

function isVideo(mime) {
    return mime && mime.startsWith('video/');
}

function isPdf(mime) {
    return mime === 'application/pdf';
}

function fileIcon(mime) {
    if (!mime) return '📄';
    if (isImage(mime)) return '🖼️';
    if (isPdf(mime))   return '📕';
    if (isVideo(mime)) return '🎬';
    return '📄';
}

function canPreview(mime) {
    return isImage(mime) || isVideo(mime) || isPdf(mime);
}

// Build authenticated URL for viewing/downloading
function fileUrl(storedName) {
    return '/api/files/download/' + encodeURIComponent(storedName);
}

// ─── Load files ───────────────────────────────────────────────
let allFiles = [];

async function loadFiles() {
    try {
        const res = await fetch('/api/files', {
            headers: { Authorization: 'Bearer ' + token }
        });
        if (res.status === 401) { logout(); return; }
        allFiles = await res.json();
        renderFiles(allFiles);
    } catch (e) {
        document.getElementById('fileGrid').innerHTML =
            '<p style="color:var(--danger)">Could not load files. Is the server running?</p>';
    }
}

function renderFiles(files) {
    const grid = document.getElementById('fileGrid');

    if (files.length === 0) {
        grid.innerHTML = '<p style="color:var(--muted)">No files yet. Upload something!</p>';
        return;
    }

    grid.innerHTML = files.map(f => {
        const preview = canPreview(f.mimetype);

        // Thumbnail HTML
        let thumbHtml = '';
        if (isImage(f.mimetype)) {
            // We load image lazily via data-src to avoid many simultaneous auth fetches
            thumbHtml = `<div class="file-thumb">
        <img data-stored="${f.storedName}" src="" alt="${f.originalName}" loading="lazy"/>
      </div>`;
        } else if (isVideo(f.mimetype)) {
            thumbHtml = `<div class="file-thumb">
        <span class="thumb-icon">🎬</span>
        <span class="play-overlay">▶</span>
      </div>`;
        } else {
            thumbHtml = `<div class="file-thumb">
        <span class="thumb-icon">${fileIcon(f.mimetype)}</span>
      </div>`;
        }

        return `
      <div class="file-card">
        ${thumbHtml}
        <div class="file-info">
          <div class="file-name">${escapeHtml(f.originalName)}</div>
          <div class="file-size">${formatSize(f.size)}</div>
        </div>
        <div class="file-actions">
          ${preview
            ? `<button class="btn-view"     onclick="openPreview('${f.storedName}','${escapeAttr(f.originalName)}','${f.mimetype}')">👁 View</button>`
            : ''}
          <button class="btn-download" onclick="downloadFile('${f.storedName}','${escapeAttr(f.originalName)}')">⬇</button>
          <button class="btn-delete"   onclick="deleteFile(${f.id})">🗑</button>
        </div>
      </div>
    `;
    }).join('');

    // After rendering, load image thumbnails
    loadThumbnails();
}

// Load image thumbnails by fetching with auth token as blob URLs
async function loadThumbnails() {
    const imgs = document.querySelectorAll('.file-thumb img[data-stored]');
    for (const img of imgs) {
        const storedName = img.getAttribute('data-stored');
        try {
            const res = await fetch(fileUrl(storedName), {
                headers: { Authorization: 'Bearer ' + token }
            });
            if (res.ok) {
                const blob = await res.blob();
                img.src = URL.createObjectURL(blob);
            }
        } catch (e) {
            // Thumbnail failed silently — card still shows
        }
    }
}

function filterFiles() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderFiles(allFiles.filter(f => f.originalName.toLowerCase().includes(q)));
}

// ─── Escape helpers ───────────────────────────────────────────
function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ─── Download ─────────────────────────────────────────────────
async function downloadFile(storedName, originalName) {
    const res = await fetch(fileUrl(storedName), {
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

// ─── Delete ───────────────────────────────────────────────────
async function deleteFile(id) {
    if (!confirm('Delete this file?')) return;
    const res = await fetch('/api/files/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
    });
    if (res.ok) loadFiles();
    else alert('Delete failed.');
}

// ─── Preview Modal ────────────────────────────────────────────
let currentPreview = null; // { storedName, originalName }

async function openPreview(storedName, originalName, mimetype) {
    currentPreview = { storedName, originalName };

    document.getElementById('previewTitle').textContent = originalName;
    document.getElementById('modalDownloadBtn').onclick =
        () => downloadFile(storedName, originalName);

    const body = document.getElementById('previewBody');
    body.innerHTML = '<p style="color:var(--muted);padding:2rem">Loading preview...</p>';

    // Show modal immediately with loading state
    document.getElementById('previewModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch(fileUrl(storedName), {
            headers: { Authorization: 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Fetch failed');

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (isImage(mimetype)) {
            body.innerHTML = `<img src="${objectUrl}" alt="${escapeHtml(originalName)}"/>`;
        } else if (isVideo(mimetype)) {
            body.innerHTML = `
        <video controls autoplay>
          <source src="${objectUrl}" type="${mimetype}">
          Your browser does not support this video format.
        </video>`;
        } else if (isPdf(mimetype)) {
            body.innerHTML = `<iframe src="${objectUrl}" title="${escapeHtml(originalName)}"></iframe>`;
        } else {
            showNoPreview(body, originalName);
        }
    } catch (e) {
        body.innerHTML = `<div class="no-preview">
      <div class="big-icon">⚠️</div>
      <p>Could not load preview. Try downloading instead.</p>
    </div>`;
    }
}

function showNoPreview(body, name) {
    body.innerHTML = `<div class="no-preview">
    <div class="big-icon">📄</div>
    <p><strong>${escapeHtml(name)}</strong></p>
    <p style="margin-top:0.5rem">Preview not available for this file type.<br>Use Download to open it.</p>
  </div>`;
}

function closeModal() {
    document.getElementById('previewModal').classList.remove('active');
    document.body.style.overflow = '';

    // Clean up blob URLs and media elements to free memory
    const body = document.getElementById('previewBody');
    const video = body.querySelector('video');
    if (video) { video.pause(); video.src = ''; }

    const img = body.querySelector('img');
    if (img && img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);

    const iframe = body.querySelector('iframe');
    if (iframe && iframe.src.startsWith('blob:')) URL.revokeObjectURL(iframe.src);

    body.innerHTML = '';
    currentPreview = null;
}

// Close when clicking outside the modal box
function closePreview(event) {
    if (event.target === document.getElementById('previewModal')) closeModal();
}

// Close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ─── Upload ───────────────────────────────────────────────────
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

fileInput.addEventListener('change', () => uploadFiles(fileInput.files));

async function uploadFiles(files) {
    if (!files.length) return;

    const total = files.length;
    let done = 0;

    for (const file of files) {
        uploadStatus.textContent = `Uploading ${file.name} (${done + 1}/${total})...`;
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/files/upload', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: formData
        });

        if (!res.ok) {
            uploadStatus.textContent = '❌ Failed: ' + file.name;
            return;
        }
        done++;
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