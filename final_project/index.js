const express = require('express');
const session = require('express-session'); // Keep this if you need session for some functionality
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

// Middleware
app.use(express.json());
app.use("/customer", session({ 
    secret: "fingerprint_customer", 
    resave: true, 
    saveUninitialized: true 
}));

// Ensure to include customer routes that require authentication
app.use("/customer", customer_routes); // Ensure this matches the route definition in auth_users.js
app.use("/", genl_routes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log("Server is running"));
