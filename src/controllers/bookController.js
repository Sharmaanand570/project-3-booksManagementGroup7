const mongoose = require("mongoose")
const userModel = require("../models/userModel")
const bookModel = require("../models/bookModel")
const reviewModel = require("../models/reviewModel")
const validator = require("../validators/validator")

//<<<<<<<<<<<<<<<<<<============================================CREATE BOOKS========================================>>>>>>>>>>>>>>>>>>>

const createBook = async function (req, res) {
    try {
        let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = req.body
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, message: "Please enter the data to create book" })
        }
        if ((title && excerpt && userId && ISBN && category && subcategory && releasedAt)) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).send({ status: false, message: "Please enter valid userId" })
            }
            const findUser = await userModel.findById(userId.trim())
            if (!findUser) {
                return res.status(404).send({ status: false, message: "User not found" })
            }
            if (req.loginUserId == userId) {
                if (!validator.isValid(title)) {
                    return res.status(400).send({ status: false, message: "Please enter valid title in String" })
                }
                const findTitle = await bookModel.findOne({ title: title.trim().toUpperCase() })
                if (findTitle) {
                    return res.status(409).send({ status: false, message: `title ${title.trim()} is already present` })
                }
                if (!validator.isValid(excerpt)) {
                    return res.status(400).send({ status: false, message: "Please enter valid excerpt in String" })
                }
                if (!validator.isValidISBN(ISBN)) {
                    return res.status(400).send({ status: false, message: "Please enter valid ISBN Number and size should be of 13 or 10 e.g: '9781234567890' or '1234567890'" })
                }
                ISBN = ISBN.toString()
                if (ISBN.trim().length == 10) {
                    ISBN = "978" + ISBN.trim()
                }
                const findISBN = await bookModel.findOne({ ISBN: ISBN.trim() })
                if (findISBN) {
                    return res.status(409).send({ status: false, message: "ISBN number is already present" })
                }
                if (!validator.isValid(category)) {
                    return res.status(400).send({ status: false, message: "Please enter valid category in String" })
                }
                if (!validator.isValidArray(subcategory)) {
                    return res.status(400).send({ status: false, message: "Please enter valid subcategory in array (string) and no empty string in array e.g:['subcategory1']" })
                }
                if (!validator.isValidDate(releasedAt)) {
                    return res.status(400).send({ status: false, message: "Please Enter valid releasedAt in string and format should be in 'YYYY-MM-DD'" });
                }
                const bookData = {
                    title: title.trim().toUpperCase(),
                    excerpt: excerpt.trim(),
                    userId: userId.trim(),
                    ISBN: ISBN.trim(),
                    category: category.trim(),
                    subcategory: subcategory,
                    releasedAt: releasedAt.trim()
                }
                const createBook = await bookModel.create(bookData)
                return res.status(201).send({ status: true, message: 'Success', data: createBook })
            }
            else {
                return res.status(403).send({ status: false, message: `You are unauthorized to create book with this userId: ${userId}` })
            }
        }
        else {
            return res.status(400).send({ status: false, message: "Please enter title, excerpt, userId, ISBN, category, subcategory and releasedAt with its value, these fields are mandatory to create book" })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//<<<<<<<<<<<<<<<<<<============================================GET BOOKS========================================>>>>>>>>>>>>>>>>>>>

const getBooks = async function (req, res) {
    try {
        const { userId, category, subcategory } = req.query
        const filterBook = { isDeleted: false }
        if (userId || userId == "") {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).send({ status: false, message: "Invalid userId" })
            }
            filterBook["userId"] = userId
        }
        if (category) {
            filterBook["category"] = category
        }
        if (subcategory) {
            const subcategoryArr = subcategory.trim().split(',').map(subcategory => subcategory.trim())
            filterBook['subcategory'] = { $all: subcategoryArr }
        }
        let returnBooks = await bookModel.find(filterBook).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })
        if (Object.keys(returnBooks).length == 0) {
            return res.status(404).send({ status: false, message: " book not found" })
        }
        else {
            return res.status(200).send({ status: true, message: 'Books list', data: returnBooks })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//<<<<<<<<<<<============= Get Books Details By Book Id ===========>>>>>>>>>>>>

const getBooksById = async function (req, res) {
    try {
        let bookId = req.params.bookId
        if (bookId) {
            if (mongoose.Types.ObjectId.isValid(bookId)) {
                const getBookData = await bookModel.findOne({ _id: bookId, isDeleted: false }, { deletedAt: 0, ISBN: 0, __v: 0 })
                if (getBookData) {
                    let reviewsData = await reviewModel.find({ bookId: getBookData._id, isDeleted: false }, { isDeleted: 0, __v: 0, createdAt: 0, updatedAt: 0 })
                    getBookData._doc.reviewsData = reviewsData
                    return res.status(200).send({ status: true, message: 'Books list', data: getBookData })
                }
                else {
                    return res.status(404).send({ status: false, message: "book not found" })
                }
            }
            else {
                return res.status(400).send({ status: false, message: "Book Id is invalid " })
            }
        }
        else {
            return res.status(400).send({ status: false, message: "please eneter the bookId" })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//<<<<<<<<<<<<<<<<<<============================================UPDATE BOOK BY ID========================================>>>>>>>>>>>>>>>>>>>

const updateBookById = async function (req, res) {
    try {
        const bookId = req.params.bookId
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send("provide valid bookId in params")
        }
        const bookData = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!bookData) {
            return res.status(404).send({ status: false, message: "book not found" })
        }
        if (req.loginUserId == bookData.userId) {
            if (Object.keys(req.body).length == 0) {
                return res.status(400).send({ status: false, message: "Please Enter valid data in body to update" });
            }
            let { title, excerpt, releasedAt, ISBN } = req.body
            if (title || excerpt || releasedAt || ISBN) {
                let filterBook = {}
                if (title) {
                    if (!validator.isValid(title)) {
                        return res.status(400).send({ status: false, message: "Please Enter valid title in string" });
                    }
                    findTitle = await bookModel.findOne({ title: title.trim().toUpperCase() })
                    if (findTitle) {
                        return res.status(409).send({ status: false, message: "title is already present" });
                    }
                    filterBook["title"] = title.trim().toUpperCase()
                }
                if (excerpt) {
                    if (!validator.isValid(excerpt)) {
                        return res.status(400).send({ status: false, message: "Please Enter valid excerpt in string" });
                    }
                    filterBook["excerpt"] = excerpt.trim()
                }
                if (releasedAt) {
                    if (!validator.isValidDate(releasedAt.trim())) {
                        return res.status(400).send({ status: false, message: "Please Enter valid releasedAt in string and format should be in 'YYYY-MM-DD'" });
                    }
                    filterBook["releasedAt"] = releasedAt.trim()
                }
                if (ISBN) {
                    ISBN = ISBN.toString()
                    if (!validator.isValidISBN(ISBN)) {
                        return res.status(400).send({ status: false, message: "Please Enter valid ISBN number e.g:'9781234567890' or '1234567890' " });
                    }
                    if (ISBN.trim().length == 10) {
                        ISBN = "978" + ISBN.trim()
                    }
                    findISBN = await bookModel.findOne({ ISBN: ISBN.trim() })
                    if (findISBN) {
                        return res.status(409).send({ status: false, message: "ISBN number is already present" });
                    }
                    filterBook["ISBN"] = ISBN.trim()
                }
                const updateBook = await bookModel.findByIdAndUpdate({ _id: bookId }, filterBook, { new: true })
                if (!updateBook) {
                    return res.status(400).send({ status: false, message: "Nothing to Update" });
                }
                return res.status(200).send({ status: true, message: "Success", data: updateBook })
            }
            else {
                return res.status(400).send({ status: false, message: "please enter valid key and value to update" })
            }
        }
        else {
            return res.status(403).send({ status: false, message: "Unauthorized to update" })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//<<<<<<<<<<<<<=================Delete books by bookId============>>>>>>>>>>>>>>>>>>>>

const deleteBooks = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Incorrect BookId format" });
        }
        let book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: "book not found" })
        }
        if (req.loginUserId == book.userId) {
            await bookModel.findByIdAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
            return res.status(200).send({ status: true, message: "Success" })
        }
        else {
            return res.status(403).send({ status: false, message: "unauthorized to delete" })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createBook, getBooks, updateBookById, deleteBooks, getBooksById }