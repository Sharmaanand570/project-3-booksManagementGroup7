const express = require('express');
const router = express.Router();
const bookController = require("../controllers/bookController")
const userController = require('../controllers/userController')
const reviewController = require("../controllers/reviewController")
const auth = require("../middleware/auth")

// -------- user creation and login api -------
router.post('/register',userController.createUser)
router.post("/login", userController.loginUser)

// -------- Book creation, Updating and Deleting API-------
router.post("/books", auth.authenticate, bookController.createBook)
router.get("/books", auth.authenticate, bookController.getBooks)
router.get("/books/:bookId", auth.authenticate, bookController.getBooksById)
router.put("/books/:bookId", auth.authenticate, bookController.updateBookById)
router.delete("/books/:bookId", auth.authenticate, bookController.deleteBooks)

// -------- Review creation, Updating and Deleting API-------
router.post("/books/:bookId/review", reviewController.createReview)
router.put("/books/:bookId/review/:reviewId", reviewController.updateReview)
router.delete("/books/:bookId/review/:reviewId", reviewController.deleteBookReview)

module.exports = router