const logger = require('../utils/logger');

class SSEService {
  constructor() {
    this.clients = new Map(); // sessionId -> Set of response objects
  }

  addClient(sessionId, res) {
    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }

    this.clients.get(sessionId).add(res);

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    this.sendEvent(res, 'connected', { 
      timestamp: new Date().toISOString(),
      sessionId 
    });

    // Handle client disconnect
    res.on('close', () => {
      this.removeClient(sessionId, res);
    });

    logger.info('SSE client connected', { sessionId });
  }

  removeClient(sessionId, res) {
    const clients = this.clients.get(sessionId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.clients.delete(sessionId);
      }
    }
    logger.info('SSE client disconnected', { sessionId });
  }

  broadcast(sessionId, data) {
    const clients = this.clients.get(sessionId);
    if (!clients || clients.size === 0) {
      return;
    }

    const event = {
      timestamp: new Date().toISOString(),
      sessionId,
      ...data
    };

    // Send to all connected clients for this session
    for (const res of clients) {
      try {
        this.sendEvent(res, data.type || 'message', event);
      } catch (error) {
        logger.error('Error sending SSE event:', error);
        this.removeClient(sessionId, res);
      }
    }

    logger.debug('SSE event broadcasted', { 
      sessionId, 
      eventType: data.type, 
      clientCount: clients.size 
    });
  }

  sendEvent(res, eventType, data) {
    if (res.writableEnded) {
      return;
    }

    try {
      res.write(`event: ${eventType}
`);
      res.write(`data: ${JSON.stringify(data)}

`);
    } catch (error) {
      logger.error('Error writing SSE event:', error);
      throw error;
    }
  }

  getClientCount(sessionId) {
    const clients = this.clients.get(sessionId);
    return clients ? clients.size : 0;
  }

  getAllConnections() {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.size;
    }
    return total;
  }
}

// Singleton instance
module.exports = new SSEService();
