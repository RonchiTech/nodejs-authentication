const User = require('../models/user');
const bcrpyt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        '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',
    },
  })
);

exports.getLogin = (req, res, next) => {
  let error = req.flash('error');
  if (error.length > 0) {
    error = error[0];
  } else {
    error = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    // isAuthenticated: false,
    hasError: error,
  });
};

exports.getSignup = (req, res, next) => {
  let error = req.flash('error');
  if (error.length > 0) {
    error = error[0];
  } else {
    error = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    // isAuthenticated: false,
    hasError: error,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Not a valid email');
        return res.redirect('/login');
      }
      bcrpyt
        .compare(password, user.password)
        .then((isPasswordMatched) => {
          if (isPasswordMatched) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              // req.flash('error', 'Problem occured');
              res.redirect('/');
            });
          }
          req.flash('error', 'Incorrect Password');
          res.redirect('/login');
        })
        .catch((err) => {
          console.log(err);
          // req.flash('error', 'Something went wrong...');
          return redirect('/login');
        });
    })
    .catch((err) => {
      // req.flash('error', 'Something went wrong...');
      console.log(err);
    });

  // User.findById('5bab316ce0a7c75f783cb8a8')
  //   .then((user) => {
  //     req.session.isLoggedIn = true;
  //     req.session.user = user;
  //     req.session.save((err) => {
  //       console.log(err);
  //       res.redirect('/');
  //     });
  //   })
  //   .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash(
          'error',
          'Email has already been taken. Please use another one.'
        );
        return res.redirect('/signup');
      }
      return bcrpyt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          res.redirect('/login');
          return transporter
            .sendMail({
              to: email,
              from: 'shopapp@ronchi.com',
              subject: 'Account Confirmation',
              html: '<h1>Congratualations! You created an account.',
            })
            .catch((err) => {
              console.log(err);
            });
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let error = req.flash('error');
  if (error.length > 0) {
    error = error[0];
  } else {
    error = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    // isAuthenticated: false,
    hasError: error,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No user found!');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect('/');
        return transporter
          .sendMail({
            to: req.body.email,
            from: 'shopapp@ronchi.com',
            subject: 'Password Reset',
            html: `
              <p>You requested a password reset</p>
              <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new password.</p>
            `,
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.tokenId;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let error = req.flash('error');
      if (error.length > 0) {
        error = error[0];
      } else {
        error = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        // isAuthenticated: false,
        hasError: error,
        userId: user._id.toString(),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
