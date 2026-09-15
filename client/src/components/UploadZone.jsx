import React, { useState, useRef } from 'react';
import { UploadCloud, FilePlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadZone({ onUploadComplete, token }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setStatusMsg({ text: `Uploading ${files.length} file(s)...`, type: 'info' });

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        if (res.ok) {
          successCount++;
        } else {
          console.error(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    if (successCount > 0) {
      setStatusMsg({
        text: `Successfully uploaded ${successCount} of ${files.length} file(s)!`,
        type: 'success'
      });
      onUploadComplete();
    } else {
      setStatusMsg({ text: 'Upload failed. Please try again.', type: 'error' });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setTimeout(() => {
      setStatusMsg({ text: '', type: '' });
    }, 4000);
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        style={{ display: 'none' }}
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.mp4,.mov,.avi,.mkv,.webm,.txt,.docx,.zip"
      />

      <div className="dropzone-icon">
        <UploadCloud size={48} />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Drag & Drop your files here
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
        Supports Images, Videos, PDFs, Documents, and Archives up to 500MB
      </p>

      <button
        type="button"
        className="btn btn-primary"
        disabled={uploading}
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
      >
        <FilePlus size={18} />
        {uploading ? 'Uploading...' : 'Browse Files'}
      </button>

      {statusMsg.text && (
        <div style={{
          marginTop: '1.25rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : (statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
          color: statusMsg.type === 'success' ? 'var(--success)' : (statusMsg.type === 'error' ? 'var(--danger)' : 'var(--accent-primary)')
        }}>
          {statusMsg.type === 'success' && <CheckCircle2 size={16} />}
          {statusMsg.type === 'error' && <AlertCircle size={16} />}
          {statusMsg.text}
        </div>
      )}
    </div>
  );
}
