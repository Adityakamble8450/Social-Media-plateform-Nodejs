const multer = require("multer")
const {v4 : uudiv4} = require('uuid')
const path = require('path')

const storege = multer.diskStorage({
    destination : function (req , file , cb){
        cb(null , './public/images/uploads')
    },
    filename : function (req , file , cb){
        const uniquefilename = uudiv4();

        cb(null , uniquefilename + path.extname(file.originalname))
    }
})

const uploads = multer({storage : storege})

module.exports = uploads