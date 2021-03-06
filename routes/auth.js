const express = require('express');
const User = require('../models/user');
const { check, body } = require('express-validator/check');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid Email').normalizeEmail(),
    body(
      'password',
      'Password should be at least 5 characters and with only numbers and text'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Invalid Email')
      .custom((value, { req }) => {
        // if (value === 'admin@admin.com') {
        //   throw new Error('This email is forbidden');
        // }
        // return true;
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              'Email Already Exists, please enter a different one.'
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      'password',
      'Password should be at least 5 characters and with only numbers and text'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword').trim().custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.post('/reset', authController.postReset);

router.get('/reset/:tokenId', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
