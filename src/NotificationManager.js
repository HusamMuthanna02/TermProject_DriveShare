// Observer Pattern for Booking Notifications

const { UserCollection } = require('./mongodb'); // Import UserCollection for database updates

class NotificationManager {
    constructor() {
        this.observers = {}; // Store observers by username
    }

    addObserver(username, observer) {
        if (!this.observers[username]) {
            this.observers[username] = [];
        }
        this.observers[username].push(observer);
    }

    removeObserver(username, observer) {
        if (this.observers[username]) {
            this.observers[username] = this.observers[username].filter(obs => obs !== observer);
        }
    }

    async notify(username, message) {
        if (this.observers[username]) {
            this.observers[username].forEach(observer => observer.update(message));
        }

        // Save the notification to the database
        try {
            await UserCollection.updateOne(
                { username: username },
                { $push: { notifications: message } } // Add the message to the notifications array
            );
        } catch (error) {
            console.error(`Failed to save notification for ${username}:`, error);
        }
    }
}

class UserObserver {
    constructor(username) {
        this.username = username;
    }

    update(message) {
        console.log(`Notification for ${this.username}: ${message}`);
        // Notifications are now saved to the database in the notify method
    }
}

module.exports = { NotificationManager, UserObserver };
