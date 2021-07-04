const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const routeProtection = require('../middleware/routeProtection');
const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', routeProtection, shopController.getCart);

router.post('/cart', routeProtection, shopController.postCart);

router.post(
  '/cart-delete-item',
  routeProtection,
  shopController.postCartDeleteProduct
);

router.post('/create-order', routeProtection, shopController.postOrder);

router.get('/orders', routeProtection, shopController.getOrders);

router.get('/orders/:orderId', routeProtection, shopController.getInvoice);

module.exports = router;
