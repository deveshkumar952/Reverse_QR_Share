import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import QRCodeDisplay from '../components/QRCodeDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { createReceiveSession, getDownloadInfo, downloadFile } from '../utils/api';
import socketService from '../utils/socket';

const PageContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FilesSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const FilesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FileDetails = styled.div`
  font-size: 0.9rem;
  color: #666;
  display: flex;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const DownloadButton = styled.button`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const NewSessionButton = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;
  width: 100%;

  &:hover {
    background: #1976D2;
  }
`;

const NotificationBanner = styled.div`
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimetype) => {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📋';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return '📦';
  return '📎';
};

const ReceivePage = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [downloading, setDownloading] = useState({});
  const [newFilesReceived, setNewFilesReceived] = useState(false);

  useEffect(() => {
    createSession();
    return () => {
      if (session) {
        socketService.leaveSession(session.sessionId);
      }
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (session) {
      // Connect to socket and join session
      socketService.connect();
      socketService.joinSession(session.sessionId);

      // Listen for file uploads
      const handleFilesUploaded = (data) => {
        console.log('Files uploaded:', data);
        setSession(prev => ({
          ...prev,
          status: data.status,
          totalFiles: data.totalFiles,
          totalSize: data.totalSize
        }));

        // Add new files to the list
        setFiles(prev => [...prev, ...data.newFiles]);
        setNewFilesReceived(true);

        toast.success(`${data.newFiles.length} new file(s) received!`);

        // Auto-download after a short delay
        setTimeout(() => {
          data.newFiles.forEach((file, index) => {
            setTimeout(() => {
              handleAutoDownload(session.sessionId, file);
            }, index * 1000); // Stagger downloads by 1 second
          });
        }, 2000);
      };

      const handleSessionCompleted = (data) => {
        console.log('Session completed:', data);
        setSession(prev => ({ ...prev, status: 'completed' }));
        toast.success('File transfer completed!');
      };

      socketService.onFilesUploaded(handleFilesUploaded);
      socketService.onSessionCompleted(handleSessionCompleted);

      return () => {
        socketService.offFilesUploaded(handleFilesUploaded);
        socketService.offSessionCompleted(handleSessionCompleted);
      };
    }
  }, [session?.sessionId]);

  const createSession = async () => {
    try {
      setLoading(true);
      const response = await createReceiveSession(30); // 30 minutes expiry
      setSession(response);
      toast.success('Ready to receive files!');
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create receive session');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDownload = async (sessionId, file) => {
    try {
      // For auto-download, we need to get the actual filename from the server
      const downloadInfo = await getDownloadInfo(sessionId);
      const serverFile = downloadInfo.files.find(f => 
        f.originalName === file.originalName && 
        Math.abs(new Date(f.uploadedAt || 0).getTime() - new Date(file.uploadedAt).getTime()) < 5000
      );

      if (serverFile) {
        const filename = serverFile.downloadUrl.split('/').pop();
        await downloadFile(sessionId, filename, file.originalName);
        toast.success(`Downloaded: ${file.originalName}`);
      }
    } catch (error) {
      console.error('Auto-download failed:', error);
      // Don't show error toast for auto-download failures
    }
  };

  const handleManualDownload = async (file, serverFile) => {
    try {
      const filename = serverFile.downloadUrl.split('/').pop();
      setDownloading(prev => ({ ...prev, [file.originalName]: true }));

      await downloadFile(session.sessionId, filename, file.originalName);
      toast.success(`Downloaded: ${file.originalName}`);
    } catch (error) {
      console.error('Manual download failed:', error);
      toast.error(`Failed to download: ${file.originalName}`);
    } finally {
      setDownloading(prev => ({ ...prev, [file.originalName]: false }));
    }
  };

  const startNewSession = () => {
    if (session) {
      socketService.leaveSession(session.sessionId);
    }
    setSession(null);
    setFiles([]);
    setNewFilesReceived(false);
    setDownloading({});
    createSession();
  };

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <LoadingSpinner text="Creating receive session..." />
        </Card>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>❌ Failed to create session</h2>
            <p>Please try again</p>
            <NewSessionButton onClick={createSession}>
              Try Again
            </NewSessionButton>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card>
        {newFilesReceived && (
          <NotificationBanner>
            🎉 New files received! Downloads should start automatically.
          </NotificationBanner>
        )}

        <QRCodeDisplay 
          sessionId={session.sessionId}
          uploadUrl={session.uploadUrl}
          qrCode={session.qrCode}
          expiresAt={session.expiresAt}
          status={session.status}
          totalFiles={session.totalFiles || 0}
          totalSize={session.totalSize || 0}
        />

        {files.length > 0 && (
          <FilesSection>
            <h3>📥 Received Files ({files.length})</h3>
            <FilesList>
              {files.map((file, index) => (
                <FileItem key={index}>
                  <FileInfo>
                    <FileName>
                      {getFileIcon(file.mimetype)} {file.originalName}
                    </FileName>
                    <FileDetails>
                      <span>Size: {formatFileSize(file.size)}</span>
                      <span>Type: {file.mimetype}</span>
                      <span>Received: {new Date(file.uploadedAt).toLocaleTimeString()}</span>
                    </FileDetails>
                  </FileInfo>
                  <DownloadButton
                    onClick={() => handleManualDownload(file)}
                    disabled={downloading[file.originalName]}
                  >
                    {downloading[file.originalName] ? 'Downloading...' : 'Download'}
                  </DownloadButton>
                </FileItem>
              ))}
            </FilesList>
          </FilesSection>
        )}

        <div style={{ textAlign: 'center' }}>
          <NewSessionButton onClick={startNewSession}>
            Start New Session
          </NewSessionButton>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ReceivePage;
