import pool from '../db/connection.js';

export const getOrders = (req, res) => {
  console.log('🔍 [GET ORDERS] Starting database query...');
  console.log('📋 [GET ORDERS] Pool state:', pool._closed ? 'CLOSED' : 'OPEN');
  
  // Test if pool is working
  pool.getConnection((connErr, connection) => {
    if (connErr) {
      console.error('❌ [GET ORDERS] Pool connection error:', connErr);
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed',
        details: connErr.message 
      });
    }
    
    console.log('✅ [GET ORDERS] Got connection from pool');
    
    connection.query('SELECT * FROM orders', (err, results) => {
      // Always release the connection back to the pool
      connection.release();
      
      if (err) {
        console.error('❌ [GET ORDERS] Database query error:', err);
        console.error('❌ [GET ORDERS] Error code:', err.code);
        console.error('❌ [GET ORDERS] SQL State:', err.sqlState);
        console.error('❌ [GET ORDERS] Full error:', err);
        
        return res.status(500).json({ 
          success: false, 
          error: 'Database query failed',
          details: err.message,
          code: err.code
        });
      }
      
      console.log(`✅ [GET ORDERS] Successfully fetched ${results.length} orders`);
      res.json({ success: true, data: results });
    });
  });
};

// Keep other functions but update them similarly...
export const createOrder = (req, res) => {
  const { order_id, customer_name, product, quantity, order_date, status } = req.body;
  
  pool.getConnection((connErr, connection) => {
    if (connErr) {
      console.error('❌ [CREATE ORDER] Pool connection error:', connErr);
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed',
        details: connErr.message 
      });
    }
    
    const sql = 'INSERT INTO orders (order_id, customer_name, product, quantity, order_date, status) VALUES (?, ?, ?, ?, ?, ?)';
    
    connection.query(sql, [order_id, customer_name, product, quantity, order_date, status], (err, result) => {
      connection.release();
      
      if (err) {
        console.error('❌ [CREATE ORDER] Error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create order', details: err.message });
      }
      res.json({ success: true, message: 'Order added', data: { id: result.insertId } });
    });
  });
};