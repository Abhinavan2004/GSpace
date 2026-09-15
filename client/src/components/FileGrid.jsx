import React, { useState } from 'react';
import { 
  Search, Grid, List, Download, Trash2, Eye, 
  FileText, Image as ImageIcon, Video, FileCode, Archive, File
} from 'lucide-react';

export default function FileGrid({ files, onDelete, onPreview, token }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, name-asc, size-desc

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileIcon = (mime = '', originalName = '') => {
    const ext = originalName.split('.').pop()?.toLowerCase();
    if (mime.startsWith('image/')) return <ImageIcon size={28} color="#ec4899" />;
    if (mime.startsWith('video/')) return <Video size={28} color="#a855f7" />;
    if (mime === 'application/pdf') return <FileText size={28} color="#ef4444" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive size={28} color="#f59e0b" />;
    if (['js', 'html', 'css', 'json', 'py', 'java', 'cpp'].includes(ext)) return <FileCode size={28} color="#06b6d4" />;
    return <File size={28} color="#6366f1" />;
  };

  const handleDownload = (storedName, originalName) => {
    const url = `/api/files/download/${encodeURIComponent(storedName)}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = originalName;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(err => console.error('Download error:', err));
  };

  // Filter & Sort
  const filteredFiles = files.filter(f => 
    f.originalName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name-asc') return a.originalName.localeCompare(b.originalName);
    if (sortBy === 'size-desc') return (b.size || 0) - (a.size || 0);
    return 0;
  });

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="size-desc">Largest Size</option>
          </select>

          <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List View */}
      {filteredFiles.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            {search ? 'No files match your search criteria.' : 'No files stored yet. Upload your first file!'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="file-grid">
          {filteredFiles.map(file => {
            const isImage = file.mimetype?.startsWith('image/');
            return (
              <div key={file.id} className="file-card">
                <div 
                  className="file-preview-area"
                  onClick={() => onPreview(file)}
                >
                  {isImage ? (
                    <img 
                      src={`/api/files/download/${encodeURIComponent(file.storedName)}`}
                      alt={file.originalName}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      {getFileIcon(file.mimetype, file.originalName)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {file.originalName.split('.').pop() || 'FILE'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="file-info-area">
                  <span className="file-title" title={file.originalName}>
                    {file.originalName}
                  </span>
                  <div className="file-meta">
                    <span>{formatSize(file.size)}</span>
                    <span>{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div className="file-card-actions">
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => onPreview(file)}
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleDownload(file.storedName, file.originalName)}
                  >
                    <Download size={14} /> Download
                  </button>
                  <button 
                    className="btn btn-danger btn-icon" 
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => onDelete(file.id)}
                    title="Delete File"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="file-list">
          {filteredFiles.map(file => (
            <div 
              key={file.id} 
              className="glass-panel" 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flex: 1, overflow: 'hidden' }}
                onClick={() => onPreview(file)}
              >
                {getFileIcon(file.mimetype, file.originalName)}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.originalName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {formatSize(file.size)} • {file.createdAt ? new Date(file.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => onPreview(file)}
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleDownload(file.storedName, file.originalName)}
                >
                  <Download size={16} />
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => onDelete(file.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
