const Order = require("../../models/orderdbSchema");


// orders load
const ordersLoad = async (req, res) => {

    try {

        const orderData = await Order.find({});

        const sortedOrderData = orderData.sort((a,b) => b.date - a.date);

        res.render("orders", {sortedOrderData});

    } catch (error) {
        console.log(error.message);
    }

}

// changing order status - shipping
const shippedStatusChange = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        const isDelivered = order.products.find(product => product.status === 'Order Delivered');
        if (isDelivered) {
            return res.json({ error: 'Cannot be Shipped. Order is already Delivered.' });
        }

        const isCancelled = order.products.find(product => product.status === 'Cancelled by Admin');
        if (isCancelled) {
            return res.json({ error: 'Cannot be Shipped. Order cancelled by Admin.' });
        }

        let productToUpdate = order.products.find(product => product.status === 'Order Placed');

        if (!productToUpdate) {
            return res.json({ error: 'Product is not Placed yet.!' });
        }

        productToUpdate.status = 'Order Shipped';
        await order.save();

        return res.json({ message: 'Order status updated to Shipped successfully' });
    } catch (error) {
        console.log(error.message);
        return res.json({ error: 'An error occurred while updating the order status' });
    }
};



// changing order status - delivered
const deliveredStatusChange = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        let productToUpdate = null;
        for (const product of order.products) {
            if (product.status === 'Cancelled by Admin') {
                return res.json({ error: 'Cannot be Delivered. Order cancelled by Admin.!' });
            }
            if (product.status === 'Order Shipped') {
                productToUpdate = product;
            }
        }

        if (!productToUpdate) {
            return res.json({ error: 'Product is not Shipped yet.!' });
        }

        productToUpdate.status = 'Order Delivered';
        await order.save();

        return res.json({ message: 'Order status updated to Delivered successfully' });
    } catch (error) {
        console.log(error.message);
        return res.json({ error: 'An error occurred while updating the order status' });
    }
};


// changing order status - cancelled
const cancelledStatusChange = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const productId = req.body.productId;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        const product = order.products.find(prdct => prdct._id.toString() === productId);

        if (!product) {
            return res.json({ error: 'Product not found' });
        }

        if (product.status === 'Cancelled by Admin') {
            return res.json({ error: 'Product is already cancelled' });
        }

        product.status = 'Cancelled by Admin';
        await order.save();

        return res.json({ message: 'Order status updated to Cancelled successfully' });
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {

    ordersLoad,
    shippedStatusChange,
    deliveredStatusChange,
    cancelledStatusChange

}