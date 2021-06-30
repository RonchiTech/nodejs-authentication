const express = require('express');
const { check } = require('express-validator/check');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.post('/login', authController.postLogin);

router.post(
  '/signup',
  check('email')
    .isEmail()
    .withMessage('Invalid Email')
    .custom((value, { req }) => {
      if (value === 'admin@admin.com') {
        throw new Error('This email is forbidden');
      }
      return true;
    }),
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.post('/reset', authController.postReset);

router.get('/reset/:tokenId', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
