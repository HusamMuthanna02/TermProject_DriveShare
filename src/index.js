const express = require('express');
const app = express();
const path = require('path');
const hbs= require('hbs');
const collection = require('./mongodb');

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




app.post('/signup',async (req, res) => {

    const data= {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }

    try {
        await collection.insertMany([data]);
        res.render('home'); // Send a success response
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Signup failed. Please try again."); // Send an error response
    }
})


app.post('/login',async (req, res) => {

    try{
    const check= await collection.findOne({username:req.body.username});

    if(check.password===req.body.password){
        res.render('home')
    }
    else{
        res.send('Wrong password')
    }

    }
    catch{
        res.send('Wrong Deatails')
    }

})


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})