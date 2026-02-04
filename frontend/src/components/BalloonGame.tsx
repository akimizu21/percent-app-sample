import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Balloon from './Balloon';
import '../styles/BalloonGame.css';
import type { Team } from '../types';

interface BalloonGameProps {
  teams: Team[];
}

function BalloonGame({ teams }: BalloonGameProps) {
  const scaleMarkers = Array.from({ length: 11 }, (_, i) => 100 - i * 10);
  const [showDramatic, setShowDramatic] = useState(false);
  const [animatedTeams, setAnimatedTeams] = useState<Team[]>(teams);
  const prevTeamsRef = useRef<string>('');
  const isFirstRender = useRef(true);
  const isAnimating = useRef(false);

  // 炎の数を計算（チーム数に応じて調整）
  const flameCount = Math.max(teams.length * 3, 12);

  // チームのポイントをJSON文字列で比較（深い比較）
  const getTeamsKey = (t: Team[]) => t.map(team => `${team.id}:${team.points}`).join(',');

  useEffect(() => {
    const currentKey = getTeamsKey(teams);
    const prevKey = prevTeamsRef.current;

    // 初回レンダリング時
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTeamsRef.current = currentKey;
      setAnimatedTeams(teams);
      return;
    }

    // 既にアニメーション中なら無視
    if (isAnimating.current) {
      return;
    }

    // ポイントが変化したかチェック
    if (currentKey !== prevKey) {
      isAnimating.current = true;
      
      // デデデンを表示
      setShowDramatic(true);
      
      // 2秒後にデデデンを消す
      setTimeout(() => {
        setShowDramatic(false);
        
        // さらに1秒後にアニメーション開始
        setTimeout(() => {
          setAnimatedTeams(teams);
          prevTeamsRef.current = currentKey;
          isAnimating.current = false;
        }, 1000);
      }, 2000);
    }
  }, [teams]);

  return (
    <div className="balloon-game">
      {/* デデデン！オーバーレイ */}
      <AnimatePresence>
        {showDramatic && (
          <motion.div 
            className="dramatic-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="dramatic-text"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ 
                scale: [0, 1.3, 1],
                rotate: [-10, 5, 0]
              }}
              transition={{ 
                duration: 0.5,
                times: [0, 0.6, 1],
                ease: "easeOut"
              }}
            >
              デデデン！
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="scale-container">
        {scaleMarkers.map((value) => (
          <div key={value} className="scale-marker">
            <span className="scale-value">{value}</span>
            <div className="scale-line" />
          </div>
        ))}
      </div>

      <div className="balloons-container">
        <div className="grid-lines">
          {scaleMarkers.map((value) => (
            <div 
              key={value} 
              className="grid-line" 
              style={{ bottom: `${value}%` }}
            />
          ))}
        </div>

        <div className="balloons-row">
          {animatedTeams.map((team) => (
            <Balloon
              key={team.id}
              team={team}
              totalTeams={animatedTeams.length}
            />
          ))}
        </div>
      </div>

      {/* 炎のエフェクト */}
      <div className="fire-container">
        {Array.from({ length: flameCount }, (_, i) => (
          <div key={i} className="flame" />
        ))}
      </div>
      <div className="fire-glow" />

      <div className="team-labels">
        {teams.map((team) => (
          <div 
            key={team.id} 
            className="team-label"
            style={{ borderBottom: `4px solid ${team.color}` }}
          >
            <span className="team-name-label">{team.name}</span>
            <span className="team-points-label" style={{ color: team.color }}>
              {team.points}点
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BalloonGame;