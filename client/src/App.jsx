import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import UploadZone from './components/UploadZone';
import FileGrid from './components/FileGrid';
import FilePreviewModal from './components/FilePreviewModal';
import StorageMeter from './components/StorageMeter';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showStorage, setShowStorage] = useState(false);

  // Sync theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
    setFiles([]);
  };

  const loadFiles = async () => {
    if (!token) return;
    setLoadingFiles(true);

    try {
      const res = await fetch('/api/files', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        loadFiles();
      } else {
        alert('Failed to delete file.');
      }
    } catch (err) {
      console.error('Delete file error:', err);
      alert('Error deleting file.');
    }
  };

  useEffect(() => {
    if (token) {
      loadFiles();
    }
  }, [token]);

  if (!token) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar
        username={username}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenStorage={() => setShowStorage(true)}
      />

      <main className="main-container">
        {/* Upload Dropzone */}
        <UploadZone
          onUploadComplete={loadFiles}
          token={token}
        />

        {/* Files Display */}
        {loadingFiles ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your files...</p>
          </div>
        ) : (
          <FileGrid
            files={files}
            onDelete={handleDeleteFile}
            onPreview={(file) => setPreviewFile(file)}
            token={token}
          />
        )}
      </main>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          token={token}
        />
      )}

      {/* Storage Meter Modal */}
      {showStorage && (
        <StorageMeter
          files={files}
          onClose={() => setShowStorage(false)}
        />
      )}
    </div>
  );
}
