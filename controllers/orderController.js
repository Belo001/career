import pool from '../db/connection.js';

export const getOrders = (req, res) => {
  pool.query('SELECT * FROM orders', (err, results) => {
    if (err) {
      console.error('Get orders error:', err.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }
    res.json({ success: true, data: results });
  });
};

export const createOrder = (req, res) => {
  const { order_id, customer_name, product, quantity, order_date, status } = req.body;
  
  if (!order_id || !customer_name || !product) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }

  const sql = 'INSERT INTO orders (order_id, customer_name, product, quantity, order_date, status) VALUES (?, ?, ?, ?, ?, ?)';
  
  pool.query(sql, [order_id, customer_name, product, quantity, order_date, status], (err, result) => {
    if (err) {
      console.error('Create order error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to create order' });
    }
    res.json({ success: true, message: 'Order added' });
  });
};

export const updateOrder = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, id], (err, result) => {
    if (err) {
      console.error('Update order error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to update order' });
    }
    res.json({ success: true, message: 'Order updated' });
  });
};

export const deleteOrder = (req, res) => {
  const { id } = req.params;
  
  pool.query('DELETE FROM orders WHERE order_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Delete order error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to delete order' });
    }
    res.json({ success: true, message: 'Order deleted' });
  });
};