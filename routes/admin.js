const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const routeProtection = require('../middleware/routeProtection')
const router = express.Router();

// /admin/add-product => GET
router.get('/add-product',routeProtection, adminController.getAddProduct);

// /admin/products => GET
router.get('/products',routeProtection, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',routeProtection, adminController.postAddProduct);

router.get('/edit-product/:productId',routeProtection, adminController.getEditProduct);

router.post('/edit-product', routeProtection,adminController.postEditProduct);

router.post('/delete-product',routeProtection, adminController.postDeleteProduct);

module.exports = router;
