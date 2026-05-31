// ─── Auth guard ───────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

const currentUsername = localStorage.getItem('username') || 'User';
document.getElementById('username-display').textContent = currentUsername;

// Set the initials avatar in navbar
const avatarEl = document.getElementById('user-avatar');
if (avatarEl) {
    avatarEl.textContent = currentUsername.charAt(0).toUpperCase();
}

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}

// ─── Helpers ──────────────────────────────────────────────────
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileIcon(mime) {
    if (!mime) return '📄';
    if (mime.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf') return '📕';
    if (mime.startsWith('video/')) return '🎬';
    if (mime.startsWith('audio/')) return '🎵';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('compressed')) return '📦';
    return '📄';
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
        const grid = document.getElementById('fileGrid');
        grid.innerHTML = '<p class="error-msg">⚠️ Failed to connect to server. Check your connection.</p>';
    }
}

function renderFiles(files) {
    const grid = document.getElementById('fileGrid');

    if (files.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📁</span>
                <p>No files uploaded yet.</p>
                <p class="empty-sub">Use the drag & drop area or click "Browse Files" above to get started.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = files.map(f => {
        // Extract display name or trim long names
        let displayName = f.originalName;
        if (displayName.length > 22) {
            displayName = displayName.substring(0, 19) + '...';
        }
        
        return `
        <div class="file-card animate-scale-up" data-id="${f.id}">
          <div class="file-card-top">
            <span class="file-type-badge">${f.mimetype ? f.mimetype.split('/')[0] : 'file'}</span>
            <button class="btn-delete-icon" onclick="deleteFile(${f.id})" title="Delete File">🗑️</button>
          </div>
          <div class="file-icon-wrapper">${fileIcon(f.mimetype)}</div>
          <div class="file-meta">
            <div class="file-name" title="${f.originalName}">${displayName}</div>
            <div class="file-size">${formatSize(f.size)}</div>
          </div>
          <div class="file-card-actions">
            <button class="btn-download-premium" onclick="downloadFile('${f.storedName}', '${f.originalName}')">
                <span>Download</span>
                <span class="icon-down">⬇️</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
}

function filterFiles() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderFiles(allFiles.filter(f => f.originalName.toLowerCase().includes(q)));
}

// ─── Download ─────────────────────────────────────────────────
async function downloadFile(storedName, originalName) {
    try {
        const res = await fetch('/api/files/download/' + storedName, {
            headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('❌ Error downloading file. Please try again.');
    }
}

// ─── Delete ───────────────────────────────────────────────────
async function deleteFile(id) {
    if (!confirm('Are you sure you want to permanently delete this file?')) return;
    try {
        const res = await fetch('/api/files/' + id, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) throw new Error();
        loadFiles();
    } catch (e) {
        alert('❌ Failed to delete file.');
    }
}

// ─── Upload ───────────────────────────────────────────────────
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');

fileInput.addEventListener('change', () => uploadFiles(fileInput.files));

async function uploadFiles(files) {
    if (!files.length) return;
    
    uploadStatus.innerHTML = '';
    uploadStatus.style.display = 'block';
    
    let uploadedCount = 0;
    
    for (const file of files) {
        // Create an elegant progress line
        const fileStatusEl = document.createElement('div');
        fileStatusEl.className = 'upload-file-row';
        fileStatusEl.innerHTML = `
            <span class="upload-file-name">📤 ${file.name}</span>
            <span class="upload-file-badge loading">Uploading...</span>
        `;
        uploadStatus.appendChild(fileStatusEl);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/files/upload', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token },
                body: formData
            });

            if (!res.ok) {
                fileStatusEl.querySelector('.upload-file-badge').className = 'upload-file-badge error';
                fileStatusEl.querySelector('.upload-file-badge').textContent = 'Failed';
                continue;
            }
            
            fileStatusEl.querySelector('.upload-file-badge').className = 'upload-file-badge success';
            fileStatusEl.querySelector('.upload-file-badge').textContent = 'Completed';
            uploadedCount++;
        } catch (e) {
            fileStatusEl.querySelector('.upload-file-badge').className = 'upload-file-badge error';
            fileStatusEl.querySelector('.upload-file-badge').textContent = 'Error';
        }
    }

    // Refresh file list
    loadFiles();
    
    // Automatically fade out the status window after a delay
    setTimeout(() => {
        uploadStatus.style.display = 'none';
        uploadStatus.innerHTML = '';
    }, 4000);
    
    fileInput.value = '';
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