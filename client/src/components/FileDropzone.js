import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

const DropzoneContainer = styled.div`
  border: 2px dashed ${props => props.isDragActive ? '#4CAF50' : '#ccc'};
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.isDragActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  backdrop-filter: blur(10px);

  &:hover {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.05);
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #666;
`;

const UploadText = styled.div`
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
`;

const UploadSubtext = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const FileList = styled.div`
  margin-top: 1rem;
  text-align: left;
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
  word-break: break-word;
`;

const FileDetails = styled.div`
  font-size: 0.8rem;
  color: #666;
  display: flex;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const RemoveButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background: #cc3333;
  }
`;

const FileSummary = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 8px;
  border-left: 4px solid #2196F3;

  h4 {
    margin: 0 0 0.5rem 0;
    color: #1565c0;
    font-size: 0.9rem;
  }

  div {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;

    &:last-child {
      margin-bottom: 0;
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

const FileDropzone = ({ files, onFilesChange, maxSize = 100 * 1024 * 1024, maxFiles = 20 }) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      console.error('Some files were rejected:', rejectedFiles);
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          console.error(`File ${file.name}: ${error.message}`);
        });
      });
    }

    // Filter out files that are too large
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        console.error(`File ${file.name} is too large (${formatFileSize(file.size)} > ${formatFileSize(maxSize)})`);
        return false;
      }
      return true;
    });

    // Check if adding these files would exceed the max file count
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      const allowedFiles = validFiles.slice(0, maxFiles - files.length);
      console.warn(`Only adding ${allowedFiles.length} files to stay within ${maxFiles} file limit`);
      onFilesChange([...files, ...allowedFiles]);
    } else {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, onFilesChange, maxSize, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    multiple: true,
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'application/pdf': [],
      'text/*': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/zip': [],
      'application/x-zip-compressed': [],
    }
  });

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div>
      <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <UploadIcon>📁</UploadIcon>
        <UploadText>
          {isDragActive ? 'Drop files here...' : 'Drop files here or click to browse'}
        </UploadText>
        <UploadSubtext>
          Maximum {formatFileSize(maxSize)} per file • Up to {maxFiles} files
        </UploadSubtext>
      </DropzoneContainer>

      {files.length > 0 && (
        <>
          <FileSummary>
            <h4>📋 Upload Summary</h4>
            <div><strong>Files:</strong> {files.length} of {maxFiles}</div>
            <div><strong>Total size:</strong> {formatFileSize(totalSize)}</div>
          </FileSummary>

          <FileList>
            {files.map((file, index) => (
              <FileItem key={index}>
                <FileInfo>
                  <FileName>
                    {getFileIcon(file.type)} {file.name}
                  </FileName>
                  <FileDetails>
                    <span>Size: {formatFileSize(file.size)}</span>
                    <span>Type: {file.type || 'Unknown'}</span>
                    <span>Modified: {new Date(file.lastModified).toLocaleDateString()}</span>
                  </FileDetails>
                </FileInfo>
                <RemoveButton onClick={() => removeFile(index)}>
                  Remove
                </RemoveButton>
              </FileItem>
            ))}
          </FileList>
        </>
      )}
    </div>
  );
};

export default FileDropzone;
