class Logger {
    constructor() {
        this.logs = [];
        this.logContainer = document.getElementById('logContainer');
    }

    addLog(type, message, data = null) {
        const log = {
            timestamp: new Date().toLocaleTimeString(),
            type,
            message,
            data
        };
        this.logs.push(log);
        this.renderLog(log);
    }

    renderLog(log) {
        // Remove empty logs message if present
        const emptyLogs = this.logContainer.querySelector('.empty-logs');
        if (emptyLogs) {
            emptyLogs.remove();
        }

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        const header = document.createElement('div');
        header.className = 'log-entry-header';

        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = log.timestamp;

        const type = document.createElement('span');
        type.className = `log-type-badge ${log.type}`;
        type.textContent = log.type.toUpperCase();

        const message = document.createElement('span');
        message.className = 'log-message';
        message.textContent = log.message;

        header.appendChild(timestamp);
        header.appendChild(type);
        header.appendChild(message);
        logEntry.appendChild(header);

        if (log.data) {
            const data = document.createElement('pre');
            data.className = 'log-data';
            data.textContent = JSON.stringify(log.data, null, 2);
            logEntry.appendChild(data);
        }

        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    clear() {
        this.logs = [];
        this.logContainer.innerHTML = '<div class="empty-logs">No logs yet. Start by registering or logging in.</div>';
    }
}

// Create global logger instance
window.logger = new Logger();
