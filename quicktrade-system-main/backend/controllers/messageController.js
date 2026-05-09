const sql = require("../db");

exports.sendMessage = async (req, res) => {
  const db = await sql.getDB();
  try {
    const { sender_id, receiver_id, trade_id, content, convo_id } = req.body;
    
    const result = await db.run(
      'INSERT INTO Messages (sender_id, receiver_id, trade_id, convo_id, content, timestamp) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [sender_id, receiver_id, trade_id || null, convo_id || null, content]
    );

    // Update conversation last message if convo_id exists
    if (convo_id) {
        await db.run(
            'UPDATE Conversations SET last_message = ?, last_timestamp = CURRENT_TIMESTAMP WHERE convo_id = ?',
            [content, convo_id]
        );
    }

    res.status(201).json({ 
        message: "Message sent", 
        msg_id: result.lastID 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.getTradeMessages = async (req, res) => {
  const db = await sql.getDB();
  try {
    const { trade_id } = req.params;
    const messages = await db.all(
      `SELECT m.*, u.username as sender_name 
       FROM Messages m 
       JOIN users u ON m.sender_id = u.user_id 
       WHERE m.trade_id = ? 
       ORDER BY m.timestamp ASC`,
      [trade_id]
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.getConversations = async (req, res) => {
    const db = await sql.getDB();
    try {
        const { user_id } = req.params;
        const convos = await db.all(
            `SELECT c.*, 
             u1.username as user1_name, 
             u2.username as user2_name
             FROM Conversations c
             JOIN users u1 ON c.user1_id = u1.user_id
             JOIN users u2 ON c.user2_id = u2.user_id
             WHERE c.user1_id = ? OR c.user2_id = ?
             ORDER BY c.last_timestamp DESC`,
            [user_id, user_id]
        );
        res.json(convos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
};
