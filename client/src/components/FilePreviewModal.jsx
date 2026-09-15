import React from 'react';
import { X, Download, FileText, Film, Image as ImageIcon } from 'lucide-react';

export default function FilePreviewModal({ file, onClose, token }) {
  if (!file) return null;

  const downloadUrl = `/api/files/download/${encodeURIComponent(file.storedName)}`;

  const isImage = file.mimetype?.startsWith('image/');
  const isVideo = file.mimetype?.startsWith('video/');
  const isPdf = file.mimetype === 'application/pdf';

  const handleDownload = () => {
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.originalName;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            {isImage && <ImageIcon size={20} color="#ec4899" />}
            {isVideo && <Film size={20} color="#a855f7" />}
            {isPdf && <FileText size={20} color="#ef4444" />}
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.originalName}
            </h3>
          </div>

          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onClose}
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {isImage ? (
            <img src={downloadUrl} alt={file.originalName} />
          ) : isVideo ? (
            <video controls autoPlay style={{ width: '100%', maxHeight: '65vh' }}>
              <source src={downloadUrl} type={file.mimetype} />
              Your browser does not support HTML5 video playback.
            </video>
          ) : isPdf ? (
            <iframe src={downloadUrl} title={file.originalName} />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <FileText size={64} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
              <h4>No preview available for this file type</h4>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                You can download the file to view it on your device.
              </p>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={18} /> Download {file.originalName}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--glass-border)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Uploaded: {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'N/A'}
          </div>

          <button className="btn btn-primary" onClick={handleDownload}>
            <Download size={18} /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
