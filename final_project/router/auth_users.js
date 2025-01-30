const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Ensure bcrypt is installed
const regd_users = express.Router();

let users = []; // In-memory storage for users
let books = {}; // In-memory storage for books (you should define this)

const isValid = (username) => {
    return typeof username === 'string' && username.length >= 3;
};

// User registration endpoint
regd_users.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!isValid(username)) {
        return res.status(400).json({ message: "Invalid username" });
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ message: "Username already exists. Please choose a different one." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });

    return res.status(201).json({ message: "User registered successfully!" });
});

// User login endpoint
regd_users.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!isValid(username)) {
        return res.status(400).json({ message: "Invalid username" });
    }

    const user = users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET || "your_jwt_secret_key", { expiresIn: '1h' });
        return res.status(200).json({ message: "Login successful", token });
    }

    return res.status(401).json({ message: "Invalid username or password" });
});

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        req.username = decoded.username; // Attach username to request
        next(); // Proceed to the next middleware or route handler
    });
};

// Endpoint to add or update a book review
// Endpoint to add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review; // Get the review from the query parameter
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from the Authorization header

    // Check if token is provided
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify the token and get the username
    jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        const username = decoded.username;

        // Check if the book exists
        if (!books[isbn]) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Initialize reviews if not present
        if (!books[isbn].reviews) {
            books[isbn].reviews = {};
        }

        // Update or add the review for the user
        books[isbn].reviews[username] = review; // Add or update the review

        return res.status(200).json({ message: "Review added/updated successfully", reviews: books[isbn].reviews });
    });
});
// Endpoint to delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn; // Get the ISBN from the URL parameters
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from the Authorization header

    // Check if token is provided
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify the token and get the username
    jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        const username = decoded.username;

        // Check if the book exists
        if (!books[isbn]) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Check if the user has a review for this book
        if (books[isbn].reviews && books[isbn].reviews[username]) {
            // Delete the user's review
            delete books[isbn].reviews[username];
            return res.status(200).json({ message: "Review deleted successfully", reviews: books[isbn].reviews });
        }

        return res.status(404).json({ message: "Review not found for this user" });
    });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
