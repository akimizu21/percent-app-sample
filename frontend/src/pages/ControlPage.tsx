import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Game, SubmitResponse } from '../types';
import '../styles/ControlPage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function ControlPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [teamAnswers, setTeamAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultShownOnDisplay, setResultShownOnDisplay] = useState(false);

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
      setResultShownOnDisplay(data.show_result);
    } catch (error) {
      // エンドポイントがない場合は無視
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
    checkResultStatus();
  }, [fetchGame, checkResultStatus]);

  const resetGame = async () => {
    if (!game) return;
    if (!window.confirm('ゲームをリセットしますか？')) return;
    try {
      await fetch(`${API_URL}/api/games/${game.id}/reset`, { method: 'POST' });
      setCurrentQuestionIndex(0);
      setTeamAnswers({});
      setShowResult(false);
      setLastResult(null);
      setResultShownOnDisplay(false);
      await fetchGame();
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  };

  const openDisplayWindow = () => {
    window.open(`/display/${gameId}`, 'display', 'width=1280,height=720');
  };

  const handleAnswerChange = (teamId: number, value: string) => {
    setTeamAnswers({
      ...teamAnswers,
      [teamId]: Math.max(0, Math.min(100, parseInt(value) || 0))
    });
  };

  const submitAnswers = async () => {
    if (!game) return;
    const currentQuestion = game.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // 全チームの解答が入力されているかチェック
    const missingTeams = game.teams.filter(team => teamAnswers[team.id] === undefined);
    if (missingTeams.length > 0) {
      alert(`すべてのチームの解答を入力してください。\n未入力: ${missingTeams.map(t => t.name).join(', ')}`);
      return;
    }
    
    const answers = game.teams.map(team => ({
      team_id: team.id,
      answer: teamAnswers[team.id]
    }));

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/questions/${currentQuestion.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const result: SubmitResponse = await res.json();
      setLastResult(result);
      setShowResult(true);
      setTeamAnswers({});
      
      setTimeout(() => {
        fetchGame();
      }, 500);
    } catch (error) {
      console.error('Failed to submit answers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setLastResult(null);
    if (game && currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    setShowResult(false);
    setLastResult(null);
    setCurrentQuestionIndex(index);
  };

  // 結果を表示画面に表示する
  const showResultOnDisplay = async () => {
    if (!gameId) return;
    try {
      await fetch(`${API_URL}/api/games/${gameId}/show-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show: true })
      });
      setResultShownOnDisplay(true);
    } catch (error) {
      console.error('Failed to show result:', error);
    }
  };

  // 結果を非表示にする
  const hideResultOnDisplay = async () => {
    if (!gameId) return;
    try {
      await fetch(`${API_URL}/api/games/${gameId}/show-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show: false })
      });
      setResultShownOnDisplay(false);
    } catch (error) {
      console.error('Failed to hide result:', error);
    }
  };

  if (!game) {
    return (
      <div className="control-page">
        <div className="loading-message">読み込み中...</div>
      </div>
    );
  }

  const questions = game.questions || [];
  const teams = game.teams || [];
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = questions.length > 0 && questions.every(q => q.is_answered);

  return (
    <div className="control-page">
      <div className="control-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← ホームに戻る
        </button>
        <h1>{game.name} - コントロール</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={openDisplayWindow}>
            📺 表示画面を開く
          </button>
          <button className="btn-secondary" onClick={resetGame}>
            リセット
          </button>
        </div>
      </div>

      <div className="control-content">
        {/* 現在のチーム状況 */}
        <div className="teams-status">
          <h3>チーム状況</h3>
          <div className="teams-grid">
            {teams.map(team => (
              <div key={team.id} className="team-status-card">
                <div className="team-color-bar" style={{ backgroundColor: team.color }} />
                <span className="team-name">{team.name}</span>
                <span className="team-points" style={{ color: team.color }}>{team.points}点</span>
              </div>
            ))}
          </div>
        </div>

        {/* 問題ナビゲーション */}
        <div className="question-nav">
          <h3>問題選択</h3>
          <div className="nav-buttons">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`nav-btn ${index === currentQuestionIndex ? 'active' : ''} ${q.is_answered ? 'answered' : ''}`}
                onClick={() => goToQuestion(index)}
              >
                Q{index + 1}
                {q.is_answered && <span className="check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="main-content">
          <AnimatePresence mode="wait">
            {allAnswered ? (
              <motion.div
                key="complete"
                className="game-complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h2>🎉 全問終了！</h2>
                
                {/* 結果表示コントロール */}
                <div className="result-control">
                  {!resultShownOnDisplay ? (
                    <button className="btn-primary btn-large btn-show-result" onClick={showResultOnDisplay}>
                      🏆 結果を表示する
                    </button>
                  ) : (
                    <button className="btn-secondary btn-large" onClick={hideResultOnDisplay}>
                      結果を非表示にする
                    </button>
                  )}
                  <p className="result-status">
                    {resultShownOnDisplay ? '✅ 結果が表示されています' : '結果はまだ表示されていません'}
                  </p>
                </div>

                <div className="final-standings">
                  <h3>最終順位</h3>
                  {[...teams]
                    .sort((a, b) => b.points - a.points)
                    .map((team, index) => (
                      <div key={team.id} className={`standing-row ${index === 0 ? 'winner' : ''}`}>
                        <span className="rank">
                          {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}位`}
                        </span>
                        <span className="team-name" style={{ color: team.color }}>{team.name}</span>
                        <span className="team-points">{team.points}点</span>
                      </div>
                    ))}
                </div>
              </motion.div>
            ) : showResult && lastResult ? (
              <motion.div
                key="result"
                className="result-display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3>結果</h3>
                <div className="correct-answer-box">
                  正解: <span className="answer-value">{lastResult.correct_answer}%</span>
                </div>
                <div className="result-list">
                  {[...lastResult.results]
                    .sort((a, b) => a.difference - b.difference)
                    .map((result) => {
                      const team = teams.find(t => t.id === result.team_id);
                      return (
                        <div key={result.team_id} className="result-row">
                          <span className="team-color" style={{ backgroundColor: team?.color }} />
                          <span className="team-name">{result.team_name}</span>
                          <span className="team-answer">{result.answer}%</span>
                          <span className={`difference ${result.difference === 0 ? 'perfect' : ''}`}>
                            {result.difference === 0 ? '🎯' : `-${result.difference}`}
                          </span>
                          <span className="new-points">→ {result.new_points}点</span>
                        </div>
                      );
                    })}
                </div>
                <button className="btn-primary btn-large" onClick={nextQuestion}>
                  {currentQuestionIndex < questions.length - 1 ? '次の問題へ →' : '完了'}
                </button>
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                key="question"
                className="question-input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="question-header">
                  <span className="question-number">Q{currentQuestion.order_num}</span>
                  {currentQuestion.is_answered && (
                    <span className="answered-badge">回答済み</span>
                  )}
                </div>
                <p className="question-text">{currentQuestion.question_text}</p>
                <p className="correct-hint">（正解: {currentQuestion.correct_answer}%）</p>

                {!currentQuestion.is_answered && (
                  <>
                    <div className="answer-inputs">
                      <h4>各チームの解答を入力</h4>
                      {teams.map(team => (
                        <div key={team.id} className="team-answer-row">
                          <span className="team-indicator" style={{ backgroundColor: team.color }} />
                          <span className="team-name">{team.name}</span>
                          <div className="answer-field">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={teamAnswers[team.id] ?? ''}
                              onChange={(e) => handleAnswerChange(team.id, e.target.value)}
                            />
                            <span className="percent-sign">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      className="btn-primary btn-large btn-submit"
                      onClick={submitAnswers}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '計算中...' : '🚀 解答を確定して反映'}
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="no-question">問題がありません</div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ControlPage;