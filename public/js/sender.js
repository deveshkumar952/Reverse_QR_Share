class SenderApp {
    constructor() {
        this.sessionId = this.getSessionIdFromUrl();
        this.files = [];
        this.isUploading = false;

        this.initializeElements();
        this.attachEventListeners();
        this.loadSession();
    }

    getSessionIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    initializeElements() {
        this.elements = {
            sessionId: document.getElementById('session-id'),
            sessionStatus: document.getElementById('session-status'),
            expiresAt: document.getElementById('expires-at'),
            uploadArea: document.getElementById('upload-area'),
            fileInput: document.getElementById('file-input'),
            fileList: document.getElementById('file-list'),
            uploadBtn: document.getElementById('upload-btn'),
            clearBtn: document.getElementById('clear-btn'),
            uploadProgress: document.getElementById('upload-progress'),
            overallProgressFill: document.getElementById('overall-progress-fill'),
            overallProgressText: document.getElementById('overall-progress-text'),
            fileProgressItems: document.getElementById('file-progress-items'),
            uploadComplete: document.getElementById('upload-complete'),
            uploadMoreBtn: document.getElementById('upload-more-btn'),
            errorMessage: document.getElementById('error-message')
        };
    }

    attachEventListeners() {
        // File input
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        // Upload area drag and drop
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // Buttons
        this.elements.uploadBtn.addEventListener('click', () => this.startUpload());
        this.elements.clearBtn.addEventListener('click', () => this.clearFiles());
        this.elements.uploadMoreBtn.addEventListener('click', () => this.resetForMoreUploads());
    }

    async loadSession() {
        try {
            this.elements.sessionId.textContent = this.sessionId;

            const response = await fetch(`/api/session/${this.sessionId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Session not found');
                }
                if (response.status === 410) {
                    throw new Error('Session has expired');
                }
                throw new Error('Failed to load session');
            }

            const session = await response.json();
            this.displaySessionInfo(session);

        } catch (error) {
            this.showError('Failed to load session: ' + error.message);
        }
    }

    displaySessionInfo(session) {
        this.elements.sessionStatus.textContent = session.status.charAt(0).toUpperCase() + session.status.slice(1);
        this.elements.sessionStatus.className = `status ${session.status}`;
        this.elements.expiresAt.textContent = new Date(session.expiresAt).toLocaleString();

        if (session.status === 'expired') {
            this.showError('This session has expired and cannot accept new uploads.');
            this.elements.uploadArea.style.display = 'none';
        }
    }

    handleFiles(newFiles) {
        if (this.isUploading) {
            this.showError('Upload in progress. Please wait before adding more files.');
            return;
        }

        // Validate and add files
        for (const file of newFiles) {
            if (this.validateFile(file)) {
                // Check if file already exists
                const exists = this.files.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    this.files.push(file);
                }
            }
        }

        this.updateFileList();
        this.updateUploadButton();
    }

    validateFile(file) {
        const maxSize = 100 * 1024 * 1024; // 100MB

        if (file.size > maxSize) {
            this.showError(`File "${file.name}" exceeds the 100MB size limit.`);
            return false;
        }

        return true;
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.elements.fileList.innerHTML = '';
            return;
        }

        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);

        const filesHtml = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">${this.getFileIcon(file.type)}</div>
                    <div class="file-details">
                        <h4>${this.escapeHtml(file.name)}</h4>
                        <p>${this.formatBytes(file.size)} • ${this.escapeHtml(file.type || 'Unknown type')}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.removeFile(${index})">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.fileList.innerHTML = `
            ${filesHtml}
            <div class="files-summary">
                <strong>Total: ${this.files.length} file(s), ${this.formatBytes(totalSize)}</strong>
            </div>
        `;
    }

    removeFile(index) {
        if (this.isUploading) return;

        this.files.splice(index, 1);
        this.updateFileList();
        this.updateUploadButton();
    }

    clearFiles() {
        if (this.isUploading) return;

        this.files = [];
        this.elements.fileInput.value = '';
        this.updateFileList();
        this.updateUploadButton();
    }

    updateUploadButton() {
        this.elements.uploadBtn.disabled = this.files.length === 0 || this.isUploading;
    }

    async startUpload() {
        if (this.files.length === 0 || this.isUploading) return;

        this.isUploading = true;
        this.hideError();
        this.showUploadProgress();

        try {
            let completedFiles = 0;
            const totalFiles = this.files.length;

            for (const file of this.files) {
                await this.uploadFile(file);
                completedFiles++;
                this.updateOverallProgress(completedFiles, totalFiles);
            }

            this.showUploadComplete();

        } catch (error) {
            this.showError('Upload failed: ' + error.message);
            this.isUploading = false;
        }
    }

    async uploadFile(file) {
        // Initialize upload
        const initResponse = await fetch('/api/upload/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: this.sessionId,
                fileName: file.name,
                size: file.size,
                mimeType: file.type
            })
        });

        if (!initResponse.ok) {
            const error = await initResponse.json();
            throw new Error(error.error || 'Failed to initialize upload');
        }

        const { uploadId, recommendedPartSize } = await initResponse.json();

        // Upload file in chunks
        const chunkSize = Math.min(recommendedPartSize, 5 * 1024 * 1024); // Max 5MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);

        this.showFileProgress(file.name, 0);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const partResponse = await fetch('/api/upload/part', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-Upload-Id': uploadId,
                    'X-Chunk-Index': i.toString()
                },
                body: chunk
            });

            if (!partResponse.ok) {
                throw new Error('Failed to upload file chunk');
            }

            const { progress } = await partResponse.json();
            this.updateFileProgress(file.name, progress);
        }

        // Complete upload
        const completeResponse = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: this.sessionId,
                uploadId
            })
        });

        if (!completeResponse.ok) {
            const error = await completeResponse.json();
            throw new Error(error.error || 'Failed to complete upload');
        }

        this.updateFileProgress(file.name, 100);
    }

    showUploadProgress() {
        document.getElementById('upload-section').style.display = 'none';
        this.elements.uploadProgress.style.display = 'block';

        this.elements.fileProgressItems.innerHTML = '';
        this.updateOverallProgress(0, this.files.length);
    }

    showFileProgress(fileName, progress) {
        const existingItem = document.getElementById(`progress-${this.hashString(fileName)}`);

        if (existingItem) {
            this.updateFileProgressItem(existingItem, progress);
        } else {
            const progressItem = document.createElement('div');
            progressItem.className = 'file-progress-item';
            progressItem.id = `progress-${this.hashString(fileName)}`;

            progressItem.innerHTML = `
                <div class="file-progress-header">
                    <span class="file-progress-name">${this.escapeHtml(fileName)}</span>
                    <span class="file-progress-status">${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            `;

            this.elements.fileProgressItems.appendChild(progressItem);
        }
    }

    updateFileProgress(fileName, progress) {
        const progressItem = document.getElementById(`progress-${this.hashString(fileName)}`);
        if (progressItem) {
            this.updateFileProgressItem(progressItem, progress);
        }
    }

    updateFileProgressItem(item, progress) {
        const statusSpan = item.querySelector('.file-progress-status');
        const progressFill = item.querySelector('.progress-fill');

        statusSpan.textContent = `${progress}%`;
        progressFill.style.width = `${progress}%`;

        if (progress === 100) {
            statusSpan.textContent = '✅ Complete';
            progressFill.style.background = '#10b981';
        }
    }

    updateOverallProgress(completed, total) {
        const progress = Math.round((completed / total) * 100);

        this.elements.overallProgressFill.style.width = `${progress}%`;
        this.elements.overallProgressText.textContent = `${progress}% (${completed}/${total} files)`;
    }

    showUploadComplete() {
        this.elements.uploadProgress.style.display = 'none';
        this.elements.uploadComplete.style.display = 'block';
        this.isUploading = false;
    }

    resetForMoreUploads() {
        this.elements.uploadComplete.style.display = 'none';
        document.getElementById('upload-section').style.display = 'block';

        this.files = [];
        this.elements.fileInput.value = '';
        this.updateFileList();
        this.updateUploadButton();
        this.hideError();
    }

    getFileIcon(mimeType) {
        if (!mimeType) return '📄';

        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';

        return '📄';
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
    }

    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString();
    }
}

// Initialize the app
const app = new SenderApp();
