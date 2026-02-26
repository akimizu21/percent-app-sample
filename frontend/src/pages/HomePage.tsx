import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Game, GameSummary } from '../types';
import SetupPanel from '../components/SetupPanel';

const API_URL = import.meta.env.VITE_API_URL || '';

function HomePage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [view, setView] = useState<'home' | 'setup'>('home');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/games`);
      const data: GameSummary[] = await res.json();
      setGames(data);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  }, []);

  const fetchGame = useCallback(async (gameId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/games/${gameId}`);
      const data: Game = await res.json();
      setCurrentGame(data);
    } catch (error) {
      console.error('Failed to fetch game:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const createGame = async () => {
    try {
      const res = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `ゲーム ${games.length + 1}` })
      });
      const data = await res.json();
      await fetchGame(data.id);
      setView('setup');
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const loadGame = async (gameId: number) => {
    await fetchGame(gameId);
    setView('setup');
  };

  const deleteGame = async (gameId: number) => {
    if (!window.confirm('このゲームを削除しますか？')) return;
    try {
      await fetch(`${API_URL}/api/games/${gameId}`, { method: 'DELETE' });
      fetchGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  const resetGame = async () => {
    if (!currentGame) return;
    if (!window.confirm('ゲームをリセットしますか？全チームの持ち点が500に戻ります。')) return;
    try {
      await fetch(`${API_URL}/api/games/${currentGame.id}/reset`, { method: 'POST' });
      await fetchGame(currentGame.id);
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  };

  const startGame = () => {
    if (!currentGame) return;
    if (currentGame.teams?.length && currentGame.questions?.length) {
      // 新しいウィンドウでディスプレイ画面を開く
      window.open(`/display/${currentGame.id}`, 'display', 'width=1280,height=720');
      // コントロール画面に遷移
      navigate(`/control/${currentGame.id}`);
    } else {
      alert('チームと問題を最低1つずつ追加してください。');
    }
  };

  if (view === 'setup' && currentGame) {
    return (
      <SetupPanel
        game={currentGame}
        onRefresh={() => fetchGame(currentGame.id)}
        onBack={() => { setView('home'); fetchGames(); }}
        onStart={startGame}
        onReset={resetGame}
        apiUrl={API_URL}
      />
    );
  }

  return (
    <div className="app">
      <motion.div 
        className="home-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="hero-section">
          <motion.div 
            className="hero-balloons"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'].map((color, i) => (
              <motion.div
                key={i}
                className="hero-balloon"
                style={{ backgroundColor: color }}
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
          <h1 className="hero-title">
            パーセントクイズ
          </h1>
          <p className="hero-subtitle">ネプリーグ風 気球バトルゲーム</p>
        </div>

        <motion.button 
          className="btn-primary btn-large"
          onClick={createGame}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎈 新しいゲームを作成
        </motion.button>

        {games.length > 0 && (
          <div className="saved-games">
            <h2>保存されたゲーム</h2>
            <div className="game-list">
              {games.map(game => (
                <motion.div 
                  key={game.id} 
                  className="game-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="game-info">
                    <h3>{game.name}</h3>
                    <p>{game.team_count}チーム・{game.question_count}問</p>
                  </div>
                  <div className="game-actions">
                    <button className="btn-secondary" onClick={() => loadGame(game.id)}>
                      開く
                    </button>
                    <button className="btn-danger" onClick={() => deleteGame(game.id)}>
                      削除
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
}

export default HomePage;