const { UserCollection } = require('./mongodb'); // Import UserCollection

// Proxy Pattern for Payment Integration
class PaymentProxy {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
    }

    async processPayment(renterUsername, ownerUsername, amount, carModel) {
        const renter = await UserCollection.findOne({ username: renterUsername });
        const owner = await UserCollection.findOne({ username: ownerUsername });

        if (!renter || !owner) {
            throw new Error("Renter or owner not found.");
        }

        if (renter.balance < amount) {
            throw new Error("Insufficient balance.");
        }

        // Deduct from renter and add to owner
        renter.balance -= amount;
        owner.balance += amount;

        await renter.save();
        await owner.save();

        // Notify renter and owner
        this.notificationManager.notify(renterUsername, `Payment of $${amount} for ${carModel} has been processed.`);
        this.notificationManager.notify(ownerUsername, `You have received a payment of $${amount} for ${carModel}.`);
    }
}

module.exports = PaymentProxy;
