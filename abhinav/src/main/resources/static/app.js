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

function renderFiles(files) {
    const grid = document.getElementById('fileGrid');

    if (files.length === 0) {
        grid.innerHTML = '<p style="color:var(--muted)">No files yet. Upload something!</p>';
        return;
    }

    grid.innerHTML = files.map(f => `
    <div class="file-card" data-id="${f.id}">
      <div class="file-icon">${fileIcon(f.mimetype)}</div>
      <div class="file-name">${f.originalName}</div>
      <div class="file-size">${formatSize(f.size)}</div>
      <div class="file-actions">
        <button class="btn-download" onclick="downloadFile('${f.storedName}', '${f.originalName}')">⬇ Download</button>
        <button class="btn-delete" onclick="deleteFile(${f.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

function filterFiles() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderFiles(allFiles.filter(f => f.originalName.toLowerCase().includes(q)));
}

// ─── Download ─────────────────────────────────────────────────
async function downloadFile(storedName, originalName) {
    const res = await fetch('/api/files/download/' + storedName, {
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
    await fetch('/api/files/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
    });
    loadFiles();
}

// ─── Upload ───────────────────────────────────────────────────
const fileInput = document.getElementById('fileInput');
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