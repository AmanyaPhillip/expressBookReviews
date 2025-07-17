const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

let availpromise = new Promise((resolve, reject) =>{
    setTimeout(() =>{
        resolve(JSON.stringify(books,null,11))
    },2000)
});

availpromise.then((success) => {
    public_users.get('/',function (req, res) {
        return res.send(JSON.stringify(books,null,11));
      });
});

public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if both username and password are provided
    if (username && password) {
        // Check if the user does not already exist
        if (!isValid(username)) {
            // Add the new user to the users array
            users.push({"username": username, "password": password});
            return res.status(200).json({message: "User successfully registered. Now you can login"});
        } else {
            return res.status(404).json({message: "User already exists!"});
        }
    }
    // Return error if username or password is missing
    return res.status(404).json({message: "Unable to register user."});
});

// Get the book list available in the shop

let isbnpromise = new Promise((resolve,reject) => {
    setTimeout(()=>{
        resolve(JSON.stringify(books[ISBN],null,1));
    },2000);
});
isbnpromise.then((success)=>{
    public_users.get('/isbn/:isbn',function (req, res) {
        const ISBN = req.params.isbn;
        if (ISBN){
            return res.send(success);
        }else {
            return res.status(300).json({message: "ISBN not found"});
        }
      
     });

})

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
    const ISBN = req.params.isbn;
    if (ISBN){
        return res.send(JSON.stringify(books[ISBN],null,1));
    }else {
        return res.status(300).json({message: "ISBN not found"});
    }
  
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
    const autherName = req.params.author;
    let booksofbook = Object.values(books).filter((book)=>{return book.author === autherName;});
    if (booksofbook.length > 0 ){
        return res.send(JSON.stringify(booksofbook,null,1));
    }else {
        return res.status(300).json({message: "Book not found for this author."});
    }
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const titlename = req.params.title;
  let booksofbook = Object.values(books).filter((book) => {return book.title === titlename;});
  if (booksofbook.length > 0 ){
    return res.send(JSON.stringify(booksofbook,null,1));
  }else {
    return res.status(300).json({message: "Book not found with this title."});
  }
});

// Get book review
public_users.get('/review/:isbn',function (req, res) {
    const ISBN = req.params.isbn;

    // Check if the ISBN parameter was provided in the request
    if (!ISBN) {
        return res.status(400).json({message: "ISBN parameter is missing."});
    }

    // Check if a book with the given ISBN exists in the 'books' object
    if (books.hasOwnProperty(ISBN)) {
        const bookReviews = books[ISBN]['reviews'];
        
        // Check if the book has any reviews
        if (Object.keys(bookReviews).length > 0) {
            return res.status(200).json.stringify(bookReviews,null,1); // Return the reviews directly
        } else {
            return res.status(200).json({message: "This book has no reviews yet."});
        }
    } else {
        // If no book with the ISBN is found
        return res.status(404).json({message: "Book with this ISBN not found."});
    }
});

module.exports.general = public_users;
