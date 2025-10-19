class ReceiverApp {
    constructor() {
        this.sessionId = null;
        this.eventSource = null;
        this.refreshInterval = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            createSession: document.getElementById('create-session'),
            sessionActive: document.getElementById('session-active'),
            loading: document.getElementById('loading'),
            errorMessage: document.getElementById('error-message'),
            createBtn: document.getElementById('create-btn'),
            expiryMinutes: document.getElementById('expiry-minutes'),
            qrCode: document.getElementById('qr-code'),
            sessionIdSpan: document.getElementById('session-id'),
            expiresAt: document.getElementById('expires-at'),
            sessionStatus: document.getElementById('session-status'),
            progressContainer: document.getElementById('progress-container'),
            filesList: document.getElementById('files-list'),
            refreshBtn: document.getElementById('refresh-btn'),
            newSessionBtn: document.getElementById('new-session-btn')
        };
    }

    attachEventListeners() {
        this.elements.createBtn.addEventListener('click', () => this.createSession());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshSession());
        this.elements.newSessionBtn.addEventListener('click', () => this.newSession());

        // Delegate click events for dynamically created download buttons
        this.elements.filesList.addEventListener('click', (e) => {
            if (e.target.classList.contains('download-btn')) {
                const publicId = e.target.dataset.publicId;
                this.downloadFile(publicId);
            }
        });
    }

    async createSession() {
        try {
            this.showLoading(true);
            this.hideError();

            const expiryMinutes = parseInt(this.elements.expiryMinutes.value);

            const response = await fetch('/api/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ expiryMinutes })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create session');
            }

            const session = await response.json();
            this.displaySession(session);
            this.startSSE();

        } catch (error) {
            this.showError('Failed to create session: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displaySession(session) {
        this.sessionId = session.sessionId;

        this.elements.qrCode.src = session.qrDataUrl;
        this.elements.sessionIdSpan.textContent = session.sessionId;
        this.elements.expiresAt.textContent = new Date(session.expiresAt).toLocaleString();

        this.elements.createSession.style.display = 'none';
        this.elements.sessionActive.style.display = 'block';

        this.updateSessionStatus('waiting');
    }

    async refreshSession() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`/api/session/${this.sessionId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    this.showError('Session not found');
                    return;
                }
                if (response.status === 410) {
                    this.showError('Session has expired');
                    this.updateSessionStatus('expired');
                    return;
                }
                throw new Error('Failed to refresh session');
            }

            const session = await response.json();
            this.updateSessionDisplay(session);

        } catch (error) {
            this.showError('Failed to refresh session: ' + error.message);
        }
    }

    updateSessionDisplay(session) {
        this.updateSessionStatus(session.status);
        this.displayFiles(session.files);
    }

    updateSessionStatus(status) {
        this.elements.sessionStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        this.elements.sessionStatus.className = `status ${status}`;
    }

    displayFiles(files) {
        if (!files || files.length === 0) {
            this.elements.filesList.innerHTML = '<div class="no-files">No files received yet.</div>';
            return;
        }

        const filesHtml = files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">📄</div>
                    <div class="file-details">
                        <h4>${this.escapeHtml(file.originalName)}</h4>
                        <p>${this.formatBytes(file.sizeBytes)} • ${this.escapeHtml(file.mimeType)}</p>
                        <p>Uploaded: ${new Date(file.uploadedAt).toLocaleString()}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary btn-small download-btn" data-public-id="${this.escapeHtml(file.publicId)}">
                        Download
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.filesList.innerHTML = filesHtml;
    }

    async downloadFile(publicId) {
        try {
            // Encode the publicId properly for URL - encode each component separately
            const encodedPublicId = encodeURIComponent(publicId);
            const url = `/api/session/${this.sessionId}/file/${encodedPublicId}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to get download URL');
            }

            const data = await response.json();

            // Open download URL in new tab
            window.open(data.signedUrl, '_blank');

        } catch (error) {
            this.showError('Failed to download file: ' + error.message);
            console.error('Download error:', error);
        }
    }

    startSSE() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = new EventSource(`/api/events?sessionId=${this.sessionId}`);

        this.eventSource.addEventListener('connected', (event) => {
            console.log('SSE connected');
        });

        this.eventSource.addEventListener('uploadStarted', (event) => {
            const data = JSON.parse(event.data);
            this.showUploadProgress(data);
        });

        this.eventSource.addEventListener('uploadProgress', (event) => {
            const data = JSON.parse(event.data);
            this.updateUploadProgress(data);
        });

        this.eventSource.addEventListener('uploadComplete', (event) => {
            const data = JSON.parse(event.data);
            this.handleUploadComplete(data);
        });

        this.eventSource.addEventListener('uploadError', (event) => {
            const data = JSON.parse(event.data);
            this.showError('Upload failed: ' + data.error);
        });

        this.eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (this.sessionId) {
                    this.startSSE();
                }
            }, 5000);
        };
    }

    showUploadProgress(data) {
        this.updateSessionStatus('uploading');

        this.elements.progressContainer.innerHTML = `
            <div class="upload-progress-active">
                <h4>📤 Receiving: ${this.escapeHtml(data.fileName)}</h4>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">0% (0 / ${this.formatBytes(data.size)})</div>
            </div>
        `;
    }

    updateUploadProgress(data) {
        const progressBar = this.elements.progressContainer.querySelector('.progress-fill');
        const progressText = this.elements.progressContainer.querySelector('.progress-text');

        if (progressBar && progressText) {
            progressBar.style.width = `${data.progress}%`;
            progressText.textContent = `${data.progress}% (${this.formatBytes(data.bytesReceived)} / ${this.formatBytes(data.totalBytes)})`;
        }
    }

    handleUploadComplete(data) {
        this.updateSessionStatus('completed');

        this.elements.progressContainer.innerHTML = `
            <div class="success-message">
                ✅ File received successfully: ${this.escapeHtml(data.file.originalName)}
            </div>
        `;

        // Refresh session to show new file
        setTimeout(() => this.refreshSession(), 1000);
    }

    newSession() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.sessionId = null;
        this.elements.sessionActive.style.display = 'none';
        this.elements.createSession.style.display = 'block';
        this.hideError();
    }

    showLoading(show) {
        this.elements.loading.style.display = show ? 'block' : 'none';
        this.elements.createBtn.disabled = show;
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
}

// Initialize the app
const app = new ReceiverApp();