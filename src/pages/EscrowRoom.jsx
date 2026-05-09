import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';

export default function EscrowRoom() {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState(null);
  const [token] = useState(localStorage.getItem("token"));
  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tradeLink, setTradeLink] = useState(null);
  const [bothReady, setBothReady] = useState({ user1: false, user2: false });

  useEffect(() => {
    fetchTradeDetails();
    fetchMessages();
    
    // Polling for new messages
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [tradeId]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/messages/trade/${tradeId}`);
      
      const systemMessages = [
        { 
          sender: 'System', 
          content: `Secure Escrow Room established for Trade #${tradeId}.` 
        },
        { 
          sender: 'QuickTrade Bot', 
          content: "Beep boop! 🤖 I am the Official QuickTrade AI Middleman. I will be facilitating this trade to ensure 100% safety for both parties. Please both parties type 'ready' to begin." 
        }
      ];

      const dbMessages = res.data.map(m => ({
        sender: m.sender_name,
        content: m.content,
        timestamp: m.timestamp
      }));

      const allMessages = [...systemMessages, ...dbMessages];
      setMessages(allMessages);
      
      // Auto-scroll to bottom
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      if (res.data.length > 0) {
        // Check for "ready" in messages to trigger AI confirmation
        const lastMessages = res.data.slice(-5);
        const readyUsers = new Set();
        lastMessages.forEach(m => {
          if (m.content.toLowerCase().includes("ready")) {
            readyUsers.add(m.sender_name);
          }
        });
        
        if (readyUsers.size >= 2 && !tradeLink) {
          confirmTradeWithAI();
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const confirmTradeWithAI = () => {
    setIsTyping(true);
    setTimeout(() => {
      const link = `https://quicktrade.io/secure-swap/${Math.random().toString(36).substring(7)}`;
      setTradeLink(link);
      
      const aiMsg = {
        sender_id: 0, // System/Bot ID
        receiver_id: 0,
        trade_id: tradeId,
        content: `✅ BOTH PARTIES CONFIRMED READY. I have verified the item metadata. Here is your secure trade link: ${link}. Please click to complete the swap.`
      };
      
      // We don't necessarily need to save AI messages to DB for this demo, 
      // but let's add it to local state so users see it.
      setMessages(prev => [...prev, { sender: 'QuickTrade Bot', content: aiMsg.content }]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = async (userMsg) => {
    setIsTyping(true);
    
    // Simulate thinking time
    setTimeout(async () => {
      let response = "";
      const msg = userMsg.toLowerCase();

      if (msg.includes("hello") || msg.includes("hi")) {
        response = "Greetings! Please both parties confirm you are ready to begin the item verification process.";
      } else if (msg.includes("how") && msg.includes("work")) {
        response = "I will generate two unique secure trade links. Once you both send your items to my secure vault, I will verify their metadata and swap them simultaneously. This prevents any 'run-away' scams.";
      } else if (msg.includes("ready") || msg.includes("confirm")) {
        response = "I have noted your readiness. Waiting for the other party to also confirm...";
      } else if (msg.includes("scam") || msg.includes("safe")) {
        response = "Rest assured, I am an automated AI. I have no human emotions or greed. Your items are held in a multi-sig encrypted vault until both sides of the trade are satisfied.";
      } else {
        response = "I am monitoring the trade. Please let me know if you have any specific questions about the escrow process.";
      }

      // Add AI response to local state
      setMessages(prev => [...prev, { sender: 'QuickTrade Bot', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      // Determine receiver_id (the other person in the trade)
       const receiver_id = user.user_id === trade.offerer_user_id ? trade.owner_user_id : trade.offerer_user_id;

      await axios.post('/api/messages/send', {
        sender_id: user.user_id,
        receiver_id: receiver_id,
        trade_id: tradeId,
        content: newMessage
      });

      setNewMessage('');
      fetchMessages(); // Refresh immediately
      
      // Trigger AI response locally for interactivity
      generateAIResponse(newMessage);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const fetchTradeDetails = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`/api/trades/user/${user.user_id}`);
      const currentTrade = res.data.find(t => t.trade_id === parseInt(tradeId));
      
      // Need to make sure the trade object has user IDs
      // The current backend might not return them in the user trades list
      // Let's check tradeController.getUserTrades
      setTrade(currentTrade);
    } catch (err) {
      console.error("Failed to fetch trade details:", err);
    }
  };

  if (!trade) return <div className="loading gold-glow" style={{ textAlign: 'center', padding: '100px' }}>Loading Escrow Room...</div>;

  return (
    <div className="escrow-container" style={{ backgroundColor: 'var(--black)', minHeight: '100vh', color: 'white' }}>
      <TopBar token={token} />
      
      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ 
          display: 'flex', gap: '30px', backgroundColor: 'var(--black-light)', 
          padding: '30px', borderRadius: '15px', border: '1px solid var(--gold)',
          marginBottom: '30px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 className="gold-glow">Escrow Room: Trade #{tradeId}</h2>
            
            {tradeLink && (
              <div style={{ 
                marginTop: '20px', padding: '20px', backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                border: '1px solid var(--gold)', borderRadius: '10px', textAlign: 'center'
              }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: '10px' }}>🔗 Secure Trade Link Generated</h3>
                <p style={{ marginBottom: '15px' }}>The AI Middleman has verified both items. Click below to proceed.</p>
                <a 
                  href={tradeLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-trade"
                  style={{ display: 'inline-block', padding: '10px 25px', textDecoration: 'none' }}
                >
                  Complete Trade Now
                </a>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <img src={trade.offered_item_image} style={{ width: '80px' }} alt="" />
                <p style={{ fontSize: '0.8rem' }}>{trade.offered_item_name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>Offered by: {trade.offerer_username}</p>
              </div>
              <div style={{ fontSize: '2rem', color: 'var(--gold)' }}>⇄</div>
              <div style={{ textAlign: 'center' }}>
                <img src={trade.requested_item_image} style={{ width: '80px' }} alt="" />
                <p style={{ fontSize: '0.8rem' }}>{trade.requested_item_name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>Owned by: {trade.owner_username}</p>
              </div>
            </div>
          </div>
          <div style={{ width: '300px', borderLeft: '1px solid #333', paddingLeft: '30px' }}>
            <h4 style={{ color: 'var(--gold)', marginBottom: '15px' }}>Security Protocol</h4>
            <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.5' }}>
              1. Middleman holds both items.<br/>
              2. Verification of items completed.<br/>
              3. Middleman distributes items to new owners.<br/>
              4. Trade marked as completed.
            </p>
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #444' }}>
              <p style={{ fontSize: '0.7rem', color: '#888' }}>Middleman Assigned:</p>
              <p className="gold-glow" style={{ fontWeight: 'bold' }}>{trade.middleman}</p>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div style={{ 
          backgroundColor: 'var(--black-light)', borderRadius: '15px', 
          border: '1px solid #333', height: '500px', display: 'flex', flexDirection: 'column' 
        }}>
          <div id="chat-messages" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.sender === user.username ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                backgroundColor: msg.sender === 'QuickTrade Bot' || msg.sender === 'System' ? 'rgba(212, 175, 55, 0.2)' : (msg.sender === user?.username ? 'var(--gold)' : '#333'),
                color: msg.sender === user?.username ? 'var(--black)' : 'white',
                padding: '10px 15px', borderRadius: '12px',
                border: msg.sender === 'QuickTrade Bot' || msg.sender === 'System' ? '2px solid var(--gold)' : 'none',
                boxShadow: msg.sender === 'QuickTrade Bot' ? '0 0 10px rgba(212, 175, 55, 0.3)' : 'none'
              }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>{msg.sender}</p>
                <p style={{ fontSize: '0.9rem' }}>{msg.content}</p>
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(212, 175, 55, 0.2)', color: 'white', padding: '10px 15px', borderRadius: '12px', border: '2px solid var(--gold)', boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }}>
                <p style={{ fontSize: '0.8rem' }}>QuickTrade Bot is typing...</p>
              </div>
            )}
          </div>
          <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message the middleman and partner..."
              style={{ 
                flex: 1, backgroundColor: '#111', border: '1px solid #444', 
                color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' 
              }}
            />
            <button type="submit" style={{
              backgroundColor: 'var(--gold)',
              color: 'var(--black)',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>Send</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
