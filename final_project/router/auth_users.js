const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//Filter the users array for any user with the same username 
    let usernamewithsamename = users.filter((user) => {
        return user.username ==username;
    });
    if (usernamewithsamename.length > 0) {
        return true;
    }else {
        return false;
    }
}

const authenticatedUser = (username,password)=>{ //returns boolean
    //Filter the user array for any user with the same username and password 
    let validusers =users.filter ((user) => {
        return (user.username === username && user.password===password);
    });
    if (validusers.length >0 ){
        return true;
    }else {
        return false;
    }
}


// Login endpoint
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        // Store access token and username in session
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review; // Get the review from the request query
    const username = req.query.username; // Assuming username is stored in session after login

    // 1. Check if ISBN and review are provided
    if (!isbn) {
        return res.status(400).json({ message: "ISBN parameter is missing." });
    }
    if (!review) {
        return res.status(400).json({ message: "Review query parameter is missing." });
    }
    if (!username) {
        return res.status(401).json({ message: "User not authenticated. Please log in." });
    }

    // 2. Check if the book exists
    if (!books.hasOwnProperty(isbn)) {
        return res.status(404).json({ message: "Book with this ISBN not found." });
    }

    // Initialize reviews object if it doesn't exist for the book
    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    // 3. Handle review logic based on user
    if (books[isbn].reviews.hasOwnProperty(username)) {
        // If the same user posts a different review on the same ISBN,
        // it should modify the existing review.
        books[isbn].reviews[username] = review;
        return res.status(200).json({ message: `Review for ISBN ${isbn} by ${username} has been modified successfully.` });
    } else {
        // If another user logs in and posts a review on the same ISBN,
        // it will get added as a different review under the same ISBN.
        books[isbn].reviews[username] = review;
        return res.status(201).json({ message: `Review for ISBN ${isbn} by ${username} has been added successfully.` });
    }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.query.username; // Get the username from the session

    // 1. Basic validation
    if (!isbn) {
        return res.status(400).json({ message: "ISBN parameter is missing." });
    }
    // The 'authenticateUser' middleware should handle the missing username/unauthenticated case.
    // However, a belt-and-suspenders check doesn't hurt for clarity.
    if (!username) {
        return res.status(401).json({ message: "User not authenticated. Please log in." });
    }

    // 2. Check if the book exists
    if (!books.hasOwnProperty(isbn)) {
        return res.status(404).json({ message: "Book with this ISBN not found." });
    }

    const bookReviews = books[isbn].reviews;

    // 3. Check if there are any reviews for this book
    if (!bookReviews || Object.keys(bookReviews).length === 0) {
        return res.status(404).json({ message: `No reviews found for book with ISBN ${isbn}.` });
    }

    // 4. Check if the current user has a review for this book
    if (bookReviews.hasOwnProperty(username)) {
        // Delete the review associated with the current username
        delete bookReviews[username];
        console.log(`Review for ISBN ${isbn} by ${username} has been deleted.`);
        return res.status(200).json({ message: `Your review for ISBN ${isbn} has been deleted successfully.` });
    } else {
        // User does not have a review for this book, or trying to delete another user's review
        return res.status(403).json({ message: `You do not have a review for ISBN ${isbn}, or you are attempting to delete another user's review.` });
    }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
