const Order = require("../../models/orderdbSchema");


// orders load
const ordersLoad = async (req, res) => {

    try {

        const orderData = await Order.find({});

        res.render("orders", {orderData});

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

        let productToUpdate;
        for (const product of order.products) {
            if (product.status === 'Order Placed') {
                productToUpdate = product;
                break;
            }
        }

        if (!productToUpdate) {
            return res.json({ error: 'No product with status "Order Placed" found in the order' });
        }

        productToUpdate.status = 'Order Shipped';
        await order.save();

        return res.json({ message: 'Order status updated to Shipped successfully' });
    } catch (error) {
        console.log(error.message);
    }
};

// changing order status - delivered
const deliveredStatusChange = async (req, res) =>{
    try {
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        let productToUpdate;
        for (const product of order.products) {
            if (product.status == 'Order Shipped') {
                productToUpdate = product;
                break;
            }
        }

        if (!productToUpdate) {
            return res.json({ error: 'No product with status "Order Placed" found in the order' });
        }

        productToUpdate.status = 'Order Delivered';
        await order.save();

        return res.json({ message: 'Order status updated to Shipped successfully' });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {

    ordersLoad,
    shippedStatusChange,
    deliveredStatusChange,

}