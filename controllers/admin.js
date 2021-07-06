const Product = require('../models/product');
// const mongoose = require('mongoose')
const fileUtil = require('../util/file');
exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    product: {
      title: '',
      price: null,
      description: '',
    },
    errorMessage: '',
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title,
        price,
        description,
      },
      errorMessage: 'File attached is not an image',
      validationErrors: [],
    });
  }
  const imageUrl = image.path;
  const user = {
    userId: req.user._id,
    userEmail: req.user.email,
  };

  const product = new Product({
    // _id: new mongoose.Types.ObjectId('60d9f387b9ca750e283448fd'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    user: user,
  });
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      // console.log(err);
      // res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  // console.log('rendered');
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  // console.log('rendered');
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      // throw new Error('dummy')
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      // console.log('HAS ERR',err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  Product.findById(prodId)
    .then((product) => {
      if (product.user.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        fileUtil.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then((result) => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ 'user.userId': req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((products) => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('No Product Found'));
      }
      fileUtil.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, 'user.userId': req.user._id });
    })
    .then(() => {
      res.status(200).json({message: 'Success: Product was deleted'})
      // console.log('DESTROYED PRODUCT');
      // res.redirect('/admin/products');
    })
    .catch((err) => {
      res.status(500).json({ message: 'Deleting Product Failed' });
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
    });
};

// exports.postDeleteProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   Product.findById(prodId)
//     .then((product) => {
//       if (!product) {
//         return next(new Error('No Product Found'));
//       }
//       fileUtil.deleteFile(product.imageUrl);
//       return Product.deleteOne({ _id: prodId, 'user.userId': req.user._id });
//     })
//     .then(() => {
//       console.log('DESTROYED PRODUCT');
//       res.redirect('/admin/products');
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };
