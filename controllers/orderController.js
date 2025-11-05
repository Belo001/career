import pool from '../db/connection.js';

export const getOrders = (req, res) => {
  console.log('📋 Fetching orders...');
  
  pool.query('SELECT * FROM orders ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('❌ Get orders error:', err.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch orders',
        details: err.message 
      });
    }
    
    console.log(`✅ Found ${results.length} orders`);
    res.json({ success: true, data: results });
  });
};

export const createOrder = (req, res) => {
  const { order_id, customer_name, product, quantity, order_date, status } = req.body;
  
  // Validation
  if (!order_id || !customer_name || !product) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: order_id, customer_name, product' 
    });
  }

  const sql = `INSERT INTO orders (order_id, customer_name, product, quantity, order_date, status) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  const values = [order_id, customer_name, product, quantity || 1, order_date, status || 'Pending'];
  
  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Create order error:', err.message);
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          error: 'Order ID already exists' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create order',
        details: err.message 
      });
    }
    
    console.log(`✅ Order created: ${order_id}`);
    res.json({ 
      success: true, 
      message: 'Order added successfully',
      data: { id: result.insertId, order_id }
    });
  });
};

export const updateOrder = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ 
      success: false, 
      error: 'Status is required' 
    });
  }

  pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, id], (err, result) => {
    if (err) {
      console.error('❌ Update order error:', err.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update order',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    console.log(`✅ Order updated: ${id} -> ${status}`);
    res.json({ success: true, message: 'Order updated successfully' });
  });
};

export const deleteOrder = (req, res) => {
  const { id } = req.params;
  
  pool.query('DELETE FROM orders WHERE order_id = ?', [id], (err, result) => {
    if (err) {
      console.error('❌ Delete order error:', err.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete order',
        details: err.message 
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    console.log(`✅ Order deleted: ${id}`);
    res.json({ success: true, message: 'Order deleted successfully' });
  });
};