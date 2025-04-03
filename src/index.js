const express = require('express');
const app = express();
const path = require('path');
const hbs= require('hbs');
const { UserCollection, CarListing } = require('./mongodb'); // Import both models
const bcrypt = require('bcrypt');
const SessionManager = require('./SessionManager'); // Import SessionManager
const sessionManager = new SessionManager(); // Get the Singleton instance
const cookieParser = require('cookie-parser'); // Import cookie-parser

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


app.get('/home', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (session) {
        res.render('home', { username: session.username }); // Pass username to the template
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
    if (sessionId) {
        sessionManager.destroySession(sessionId);
        res.clearCookie('sessionId'); // Clear the cookie
    }
    res.redirect('/login');
});

app.post('/car/list', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        return res.redirect('/login');
    }

    const { model, year, mileage, pickupLocation, rentalPrice } = req.body;
    const ownerUsername = session.username; // Get username from session

    try {
        const newCar = new CarListing({
            ownerUsername,
            model,
            year,
            mileage,
            pickupLocation,
            rentalPrice
        });

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

        await car.save();
        res.redirect('/car/manage'); // Redirect to manage listings page
    } catch (error) {
        console.error("Error updating car listing:", error);
        res.status(500).send("Failed to update car listing.");
    }
});

app.post('/signup',async (req, res) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const data= {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword  // Store the hashed password
    }

    try {
        await UserCollection.insertMany([data]);
        res.render('login'); // Send a success response
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Signup failed. Please try again."); // Send an error response
    }
})


app.post('/login', async (req, res) => {
    try {
        const check = await UserCollection.findOne({ username: req.body.username });

        if (!check) {
            return res.send('Wrong Details'); // User not found
        }

        if (await bcrypt.compare(req.body.password, check.password)) {
            const sessionId = sessionManager.createSession(req.body.username);
            res.cookie('sessionId', sessionId, { httpOnly: true }); // Store session ID in a cookie
            res.redirect('/home'); // Redirect to /home AFTER setting the cookie
        } else {
            res.send('Wrong password');
        }
    } catch (error) {
        console.error("Login error:", error);
        res.send('Wrong Details'); // Handle errors 
    }
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})