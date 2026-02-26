import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Balloon.css';
import type { Team } from '../types';

interface BalloonProps {
  team: Team;
  totalTeams: number;
}

// 初期持ち点
const INITIAL_POINTS = 400;

function Balloon({ team, totalTeams }: BalloonProps) {
  const points = team.points;
  const [hasExploded, setHasExploded] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const prevPointsRef = useRef(points);
  
  // 0点になった瞬間を検知
  useEffect(() => {
    if (prevPointsRef.current > 0 && points === 0 && !hasExploded) {
      setShowExplosion(true);
      setHasExploded(true);
      setTimeout(() => {
        setShowExplosion(false);
      }, 2000);
    }
    prevPointsRef.current = points;
  }, [points, hasExploded]);

  // リセット時に状態をリセット
  useEffect(() => {
    if (points === INITIAL_POINTS) {
      setHasExploded(false);
      setShowExplosion(false);
      prevPointsRef.current = INITIAL_POINTS;
    }
  }, [points]);
  
  // 気球のサイズ: 500点で100%、0点で0%
  const balloonScale = points > 0 ? 0.3 + (points / INITIAL_POINTS) * 0.7 : 0;
  
  // 位置: 0点=5%、500点=75%
  const verticalPosition = 5 + (points / INITIAL_POINTS) * 70;

  // 爆発パーティクルの生成
  const explosionParticles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    delay: i * 0.02,
  }));

  return (
    <motion.div
      className="balloon-wrapper"
      initial={false}
    >
      <motion.div
        className="balloon-unit"
        initial={false}
        animate={{
          bottom: `${verticalPosition}%`,
        }}
        transition={{
          type: "tween",
          duration: 2.5,
          ease: "easeInOut",
        }}
      >
        {/* 爆発エフェクト */}
        <AnimatePresence>
          {showExplosion && (
            <div className="explosion-container">
              {/* 中心の閃光 */}
              <motion.div
                className="explosion-flash"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ backgroundColor: team.color }}
              />
              
              {/* 爆発パーティクル */}
              {explosionParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="explosion-particle"
                  style={{ backgroundColor: team.color }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 1, 
                    opacity: 1 
                  }}
                  animate={{ 
                    x: Math.cos(particle.angle) * 120,
                    y: Math.sin(particle.angle) * 120,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 0.8, 
                    delay: particle.delay,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* 破片 */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`debris-${i}`}
                  className="explosion-debris"
                  style={{ 
                    backgroundColor: i % 2 === 0 ? team.color : '#8B5A3C'
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    rotate: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 200,
                    y: Math.random() * 150 + 50,
                    rotate: Math.random() * 720 - 360,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 1.2, 
                    delay: i * 0.03,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* BOOM テキスト */}
              <motion.div
                className="explosion-text"
                initial={{ scale: 0, opacity: 1, rotate: -10 }}
                animate={{ scale: 1.5, opacity: 0, rotate: 10 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                💥
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 気球本体 */}
        <AnimatePresence>
          {points > 0 && (
            <motion.div
              className="balloon-body"
              style={{
                backgroundColor: team.color,
              }}
              initial={{ scale: balloonScale, opacity: 1 }}
              animate={{
                scale: balloonScale,
                opacity: 1,
              }}
              exit={{
                scale: 0,
                opacity: 0,
              }}
              transition={{
                type: "tween",
                duration: 2.5,
                ease: "easeInOut",
              }}
            >
              <div className="balloon-highlight" />
              <div className="balloon-highlight-small" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 気球の結び目 */}
        {points > 0 && (
          <div className="balloon-knot" style={{ backgroundColor: team.color }} />
        )}

        {/* ロープ */}
        <div className="balloon-rope" style={{ opacity: points > 0 ? 1 : 0.3 }} />

        {/* バスケット */}
        <div className={`balloon-basket ${points === 0 ? 'crashed' : ''}`}>
          <div 
            className="basket-body" 
            style={{ 
              borderColor: team.color,
              opacity: points === 0 ? 0.6 : 1
            }}
          >
            <span className="basket-team-name">{team.name}</span>
          </div>
          {/* 0点時のバツ印 */}
          {points === 0 && (
            <div className="crashed-overlay">
              <span>✕</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Balloon;