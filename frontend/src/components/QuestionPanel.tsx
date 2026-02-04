import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/QuestionPanel.css';
import type { Game, SubmitResponse } from '../types';

interface QuestionPanelProps {
  game: Game;
  onRefresh: () => void;
  apiUrl: string;
}

function QuestionPanel({ game, onRefresh, apiUrl }: QuestionPanelProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [teamAnswers, setTeamAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = game.questions || [];
  const teams = game.teams || [];
  const currentQuestion = questions[currentQuestionIndex];

  const unansweredQuestions = questions.filter(q => !q.is_answered);
  const allAnswered = unansweredQuestions.length === 0;

  const handleAnswerChange = (teamId: number, value: string) => {
    setTeamAnswers({
      ...teamAnswers,
      [teamId]: Math.max(0, Math.min(100, parseInt(value) || 0))
    });
  };

  const submitAnswers = async () => {
    if (!currentQuestion) return;
    
    const answers = teams.map(team => ({
      team_id: team.id,
      answer: teamAnswers[team.id] ?? 50
    }));

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/questions/${currentQuestion.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const result: SubmitResponse = await res.json();
      setLastResult(result);
      setShowResult(true);
      setTeamAnswers({});
      
      setTimeout(() => {
        onRefresh();
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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    setShowResult(false);
    setLastResult(null);
    setCurrentQuestionIndex(index);
  };

  if (allAnswered) {
    return (
      <div className="question-panel">
        <div className="game-complete">
          <h2>🎉 ゲーム終了！</h2>
          <div className="final-standings">
            <h3>最終順位</h3>
            {[...teams]
              .sort((a, b) => b.points - a.points)
              .map((team, index) => (
                <motion.div
                  key={team.id}
                  className={`standing-row ${index === 0 ? 'winner' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <span className="rank">
                    {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}位`}
                  </span>
                  <span className="team-name" style={{ color: team.color }}>{team.name}</span>
                  <span className="team-points">{team.points}点</span>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-panel">
      <div className="question-nav">
        {questions.map((q, index) => (
          <button
            key={q.id}
            className={`nav-btn ${index === currentQuestionIndex ? 'active' : ''} ${q.is_answered ? 'answered' : ''}`}
            onClick={() => goToQuestion(index)}
          >
            Q{index + 1}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {showResult && lastResult ? (
          <motion.div
            key="result"
            className="result-display"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <h3>結果発表</h3>
            <div className="correct-answer">
              正解: <span className="answer-value">{lastResult.correct_answer}%</span>
            </div>
            <div className="result-list">
              {[...lastResult.results]
                .sort((a, b) => a.difference - b.difference)
                .map((result, index) => {
                  const team = teams.find(t => t.id === result.team_id);
                  return (
                    <motion.div
                      key={result.team_id}
                      className="result-row"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                    >
                      <span className="team-color" style={{ backgroundColor: team?.color }} />
                      <span className="team-name">{result.team_name}</span>
                      <span className="team-answer">{result.answer}%</span>
                      <span className={`difference ${result.difference === 0 ? 'perfect' : ''}`}>
                        {result.difference === 0 ? '🎯 ピッタリ!' : `-${result.difference}点`}
                      </span>
                      <span className="new-points">→ {result.new_points}点</span>
                    </motion.div>
                  );
                })}
            </div>
            <button className="btn-primary btn-next" onClick={nextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? '次の問題へ →' : '結果を見る'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="question"
            className="question-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {currentQuestion ? (
              <>
                <div className="question-header">
                  <span className="question-label">Q{currentQuestion.order_num}</span>
                  {currentQuestion.is_answered && (
                    <span className="answered-notice">この問題は回答済みです</span>
                  )}
                </div>
                <p className="question-text">{currentQuestion.question_text}</p>

                {!currentQuestion.is_answered && (
                  <>
                    <div className="answer-inputs">
                      <h4>各チームの解答を入力</h4>
                      {teams.map(team => (
                        <div key={team.id} className="team-answer-row">
                          <span 
                            className="team-indicator"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="team-name">{team.name}</span>
                          <div className="answer-field">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={teamAnswers[team.id] ?? ''}
                              onChange={(e) => handleAnswerChange(team.id, e.target.value)}
                              placeholder="50"
                            />
                            <span className="percent-sign">%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      className="btn-primary btn-submit"
                      onClick={submitAnswers}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '計算中...' : '解答を確定'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <p className="no-question">問題がありません</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuestionPanel;
