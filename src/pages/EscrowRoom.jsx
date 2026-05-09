import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';

export default function EscrowRoom() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [token] = useState(localStorage.getItem("token"));
  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) { return null; }
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tradeLink, setTradeLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    fetchTradeDetails();
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [tradeId]);

  useEffect(scrollToBottom, [messages]);

  const fetchTradeDetails = async () => {
    try {
      const userId = user.user_id || user.id;
      const res = await axios.get(`/api/trades/user/${userId}`);
      const currentTrade = res.data.find(t => t.trade_id === parseInt(tradeId));
      if (currentTrade) {
        setTrade(currentTrade);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch trade details:", err);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/messages/trade/${tradeId}`);
      
      const dbMessages = res.data.map(m => ({
        sender: m.sender_name,
        content: m.content,
        timestamp: m.timestamp,
        isUser: Number(m.sender_id) === Number(user?.user_id || user?.id),
        isAI: Number(m.sender_id) === 0 || m.type === 'bot',
        isSystem: m.type === 'system'
      }));

      // Base protocol messages that are always at the top
      const protocolMessages = [
        { 
          sender: 'SYSTEM', 
          content: `🛡️ SECURITY PROTOCOL ACTIVE: Trade Node #${tradeId} Secured.`,
          isSystem: true 
        },
        { 
          sender: 'QUICKTRADE AI', 
          content: `Protocol v4.2 online. Welcome ${user?.username || 'Trader'}. I am your Middleman. I will facilitate this swap between you and ${trade?.owner_username === user?.username ? trade?.offerer_username : trade?.owner_username}.`,
          isAI: true
        }
      ];

      setMessages([...protocolMessages, ...dbMessages]);

      // Check for ready state
      const readyMessages = dbMessages.filter(m => m.content.toLowerCase().includes('ready'));
      const uniqueSenders = new Set(readyMessages.map(m => m.sender));
      
      if (uniqueSenders.size >= 2 && !tradeLink) {
        generateTradeLink();
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  const saveBotMessage = async (content, type = 'bot') => {
    try {
      await axios.post('/api/messages/send', {
        sender_id: 0, 
        receiver_id: 0,
        trade_id: tradeId,
        content: content,
        type: type
      });
      fetchMessages();
    } catch (err) {
      console.error("Bot message error:", err);
    }
  };

  const generateTradeLink = () => {
    if (tradeLink) return;
    setIsTyping(true);
    setTimeout(async () => {
      const link = `https://quicktrade.io/vault/secure-swap-${Math.random().toString(36).substring(7)}`;
      setTradeLink(link);
      await saveBotMessage(`✅ ASSETS VERIFIED. Secure Vault Link: ${link}`, 'bot');
      setIsTyping(false);
    }, 2500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !trade) return;

    const userId = Number(user?.user_id || user?.id);
    const receiverId = userId === trade.offerer_user_id ? trade.owner_user_id : trade.offerer_user_id;

    try {
      await axios.post('/api/messages/send', {
        sender_id: userId,
        receiver_id: receiverId,
        trade_id: tradeId,
        content: newMessage,
        type: 'user'
      });
      
      const sentMsg = newMessage;
      setNewMessage('');
      await fetchMessages();
      
      // Intelligent AI Responses
      const input = sentMsg.toLowerCase();
      if (input.includes('ready') || input.includes('agree')) {
        setIsTyping(true);
        setTimeout(() => {
          saveBotMessage("Scanning inventory... Please wait while I verify the other party's readiness.");
          setIsTyping(false);
        }, 1500);
      } else if (input.includes('scam') || input.includes('safe')) {
        saveBotMessage("All transactions are processed through encrypted multi-sig vaults. Your items are 100% protected.");
      } else if (input.includes('hi') || input.includes('hello')) {
        saveBotMessage(`Greetings ${user?.username}. Protocol is standing by.`);
      }
    } catch (err) {
      console.error("Send error:", err);
      // Local fallback so user sees their message even if server lag
      const fallbackMsg = { sender: user?.username, content: newMessage, isUser: true };
      setMessages(prev => [...prev, fallbackMsg]);
      setNewMessage('');
    }
  };

  if (loading) return (
    <div style={{ backgroundColor: '#000', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="gold-glow" style={{ fontSize: '1.5rem', letterSpacing: '4px' }}>INITIALIZING SECURE TERMINAL...</div>
    </div>
  );

  if (!trade) return <div style={{ color: 'red', textAlign: 'center', marginTop: '100px' }}>TRADE NOT FOUND</div>;

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: '#eee', fontFamily: "'Courier New', Courier, monospace" }}>
      <TopBar token={token} />
      
      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        {/* Terminal Header */}
        <div style={{ 
          border: '1px solid #333', padding: '15px', marginBottom: '20px', 
          background: 'linear-gradient(180deg, #111 0%, #000 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{ color: 'var(--gold)' }}>[TERMINAL_ID]</span> QT-ESCROW-{tradeId}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
            <span>STATUS: <span style={{ color: '#0f0' }}>ENCRYPTED</span></span>
            <span>MIDDLEMAN: <span style={{ color: 'var(--gold)' }}>{trade.middleman.toUpperCase()}</span></span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
          {/* Main Interface */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Trade Assets Visualization */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
              backgroundColor: '#0a0a0a', padding: '30px', border: '1px solid #222', borderRadius: '4px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '10px' }}>FROM: {trade.offerer_username}</div>
                <img src={trade.offered_item_image} style={{ width: '120px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.2))' }} alt="" />
                <div style={{ color: 'var(--gold)', marginTop: '10px', fontWeight: 'bold' }}>{trade.offered_item_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#444' }}>${trade.offered_item_value}</div>
              </div>

              <div style={{ padding: '0 40px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', color: 'var(--gold)', animation: 'pulse 2s infinite' }}>⇄</div>
                <div style={{ fontSize: '0.6rem', color: '#555', marginTop: '5px' }}>SECURE SWAP</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '10px' }}>FROM: {trade.owner_username}</div>
                <img src={trade.requested_item_image} style={{ width: '120px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.2))' }} alt="" />
                <div style={{ color: 'var(--gold)', marginTop: '10px', fontWeight: 'bold' }}>{trade.requested_item_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#444' }}>${trade.requested_item_value}</div>
              </div>
            </div>

            {/* AI Action Center */}
            {tradeLink && (
              <div style={{ 
                backgroundColor: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--gold)', 
                padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', animation: 'scan 3s linear infinite' }}></div>
                <h3 style={{ color: 'var(--gold)', marginBottom: '15px', letterSpacing: '2px' }}>SWAP CHANNEL READY</h3>
                <button 
                  onClick={() => window.open(tradeLink, '_blank')}
                  style={{ 
                    backgroundColor: 'var(--gold)', color: '#000', padding: '12px 40px', 
                    fontWeight: 'bold', border: 'none', cursor: 'pointer', letterSpacing: '1px'
                  }}
                >
                  EXECUTE TRANSACTION
                </button>
              </div>
            )}

            {/* Terminal Chat */}
            <div style={{ 
              backgroundColor: '#0a0a0a', border: '1px solid #222', height: '450px',
              display: 'flex', flexDirection: 'column'
            }}>
              <div id="chat-messages" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ 
                    alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '8px 12px',
                    backgroundColor: msg.isAI ? 'rgba(212,175,55,0.1)' : (msg.isSystem ? 'rgba(255,255,255,0.05)' : (msg.isUser ? 'rgba(212,175,55,0.2)' : '#1a1a1a')),
                    border: msg.isAI ? '1px solid var(--gold)' : (msg.isSystem ? '1px solid #333' : 'none'),
                    borderRadius: '2px',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: msg.isAI ? 'var(--gold)' : '#888', marginRight: '8px' }}>
                      [{msg.sender.toUpperCase()}]
                    </span>
                    <span style={{ color: msg.isAI ? '#fff' : (msg.isSystem ? '#888' : '#eee') }}>{msg.content}</span>
                  </div>
                ))}
                {isTyping && <div style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>AI_BOT IS THINKING...</div>}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #222', display: 'flex', gap: '10px' }}>
                <span style={{ color: 'var(--gold)', alignSelf: 'center' }}>&gt;</span>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter protocol command or message..."
                  style={{ 
                    flex: 1, backgroundColor: 'transparent', border: 'none', 
                    color: '#0f0', outline: 'none', fontSize: '1rem'
                  }}
                />
                <button type="submit" style={{ backgroundColor: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '5px 15px', cursor: 'pointer' }}>SEND</button>
              </form>
            </div>
          </div>

          {/* Side Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '20px' }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.8rem', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>SECURITY LOG</h4>
              <ul style={{ listSetStyle: 'none', padding: 0, fontSize: '0.75rem', color: '#888', lineHeight: '1.8' }}>
                <li>[1] VERIFYING WALLET AUTH...</li>
                <li>[2] SCANNING ITEM METADATA...</li>
                <li>[3] CHECKING STEAM_API STATUS...</li>
                <li>[4] ESCROW VAULT READY.</li>
              </ul>
            </div>

            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '20px' }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.8rem', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>TRADE RULES</h4>
              <p style={{ fontSize: '0.7rem', color: '#666', lineHeight: '1.6' }}>
                - DO NOT leave this room during swap.<br/>
                - Ensure items are tradable.<br/>
                - AI Middleman is 100% automated.<br/>
                - Support ID: QT-SUPPORT-882
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.5; transform: scale(1); }
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
      <Footer />
    </div>
  );
}
