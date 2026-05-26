const express = require('express');
const router = express.Router();
const { register, login, updateAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.put('/profile/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
