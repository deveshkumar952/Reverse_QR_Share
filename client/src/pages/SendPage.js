import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import FileDropzone from '../components/FileDropzone';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import { getSessionInfo, uploadFilesToSession, completeSession } from '../utils/api';

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

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
`;

const SessionInfo = styled.div`
  background: rgba(33, 150, 243, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid #2196F3;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #333;
  font-weight: 600;
`;

const UploadButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CompleteButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background: #1976D2;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const StatusBanner = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;

  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'warning':
        return `
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        `;
      case 'error':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return `
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        `;
    }
  }}
`;

const BackButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;

  &:hover {
    background: #5a6268;
  }
`;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatExpiry = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.ceil((date - now) / (1000 * 60));

  if (diffMinutes <= 0) {
    return 'Expired';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
  }
};

const SendPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);

  useEffect(() => {
    loadSessionInfo();
  }, [sessionId]);

  const loadSessionInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const info = await getSessionInfo(sessionId);
      setSessionInfo(info);

      if (info.status === 'completed') {
        setError('This session has already been completed.');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      if (error.response?.status === 404) {
        setError('Session not found or expired.');
      } else {
        setError('Failed to load session information.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFilesToSession(
        sessionId, 
        files, 
        (progress) => setUploadProgress(progress)
      );

      setUploadCompleted(true);
      toast.success(`Successfully uploaded ${result.uploadedFiles} file(s)!`);

      // Auto-complete session after successful upload
      setTimeout(async () => {
        try {
          await completeSession(sessionId);
          toast.success('Transfer completed! The receiver should see the files now.');
        } catch (error) {
          console.error('Failed to complete session:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleCompleteSession = async () => {
    try {
      await completeSession(sessionId);
      toast.success('Session completed successfully!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('Failed to complete session');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <LoadingSpinner text="Loading session..." />
        </Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Card>
          <Title>❌ Session Error</Title>
          <StatusBanner type="error">
            {error}
          </StatusBanner>
          <BackButton onClick={() => navigate('/')}>
            Go Home
          </BackButton>
        </Card>
      </PageContainer>
    );
  }

  if (!sessionInfo) {
    return (
      <PageContainer>
        <Card>
          <StatusBanner type="error">
            Session information not available
          </StatusBanner>
        </Card>
      </PageContainer>
    );
  }

  const isExpired = new Date() > new Date(sessionInfo.expiresAt);

  return (
    <PageContainer>
      <Card>
        <Title>📤 Send Files</Title>

        {isExpired && (
          <StatusBanner type="error">
            ⏰ This session has expired
          </StatusBanner>
        )}

        {uploadCompleted && (
          <StatusBanner type="success">
            🎉 Files uploaded successfully! The receiver should see them now.
          </StatusBanner>
        )}

        <SessionInfo>
          <InfoRow>
            <InfoLabel>Session Status:</InfoLabel>
            <InfoValue style={{ textTransform: 'capitalize' }}>
              {sessionInfo.status}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Files in session:</InfoLabel>
            <InfoValue>{sessionInfo.totalFiles}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Total size:</InfoLabel>
            <InfoValue>{formatFileSize(sessionInfo.totalSize)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Expires in:</InfoLabel>
            <InfoValue>{formatExpiry(sessionInfo.expiresAt)}</InfoValue>
          </InfoRow>
        </SessionInfo>

        {!isExpired && sessionInfo.status !== 'completed' && (
          <>
            <FileDropzone 
              files={files} 
              onFilesChange={setFiles}
              maxSize={100 * 1024 * 1024} // 100MB per file
              maxFiles={20}
            />

            {uploading && (
              <ProgressBar 
                progress={uploadProgress}
                text={`Uploading files... ${uploadProgress}%`}
              />
            )}

            <UploadButton 
              onClick={handleUpload} 
              disabled={files.length === 0 || uploading || isExpired}
            >
              {uploading 
                ? `Uploading ${files.length} file(s)...` 
                : files.length === 0 
                  ? 'Select Files to Upload' 
                  : `Upload ${files.length} file(s)`
              }
            </UploadButton>

            {uploadCompleted && (
              <CompleteButton onClick={handleCompleteSession}>
                Complete Transfer & Return Home
              </CompleteButton>
            )}
          </>
        )}

        {(isExpired || sessionInfo.status === 'completed') && (
          <BackButton onClick={() => navigate('/')}>
            Return Home
          </BackButton>
        )}
      </Card>
    </PageContainer>
  );
};

export default SendPage;
