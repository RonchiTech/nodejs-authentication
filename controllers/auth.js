const User = require('../models/user');
const bcrpyt = require('bcryptjs');
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
