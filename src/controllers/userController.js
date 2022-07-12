const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const { isValidObject, isValid, validTitle, isValidPinCode } = require('../validators/validator')

//===========================================================================================
// regex declaraion
const nameRegex = /[a-zA-Z]/
const mobileRegex = /^[6-9]\d{9}$/
const emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,15}$/
//===========================================================================================

const createUser = async function (req, res) {
   try {
      if (!isValidObject(req.body)) {
         res.status(400).send({ status: false, message: "Provide all mandatory user information" })
      }
      else {
         let { title, name, phone, email, password, address } = req.body
         userData = { title, name, phone, email: email, password, address }

         // validation for all fields
         let inValid = ""
         if (!validTitle(title)) inValid = inValid + "title, "
         if (!isValid(name) || !nameRegex.test(name)) inValid = inValid + "name, "
         if (!isValid(phone) || !mobileRegex.test(phone)) inValid = inValid + "phone, "
         if (!isValid(email) || !emailRegex.test(email)) inValid = inValid + "email "
         if (!validTitle(title) || !isValid(name) || !nameRegex.test(name) || !isValid(phone) || !mobileRegex.test(phone) || !isValid(email) || !emailRegex.test(email)) {
            return res.status(400).send({ status: false, message: `Pliz provide valid ${inValid}and it is mandatory fields` })
         }

         //  checking email or phone number unique or not here 
         let uniqueEmail = await userModel.findOne({ email: email.toLowerCase() })
         let uniquePhone = await userModel.findOne({ phone: phone })
         let duplicate = ""
         if (uniqueEmail) duplicate += "Email,"
         if (uniquePhone) duplicate += "Phone "
         if (uniqueEmail || uniquePhone) {
            return res.status(409).send({ status: false, message: `${duplicate}is already registered here provide unique`})
         }

         // psswd validation
         if (!passwordRegex.test(password)) {
            return res.status(400).send({ status: false, message: "password length 8 to 15 char, it must contain 1 upperCase, 1 lowerCase, 1 Number, 1 Special Character" })
         }
         //==============================
         if (address) {
            if (isValidObject(address)) {
               const { street, city, pincode } = address
               let empStr = ""
               if (!isValid(street)) empStr += "street, "
               if (!isValid(city)) empStr += "city, "
               if (!isValidPinCode(pincode)) empStr += "pincode "
               if (!isValid(street) || !isValid(city) || !isValidPinCode(pincode)) {
                  return res.status(400).send({ status: false, message: `Address must conatin ${empStr}and valid fields` })
               }
            }
            else {
               return res.status(400).send({ status: false, message: "Address must be in object form street, city, pincode" })
            }
         }
         let savedUser = await userModel.create(userData)
         return res.status(201).send({ status: true, message: "Success", data: savedUser })
      }
   } 
   catch (err) {
      return res.status(500).send({ status: false, message: err.message })
   }
}

//<<<<<<<<<<<<<<<<<<<<<<=============================Login User==========================>>>>>>>>>>>>>>>>>>>>>>>>>>>

const loginUser = async function (req, res) {
   try {
      let email = req.body.email;
      let password = req.body.password
      if (Object.keys(req.body).length == 0) {
         return res.status(400).send({ status: false, message: "No information passed" });
      }
      if (!(email && password)) {
         return res.status(400).send({ status: false, message: "Email-Id and Password must be provided...!" });
      }
      if (!email.match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/)) {
         return res.status(400).send({ status: false, message: "Wrong email format" });
      }
      let user = await userModel.findOne({ email: email.toLowerCase(), password: password });
      if (!user) {
         return res.status(404).send({ status: false, message: " Email or Password wrong" });
      }
      const iat = Date.now()
      const exp = (iat) + (24 * 60 * 60 * 1000)
      let token = jwt.sign(
         {
            userId: user._id.toString(),
            iat: iat,
            exp: exp
         },
         "project/booksManagementGroup7"
      );
      res.status(200).setHeader("x-api-key", token);
      return res.status(200).send({ status: true, message: "token will be valid for 24 hrs", data: { token: token } });

   } 
   catch (err) {
      return res.status(500).send({ status: false, message: err.message })
   }
}

module.exports = { createUser, loginUser }