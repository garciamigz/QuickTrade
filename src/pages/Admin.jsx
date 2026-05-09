import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';

export default function Admin() {
  const [token] = useState(localStorage.getItem("token"));
  const [stats, setStats] = useState({ users: 0, items: 0, trades: 0 });
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Form states
  const [gameForm, setGameForm] = useState({ name: '', category: '', image_url: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  useEffect(() => {
    fetchStats();
    fetchGames();
    fetchCategories();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await axios.get('/api/admin/games');
      setGames(res.data);
    } catch (err) {
      console.error("Failed to fetch games:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/admin/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/games', gameForm);
      alert("Game added!");
      setGameForm({ name: '', category: '', image_url: '' });
      fetchGames();
    } catch (err) {
      alert("Failed to add game");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/categories', categoryForm);
      alert("Category added!");
      setCategoryForm({ name: '' });
      fetchCategories();
    } catch (err) {
      alert("Failed to add category");
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--black)', minHeight: '100vh', color: 'white' }}>
      <TopBar token={token} />
      
      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h1 className="gold-glow" style={{ marginBottom: '30px' }}>Admin Dashboard</h1>
        
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' 
        }}>
          {[
            { label: 'Total Users', value: stats.users },
            { label: 'Total Items', value: stats.items },
            { label: 'Total Trades', value: stats.trades }
          ].map(stat => (
            <div key={stat.label} style={{ 
              backgroundColor: 'var(--black-light)', padding: '20px', borderRadius: '15px', 
              border: '1px solid var(--gold)', textAlign: 'center'
            }}>
              <h3 style={{ color: '#888', marginBottom: '10px' }}>{stat.label}</h3>
              <h2 className="gold-glow" style={{ fontSize: '2rem' }}>{stat.value}</h2>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Add Game Form */}
          <div style={{ 
            backgroundColor: 'var(--black-light)', padding: '30px', borderRadius: '15px', 
            border: '1px solid #333'
          }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '20px' }}>Add New Game</h2>
            <form onSubmit={handleAddGame}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Game Name</label>
                <input 
                  type="text" 
                  value={gameForm.name}
                  onChange={(e) => setGameForm({...gameForm, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: 'white', borderRadius: '5px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Category</label>
                <select 
                  value={gameForm.category}
                  onChange={(e) => setGameForm({...gameForm, category: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: 'white', borderRadius: '5px' }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.category_id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Image URL</label>
                <input 
                  type="text" 
                  value={gameForm.image_url}
                  onChange={(e) => setGameForm({...gameForm, image_url: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: 'white', borderRadius: '5px' }}
                />
              </div>
              <button type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: 'var(--gold)', 
                  color: 'var(--black)', 
                  fontWeight: 'bold', 
                  borderRadius: '5px', 
                  cursor: 'pointer', 
                  border: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >Add Game</button>
            </form>
          </div>

          {/* Add Category Form */}
          <div style={{ 
            backgroundColor: 'var(--black-light)', padding: '30px', borderRadius: '15px', 
            border: '1px solid #333'
          }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '20px' }}>Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Category Name</label>
                <input 
                  type="text" 
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: 'white', borderRadius: '5px' }}
                  required
                />
              </div>
              <button type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  backgroundColor: 'var(--gold)', 
                  color: 'var(--black)', 
                  fontWeight: 'bold', 
                  borderRadius: '5px', 
                  cursor: 'pointer', 
                  border: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >Add Category</button>
            </form>

            <div style={{ marginTop: '40px' }}>
                <h3 style={{ color: 'var(--gold)', marginBottom: '15px' }}>Existing Categories</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {categories.map(cat => (
                        <span key={cat.category_id} style={{ 
                            backgroundColor: '#222', padding: '5px 12px', borderRadius: '20px', 
                            border: '1px solid #444', fontSize: '0.9rem'
                        }}>
                            {cat.name}
                        </span>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div style={{ marginTop: '40px', backgroundColor: 'var(--black-light)', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: '20px' }}>Managed Games</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {games.map(game => (
                    <div key={game.game_id} style={{ 
                        backgroundColor: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #222'
                    }}>
                        <div style={{ height: '100px', backgroundColor: '#222', borderRadius: '5px', marginBottom: '10px', overflow: 'hidden' }}>
                            {game.image_url && <img src={game.image_url} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <h4 style={{ margin: '0 0 5px 0' }}>{game.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{game.category}</span>
                    </div>
                ))}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
