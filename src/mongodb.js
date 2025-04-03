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
})

const collection = mongoose.model("Collection1", LogInSchema)

module.exports = collection
