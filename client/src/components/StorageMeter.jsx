import React from 'react';
import { X, HardDrive, Image as ImageIcon, Video, FileText, File } from 'lucide-react';

export default function StorageMeter({ files, onClose }) {
  const totalFiles = files.length;
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  
  // Max storage capacity display target (e.g. 15 GB free tier representation)
  const maxStorageBytes = 15 * 1024 * 1024 * 1024;
  const percentage = Math.min(100, ((totalBytes / maxStorageBytes) * 100)).toFixed(2);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const imagesCount = files.filter(f => f.mimetype?.startsWith('image/')).length;
  const videosCount = files.filter(f => f.mimetype?.startsWith('video/')).length;
  const docsCount = files.filter(f => f.mimetype === 'application/pdf' || f.mimetype?.includes('text')).length;
  const othersCount = totalFiles - (imagesCount + videosCount + docsCount);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HardDrive size={22} color="var(--accent-primary)" />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Storage Usage</h3>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontWeight: 700 }}>
              <span>{formatSize(totalBytes)} used</span>
              <span style={{ color: 'var(--text-secondary)' }}>15 GB free tier</span>
            </div>

            {/* Progress Bar */}
            <div style={{
              height: '12px',
              width: '100%',
              background: 'var(--input-bg)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(percentage, 2)}%`,
                background: 'var(--accent-gradient)',
                borderRadius: '6px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              {percentage}% of storage used
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ImageIcon size={24} color="#ec4899" />
              <div>
                <div style={{ fontWeight: 700 }}>{imagesCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Images</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Video size={24} color="#a855f7" />
              <div>
                <div style={{ fontWeight: 700 }}>{videosCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Videos</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={24} color="#ef4444" />
              <div>
                <div style={{ fontWeight: 700 }}>{docsCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Documents</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <File size={24} color="#6366f1" />
              <div>
                <div style={{ fontWeight: 700 }}>{othersCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Other Files</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', textAlign: 'right', borderTop: '1px solid var(--glass-border)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
