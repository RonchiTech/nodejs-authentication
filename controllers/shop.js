const fs = require('fs');
const path = require('path');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

const PDFDocument = require('pdfkit');
exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = req.query.page;
  let totalItems;
  Product.find()
    .countDocument()
    .then((prodCount) => {
      totalItems = prodCount;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      console.log('PRODUCTS:::', products);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        // return res.redirect('/404');
        // return next(new Error('No Orders Found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized Access.'));
        // return console.log('HA');
      }
      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoice', invoiceName);

      const doc = new PDFDocument();
      res.setHeader('Content-type', 'application/pdf');
      res.setHeader(
        'Content-disposition',
        'inline;filename="' + invoiceName + '"'
      );
      doc.pipe(fs.createWriteStream(invoicePath));
      doc.pipe(res);
      doc.fontSize(25).text('Orders', {
        underline: true,
      });
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.product.price * prod.quantity;
        doc
          .fontSize(14)
          .text(
            `${prod.product.title}  -  ${prod.quantity}pcs x \$${prod.product.price}`
          );
      });
      doc.text('------------------------------------------------------');
      doc.text(`Total Price: \$${totalPrice}`);
      doc.end();

      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-type', 'application/pdf');
      // res.setHeader(
      //   'Content-disposition',
      //   'inline;filename="' + invoiceName + '"'
      // );
      // file.pipe(res);

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //     // return console.log('ATAY');
      //   }
      //   console.log(data);
      //   res.setHeader('Content-type', 'application/pdf');
      //   res.setHeader(
      //     'Content-disposition',
      //     'inline;filename="' + invoiceName + '"'
      //   );
      //   // res.setHeader(
      //   //   'Content-disposition',
      //   //   'attachment;filename="' + invoiceName + '"'
      //   // );
      //   res.send(data);
      // });
    })
    .catch((err) => {
      // next(err);
      res.redirect('/404');
      // console.log('ERR',err);
    });
};
