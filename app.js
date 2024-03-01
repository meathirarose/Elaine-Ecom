const express = require("express");
const app = express();
const nocache = require('nocache');

app.use(nocache());

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/elaineEcom");

const PORT = process.env.PORT||3000;

const bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

// for user route
const userRoute = require("./routes/userRoute");
app.use('/',userRoute.user_route);

// for admin route
const adminRoute = require("./routes/adminRoute");
app.use('/admin',adminRoute.admin_route);

app.listen(PORT, ()=>{
    console.log(`Listening to the port at ${3000}`);
})

