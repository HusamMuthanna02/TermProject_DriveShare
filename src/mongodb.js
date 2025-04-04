const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/DriveShareTP")
.then(()=>{
    console.log("mongodb connected");
})
.catch(()=>{
    console.log("failed to connect")
})


const LogInSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    securityQuestions: {
        type: [
            {
                question: String,
                answer: String
            }
        ],
        required: true
    },
    notifications: {
        type: [String], // Array of notification messages
        default: []
    },
    balance: {
        type: Number,
        default: 1000 // Starting balance
    }
})

const CarListingSchema = new mongoose.Schema({
    ownerUsername: { // Reference to the car owner
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    mileage: {
        type: Number,
        required: true
    },
    availability: { // Store availability as an array of date ranges
        type: [{
            startDate: Date,
            endDate: Date
        }],
        default: []
    },
    pickupLocation: {
        type: String,
        required: true
    },
    rentalPrice: {
        type: Number,
        required: true
    },
    bookings: { // Track bookings as an array of date ranges
        type: [{
            renterUsername: String,
            startDate: Date,
            endDate: Date,
            paymentMade: { type: Boolean, default: false } // Add paymentMade property
        }],
        default: []
    }
});

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const CarListing = mongoose.model("CarListing", CarListingSchema); // Corrected model name
const UserCollection = mongoose.model("UserCollection", LogInSchema)
const MessageCollection = mongoose.model("MessageCollection", MessageSchema);

module.exports = { UserCollection, CarListing, MessageCollection };
