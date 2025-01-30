const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// User registration endpoint
public_users.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (users[username]) {
        return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { password: hashedPassword };
    res.status(201).json({ message: "User registered successfully" });
});

// Get the list of all books
public_users.get('/', async (req, res) => {
    try {
        const bookList = await axios.get('http://localhost:3000/books'); // Adjust the URL to your books endpoint
        return res.status(200).json(bookList.data);
    } catch (error) {
        console.error('Error fetching book list:', error);
        return res.status(500).json({ message: 'Error fetching book list' });
    }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    try {
        const book = await new Promise((resolve, reject) => {
            if (books[isbn]) {
                resolve(books[isbn]);
            } else {
                reject(new Error("Book not found"));
            }
        });
        res.json(book);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Get books by author
public_users.get('/author/:author', async (req, res) => {
    const author = req.params.author;
    try {
        const filteredBooks = await new Promise((resolve, reject) => {
            const result = Object.values(books).filter(book => book.author.toLowerCase() === author.toLowerCase());
            if (result.length > 0) {
                resolve(result);
            } else {
                reject(new Error("No books found for this author"));
            }
        });
        res.status(200).json(filteredBooks);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Get books by title
public_users.get('/title/:title', async (req, res) => {
    const title = req.params.title;
    try {
        const filteredBooks = await new Promise((resolve, reject) => {
            const result = Object.values(books).filter(book => book.title.toLowerCase() === title.toLowerCase());
            if (result.length > 0) {
                resolve(result);
            } else {
                reject(new Error("No books found with this title"));
            }
        });
        res.status(200).json(filteredBooks);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Get book reviews
public_users.get('/review/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    try {
        const reviews = await new Promise((resolve, reject) => {
            if (books[isbn]) {
                resolve(books[isbn].reviews);
            } else {
                reject(new Error("Book not found"));
            }
        });
        res.json({ reviews });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

module.exports.general = public_users;
