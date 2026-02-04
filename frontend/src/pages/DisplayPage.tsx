import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import BalloonGame from '../components/BalloonGame';
import type { Game } from '../types';
import '../styles/DisplayPage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function DisplayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}`);
      const data: Game = await res.json();
      setGame(data);
    } catch (error) {
      console.error('Failed to fetch game:', error);
    }
  }, [gameId]);

  const checkResultStatus = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}/result-status`);
      const data = await res.json();
      setShowResult(data.show_result);
    } catch (error) {
      // エンドポイントがない場合は無視
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
    checkResultStatus();
    // 2秒ごとにデータを更新（コントロール画面との同期）
    const interval = setInterval(() => {
      fetchGame();
      checkResultStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchGame, checkResultStatus]);

  if (!game) {
    return (
      <div className="display-page">
        <div className="loading-message">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="display-page">
      <div className="display-content">
        <BalloonGame teams={game.teams} />
      </div>

      {/* 結果オーバーレイ */}
      {showResult && (
        <motion.div 
          className="result-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="result-card">
            <h2>🎉 ゲーム終了！</h2>
            <div className="final-rankings">
              {[...game.teams]
                .sort((a, b) => b.points - a.points)
                .map((team, index) => (
                  <motion.div
                    key={team.id}
                    className={`ranking-row ${index === 0 ? 'winner' : ''}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.3 }}
                  >
                    <span className="rank">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}位`}
                    </span>
                    <span className="team-name" style={{ color: team.color }}>
                      {team.name}
                    </span>
                    <span className="team-points">{team.points}点</span>
                  </motion.div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default DisplayPage;