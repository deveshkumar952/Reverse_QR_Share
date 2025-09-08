import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentSession = null;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const SERVER_URL = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api', '') 
      : 'http://localhost:5000';

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentSession) {
        this.leaveSession(this.currentSession);
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSession(sessionId) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    if (this.currentSession && this.currentSession !== sessionId) {
      this.leaveSession(this.currentSession);
    }

    this.currentSession = sessionId;
    this.socket.emit('join-session', sessionId);
    console.log('Joined session:', sessionId);
  }

  leaveSession(sessionId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-session', sessionId);
      console.log('Left session:', sessionId);
    }
    this.currentSession = null;
  }

  onFilesUploaded(callback) {
    if (this.socket) {
      this.socket.on('files-uploaded', callback);
    }
  }

  onSessionCompleted(callback) {
    if (this.socket) {
      this.socket.on('session-completed', callback);
    }
  }

  offFilesUploaded(callback) {
    if (this.socket) {
      this.socket.off('files-uploaded', callback);
    }
  }

  offSessionCompleted(callback) {
    if (this.socket) {
      this.socket.off('session-completed', callback);
    }
  }
}

const socketService = new SocketService();

export default socketService;
