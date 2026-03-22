const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/images');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/excel');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const imageFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Only image files allowed'), false);
    }
};

const excelFilter = (req, file, cb) => {
    const allowed = /xlsx|xls|csv/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel/CSV files allowed'), false);
    }
};

const uploadImages = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
}).array('images', 20);

const uploadExcel = multer({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
}).single('excel');

const uploadMixed = multer({
    storage: imageStorage,
    limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
    { name: 'images', maxCount: 20 },
    { name: 'excel', maxCount: 1 },
]);

module.exports = { uploadImages, uploadExcel, uploadMixed };
