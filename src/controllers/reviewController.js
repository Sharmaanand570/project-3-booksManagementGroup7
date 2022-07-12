const mongoose = require("mongoose")
const bookModel = require("../models/bookModel")
const reviewModel = require("../models/reviewModel")
const validator = require("../validators/validator")

//<<<<<<<<<<<<<<<<<<============================================CREATE REVIEW========================================>>>>>>>>>>>>>>>>>>>

const createReview = async function (req, res) {
    try {
        const bookId = req.params.bookId
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "provide valid bookId in params" })
        }
        let bookData = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!bookData) {
            return res.status(404).send({ status: false, message: "Book not found" })
        }
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, message: "Please Enter valid data in body to create review" });
        }
        const { review, rating, reviewedBy } = req.body
        const filterReview = { bookId, rating, reviewedAt: new Date() }
        if (rating) {
            if (!validator.isValidRating(rating)) {
                return res.status(400).send({ status: false, message: "Please Enter valid rating between 1 to 5" });
            }
            if (review) {
                if (!validator.isValid(review)) {
                    return res.status(400).send({ status: false, message: "Please Enter valid review" });
                }
                filterReview["review"] = review
            }
            if (reviewedBy) {
                if (!validator.isValid(reviewedBy)) {
                    return res.status(400).send({ status: false, message: "Please Enter valid reviewer name" });
                }
                filterReview["reviewedBy"] = reviewedBy
            }
            await bookModel.findByIdAndUpdate({ _id: bookId }, { reviews: bookData.reviews + 1 })
            let createReview = await (await reviewModel.create(filterReview)).populate("bookId",{__v:0})
            return res.status(201).send({ status: true, message: "Success", data: createReview })
        }
        else {
            return res.status(400).send({ status: false, message: "Please Enter rating" });
        }
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

// <<<<<<<<<<<<=======Update review function ==========>>>>>>>>>>//

const updateReview = async function (req, res) {
    try {
        let { bookId, reviewId } = req.params
        let { review, rating, reviewedBy } = req.body
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "please provide valid bookId" })
        }
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).send({ status: false, message: "please provide valid reviewId" })
        }
        let checkBook = await bookModel.findOne({ _id: bookId, isDeleted: false })
        // console.log(checkBook,reviewId)
        if (!checkBook) {
            return res.status(404).send({ status: false, message: "Book not found" })
        }
        let checkReview = await reviewModel.findOne({ _id: reviewId, bookId:bookId, isDeleted: false })
        console.log(checkReview)
        if (checkReview) {
            if (Object.keys(req.body).length === 0) {
                return res.status(400).send({ status: false, message: "To update any fields write valid key and value" })
            }
            if (rating || review || reviewedBy) {
                let reviewData = {}
                if (rating) {
                    if (!validator.isValidRating(rating)) {
                        return res.status(400).send({ status: false, message: "Please Enter valid rating between 1 to 5" });
                    }
                    reviewData["rating"] = rating
                }
                if (review) {
                    if (!validator.isValid(review)) {
                        return res.status(400).send({ status: false, message: "Please Enter valid review" });
                    }
                    reviewData["review"] = review
                }
                if (reviewedBy) {
                    if (!validator.isValid(reviewedBy)) {
                        return res.status(400).send({ status: false, message: "Please Enter valid reviewer name" });
                    }
                    reviewData["reviewedBy"] = reviewedBy
                }
                let updatedReviewData = await reviewModel.findByIdAndUpdate({ _id: checkReview._id }, reviewData, { new: true }).populate('bookId',{__v:0}).select({isDeleted:0, __v:0})
                return res.status(200).send({ status: false, message: "Success", data: updatedReviewData })
            }
            else {
                return res.status(400).send({ status: false, message: "You can only update review, reviewedBy and rating " });
            }
        }
        else {
            return res.status(404).send({ status: false, message: "review not found" })
        }
    } 
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//<<<<<<<<<<<<<<<===========Delte Book Review===========>>>>>>>>>>>>>>>>//

const deleteBookReview = async function (req, res) {
    try {
        let { bookId, reviewId } = req.params
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).send({ status: false, message: "Incorrect reviewId request " });
        }
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Incorrect bookId request" });
        }
        const findBook = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (findBook) {
            const review = await reviewModel.findOne({ _id: reviewId, bookId, isDeleted: false });
            if (review) {
                await reviewModel.findByIdAndUpdate({ _id: reviewId }, { $set: { isDeleted: true, deletedAt: new Date() } });
                await bookModel.findByIdAndUpdate({ _id: bookId }, { reviews: findBook.reviews - 1 });
                return res.status(200).send({ status: true, message: "success" });
            }
            else {
                return res.status(404).send({ status: false, message: "No review for the Book" });
            }
        }
        else {
            return res.status(404).send({ status: false, message: "Book not found" });
        }
    } 
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createReview, updateReview, deleteBookReview }