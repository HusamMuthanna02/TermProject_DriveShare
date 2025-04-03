//Singleton Pattern

class SessionManager {
    constructor() {
        if (SessionManager.instance) {
            return SessionManager.instance;
        }

        this.sessions = {}; // Store sessions here (e.g., { sessionId: { username: '...' } })
        SessionManager.instance = this;
    }

    static getInstance() {
        return new SessionManager();
    }

    createSession(username) {
        const sessionId = this.generateSessionId();
        this.sessions[sessionId] = { username: username };
        return sessionId;
    }

    getSession(sessionId) {
        return this.sessions[sessionId];
    }

    destroySession(sessionId) {
        delete this.sessions[sessionId];
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); //basic example, use a more robust method in production
    }
}

module.exports = SessionManager;