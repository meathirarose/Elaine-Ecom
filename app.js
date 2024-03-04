const express = require("express");
const app = express();
const nocache = require('nocache');
const path = require('path');
const logger = require("morgan");
const bodyparser = require('body-parser');

app.use(nocache());

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/elaineEcom");

const PORT = process.env.PORT||3000;

app.use(logger('dev'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname,'public')))

// for user route
const userRoute = require("./routes/userRoute");
app.use('/',userRoute.user_route);

// for admin route
// const adminRoute = require("./routes/adminRoute");
// app.use('/admin',adminRoute);

app.listen(PORT, ()=>{
    console.log(`Listening to the port at http://localhost:${3000}`);
})

