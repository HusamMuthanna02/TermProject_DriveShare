// filepath: c:\Users\husam\OneDrive\Desktop\CIS476\TermProject_DriveShare\src\index.js
const express = require('express');
const app = express();
const path = require('path');
const hbs= require('hbs');
const { UserCollection, CarListing } = require('./mongodb'); // Import both models
const bcrypt = require('bcrypt');
const SessionManager = require('./SessionManager'); // Import SessionManager
const sessionManager = new SessionManager(); // Get the Singleton instance
const cookieParser = require('cookie-parser'); // Import cookie-parser
const CarListingBuilder = require('./CarListingBuilder'); // Import the builder
const dateFormat = require('handlebars-dateformat'); // Import handlebars-dateformat
const moment = require('moment');
const { NotificationManager, UserObserver } = require('./NotificationManager'); // Import NotificationManager
const notificationManager = new NotificationManager(); // Create an instance

hbs.registerHelper('dateFormat', dateFormat); // Register the helper

hbs.registerHelper('isAvailable', function (availability) {
    const now = moment();
    const start = moment(availability.startDate);
    const end = moment(availability.endDate);

    // Check if the current date is within the availability range
    return now.isBetween(start, end, null, '[]'); // Inclusive of start and end dates
});

app.use(cookieParser()); // Use cookie-parser middleware

const templatePath = path.join(__dirname, '../tempelates');

app.use(express.json());
app.set('view engine', 'hbs');
app.set('views',templatePath)
app.use(express.urlencoded({extended:false}));

app.get('/', (req, res) => {
    res.render('login');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/signup', (req, res) => {
    res.render('signup');
})

app.get('/car/list', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (session) {
        res.render('carListing');
    } else {
        res.redirect('/login');
    }
});


app.get('/home', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (session) {
        try {
            const user = await UserCollection.findOne({ username: session.username });
            const notifications = user.notifications || []; // Fetch notifications from the database
            res.render('home', { username: session.username, notifications }); // Pass notifications to the template
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).send("Failed to load home page.");
        }
    } else {
        res.redirect('/login'); // Redirect to login if no session
    }
});

app.get('/car/manage', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const username = session.username;

    try {
        const carListings = await CarListing.find({ ownerUsername: username }); // Renamed variable
        res.render('manageListing', { cars: carListings }); // Use the renamed variable
    } catch (error) {
        console.error("Error fetching car listings:", error);
        res.status(500).send("Failed to fetch car listings.");
    }
});

app.get('/car/edit/:id', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const carId = req.params.id;

    try {
        const car = await CarListing.findById(carId);
        if (!car) {
            return res.status(404).send("Car listing not found.");
        }

        // Check if the user owns the car
        if (car.ownerUsername !== session.username) {
            return res.status(403).send("You are not authorized to edit this listing.");
        }

        res.render('editCarListing', { car: car }); // Render the edit form
    } catch (error) {
        console.error("Error fetching car listing for edit:", error);
        res.status(500).send("Failed to fetch car listing.");
    }
});

app.get('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (session) {
        notificationManager.removeObserver(session.username, new UserObserver(session.username));
        sessionManager.destroySession(sessionId);
        res.clearCookie('sessionId');
    }
    res.redirect('/login');
});

app.post('/car/list', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const { model, year, mileage, pickupLocation, rentalPrice, startDate, endDate } = req.body; // Extract startDate and endDate
    const ownerUsername = session.username; // Get username from session

    try {
        // Use the CarListingBuilder to create the car listing object
        const carListingData = new CarListingBuilder()
            .setOwnerUsername(ownerUsername)
            .setModel(model)
            .setYear(year)
            .setMileage(mileage)
            .setPickupLocation(pickupLocation)
            .setRentalPrice(rentalPrice)
            .setAvailability([{ startDate: new Date(startDate), endDate: new Date(endDate) }]) // Set availability
            .build();

        const newCar = new CarListing(carListingData); // Create a new CarListing model instance
        await newCar.save();
        res.redirect('/home');
    } catch (error) {
        console.error("Error listing car:", error);
        res.status(500).send("Failed to list car.");
    }
});


app.post('/car/update/:id', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const carId = req.params.id;

    try {
        const car = await CarListing.findById(carId);
        if (!car) {
            return res.status(404).send("Car listing not found.");
        }

        // Check if the user owns the car
        if (car.ownerUsername !== session.username) {
            return res.status(403).send("You are not authorized to edit this listing.");
        }

        // Update the car listing
        car.model = req.body.model;
        car.year = req.body.year;
        car.mileage = req.body.mileage;
        car.pickupLocation = req.body.pickupLocation;
        car.rentalPrice = req.body.rentalPrice;

        // Update availability dates
        car.availability = [{
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate)
        }];

        await car.save();
        res.redirect('/car/manage'); // Redirect to manage listings page
    } catch (error) {
        console.error("Error updating car listing:", error);
        res.status(500).send("Failed to update car listing.");
    }
});

