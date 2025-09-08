import React from 'react';
import QRCode from 'qrcode.react';
import styled from 'styled-components';

const QRContainer = styled.div`
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
`;

const QRWrapper = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  display: inline-block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SessionInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f4fd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1565c0;
  text-align: left;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StatusIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1rem;

  ${props => {
    switch (props.status) {
      case 'waiting':
        return `
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        `;
      case 'receiving':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'completed':
        return `
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        `;
      default:
        return `
          background: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
        `;
    }
  }}
`;

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'waiting':
      return <span>⏳</span>;
    case 'receiving':
      return <span>📤</span>;
    case 'completed':
      return <span>✅</span>;
    default:
      return <span>ℹ️</span>;
  }
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

const getStatusText = (status) => {
  switch (status) {
    case 'waiting':
      return 'Waiting for files';
    case 'receiving':
      return 'Receiving files';
    case 'completed':
      return 'Transfer completed';
    default:
      return 'Unknown status';
  }
};

const QRCodeDisplay = ({ 
  sessionId, 
  uploadUrl, 
  qrCode, 
  expiresAt, 
  status = 'waiting',
  totalFiles = 0,
  totalSize = 0 
}) => {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <QRContainer>
      <h2>📱 Ready to Receive Files</h2>

      <StatusIndicator status={status}>
        <StatusIcon status={status} />
        {getStatusText(status)}
      </StatusIndicator>

      <QRWrapper>
        <QRCode 
          value={uploadUrl} 
          size={200}
          level="M"
          includeMargin={true}
        />
      </QRWrapper>

      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Have someone scan this QR code to send files to this device
      </p>

      <SessionInfo>
        <InfoRow>
          <span><strong>Session ID:</strong></span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {sessionId.split('-')[0]}...
          </span>
        </InfoRow>
        <InfoRow>
          <span><strong>Expires in:</strong></span>
          <span>{formatExpiry(expiresAt)}</span>
        </InfoRow>
        <InfoRow>
          <span><strong>Files received:</strong></span>
          <span>{totalFiles}</span>
        </InfoRow>
        {totalSize > 0 && (
          <InfoRow>
            <span><strong>Total size:</strong></span>
            <span>{formatSize(totalSize)}</span>
          </InfoRow>
        )}
      </SessionInfo>
    </QRContainer>
  );
};

export default QRCodeDisplay;