app.post('/signup', async (req, res) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Hash the security answers
    const hashedAnswers = await Promise.all([
        bcrypt.hash(req.body.securityAnswer1, saltRounds),
        bcrypt.hash(req.body.securityAnswer2, saltRounds),
        bcrypt.hash(req.body.securityAnswer3, saltRounds)
    ]);

    const data = {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword, // Store the hashed password
        securityQuestions: [
            { question: req.body.securityQuestion1, answer: hashedAnswers[0] },
            { question: req.body.securityQuestion2, answer: hashedAnswers[1] },
            { question: req.body.securityQuestion3, answer: hashedAnswers[2] }
        ]
    };

    try {
        await UserCollection.insertMany([data]);
        res.render('login'); // Send a success response
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Signup failed. Please try again."); // Send an error response
    }
});


app.post('/login', async (req, res) => {
    try {
        const check = await UserCollection.findOne({ username: req.body.username });

        if (!check) {
            return res.send('Wrong Details'); // User not found
        }

        if (await bcrypt.compare(req.body.password, check.password)) {
            const sessionId = sessionManager.createSession(req.body.username);
            res.cookie('sessionId', sessionId, { httpOnly: true }); // Store session ID in a cookie

            // Add the user as an observer
            const userObserver = new UserObserver(req.body.username);
            notificationManager.addObserver(req.body.username, userObserver);

            res.redirect('/home'); // Redirect to /home AFTER setting the cookie
        } else {
            res.send('Wrong password');
        }
    } catch (error) {
        console.error("Login error:", error);
        res.send('Wrong Details'); // Handle errors 
    }
});

app.get('/car/search', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    res.render('searchCar'); // Render the search page
});

app.post('/car/search', async (req, res) => {
    const { location, startDate, endDate } = req.body;

    try {
        const availableCars = await CarListing.find({
            pickupLocation: location,
            availability: {
                $elemMatch: {
                    startDate: { $lte: new Date(startDate) },
                    endDate: { $gte: new Date(endDate) }
                }
            }
        });

        res.render('searchResults', { cars: availableCars, startDate, endDate });
    } catch (error) {
        console.error("Error searching for cars:", error);
        res.status(500).send("Failed to search for cars.");
    }
});

app.post('/car/book/:id', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const carId = req.params.id;
    const { startDate, endDate } = req.body;

    try {
        const car = await CarListing.findById(carId);

        if (!car) {
            return res.status(404).send("Car listing not found.");
        }

        // Check for overlapping bookings
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        const isOverlapping = car.bookings.some(booking => {
            const existingStartDate = new Date(booking.startDate);
            const existingEndDate = new Date(booking.endDate);
            return (
                (newStartDate >= existingStartDate && newStartDate <= existingEndDate) || // New start overlaps existing booking
                (newEndDate >= existingStartDate && newEndDate <= existingEndDate) || // New end overlaps existing booking
                (newStartDate <= existingStartDate && newEndDate >= existingEndDate) // New booking fully contains existing booking
            );
        });

        if (isOverlapping) {
            return res.status(400).send("This car is already booked for the selected time frame.");
        }

        // Add the booking
        car.bookings.push({
            renterUsername: session.username,
            startDate: newStartDate,
            endDate: newEndDate
        });

        // Notify the car owner
        notificationManager.notify(car.ownerUsername, `Your car has been booked by ${session.username} from ${startDate} to ${endDate}.`);

        // Notify the renter
        notificationManager.notify(session.username, `You have successfully booked the car ${car.model} from ${startDate} to ${endDate}.`);

        await car.save();
        res.redirect('/home'); // Redirect to home after booking
    } catch (error) {
        console.error("Error booking car:", error);
        res.status(500).send("Failed to book car.");
    }
});

app.get('/car/available', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    try {
        const availableCars = await CarListing.find({
            ownerUsername: { $ne: session.username }, // Exclude cars owned by the user
            availability: {
                $elemMatch: {
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() }
                }
            }
        });

        res.render('availableCars', { cars: availableCars });
    } catch (error) {
        console.error("Error fetching available cars:", error);
        res.status(500).send("Failed to fetch available cars.");
    }
});

app.get('/car/rented-cars', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const username = session.username;

    try {
        const rentedCars = await CarListing.find({ 'bookings.renterUsername': username });
        const formattedCars = rentedCars.map(car => ({
            model: car.model,
            year: car.year,
            mileage: car.mileage,
            rentalPrice: car.rentalPrice,
            startDate: car.bookings.find(b => b.renterUsername === username)?.startDate,
            endDate: car.bookings.find(b => b.renterUsername === username)?.endDate,
            ownerUsername: car.ownerUsername
        }));
        res.render('rentedCars', { rentedCars: formattedCars });
    } catch (error) {
        console.error("Error fetching rented cars:", error);
        res.status(500).send("Failed to fetch rented cars.");
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})