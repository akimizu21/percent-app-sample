import { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/SetupPanel.css';
import type { Game, Team, Question } from '../types';

const TEAM_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#FF9F43', '#EE5A24', '#6C5CE7', '#00CEC9',
  '#8B4513', '#2C3E50'  // 茶色、黒
];

interface SetupPanelProps {
  game: Game;
  onRefresh: () => void;
  onBack: () => void;
  onStart: () => void;
  onReset: () => void;
  apiUrl: string;
}

function SetupPanel({ game, onRefresh, onBack, onStart, onReset, apiUrl }: SetupPanelProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newQuestion, setNewQuestion] = useState({ text: '', answer: 50 });
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await fetch(`${apiUrl}/api/games/${game.id}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });
      setNewTeamName('');
      onRefresh();
    } catch (error) {
      console.error('Failed to add team:', error);
    }
  };

  const updateTeam = async (teamId: number, data: Partial<Team>) => {
    try {
      await fetch(`${apiUrl}/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setEditingTeam(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const deleteTeam = async (teamId: number) => {
    if (!window.confirm('このチームを削除しますか？')) return;
    try {
      await fetch(`${apiUrl}/api/teams/${teamId}`, { method: 'DELETE' });
      onRefresh();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const addQuestion = async () => {
    if (!newQuestion.text.trim()) return;
    try {
      await fetch(`${apiUrl}/api/games/${game.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: newQuestion.text,
          correct_answer: newQuestion.answer
        })
      });
      setNewQuestion({ text: '', answer: 50 });
      onRefresh();
    } catch (error) {
      console.error('Failed to add question:', error);
    }
  };

  const updateQuestion = async (questionId: number, data: Partial<Question>) => {
    try {
      await fetch(`${apiUrl}/api/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setEditingQuestion(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!window.confirm('この問題を削除しますか？')) return;
    try {
      await fetch(`${apiUrl}/api/questions/${questionId}`, { method: 'DELETE' });
      onRefresh();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  return (
    <motion.div
      className="setup-panel"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="setup-header">
        <button className="btn-back" onClick={onBack}>← ホームに戻る</button>
        <h2>{game.name} - 設定</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onReset}>リセット</button>
          <button 
            className="btn-primary" 
            onClick={onStart}
            disabled={game.teams?.length === 0 || game.questions?.length === 0}
          >
            ゲーム開始 →
          </button>
        </div>
      </div>

      <div className="setup-content">
        {/* Teams Section */}
        <div className="setup-section">
          <h3>🎈 チーム設定</h3>
          
          <div className="add-form">
            <input
              type="text"
              placeholder="チーム名を入力"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTeam()}
              maxLength={20}
            />
            <button className="btn-add" onClick={addTeam}>追加</button>
          </div>

          <div className="item-list">
            {game.teams?.map((team, index) => (
              <motion.div
                key={team.id}
                className="item-card team-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {editingTeam === team.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      defaultValue={team.name}
                      id={`team-name-${team.id}`}
                      maxLength={20}
                    />
                    <div className="color-picker">
                      {TEAM_COLORS.map(color => (
                        <button
                          key={color}
                          className={`color-btn ${team.color === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateTeam(team.id, { color })}
                        />
                      ))}
                    </div>
                    <div className="edit-actions">
                      <button 
                        className="btn-save"
                        onClick={() => {
                          const nameInput = document.getElementById(`team-name-${team.id}`) as HTMLInputElement;
                          updateTeam(team.id, { name: nameInput.value });
                        }}
                      >
                        保存
                      </button>
                      <button className="btn-cancel" onClick={() => setEditingTeam(null)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="team-info">
                      <div 
                        className="team-color-indicator" 
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="team-name">{team.name}</span>
                      <span className="team-points">{team.points}点</span>
                    </div>
                    <div className="item-actions">
                      <button className="btn-edit" onClick={() => setEditingTeam(team.id)}>
                        編集
                      </button>
                      <button className="btn-delete" onClick={() => deleteTeam(team.id)}>
                        削除
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
            {game.teams?.length === 0 && (
              <p className="empty-message">チームを追加してください</p>
            )}
          </div>
        </div>

        {/* Questions Section */}
        <div className="setup-section">
          <h3>❓ 問題設定（最大6問）</h3>
          
          {(game.questions?.length || 0) < 6 && (
            <div className="add-form question-form">
              <textarea
                placeholder="問題文を入力（例：朝食にパンを食べる人の割合は？）"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                rows={2}
              />
              <div className="answer-input">
                <label>正解：</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newQuestion.answer}
                  onChange={(e) => setNewQuestion({ 
                    ...newQuestion, 
                    answer: Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                  })}
                />
                <span>%</span>
              </div>
              <button className="btn-add" onClick={addQuestion}>追加</button>
            </div>
          )}

          <div className="item-list">
            {game.questions?.map((question, index) => (
              <motion.div
                key={question.id}
                className={`item-card question-card ${question.is_answered ? 'answered' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {editingQuestion === question.id ? (
                  <div className="edit-form">
                    <textarea
                      defaultValue={question.question_text}
                      id={`question-text-${question.id}`}
                      rows={2}
                    />
                    <div className="answer-input">
                      <label>正解：</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={question.correct_answer}
                        id={`question-answer-${question.id}`}
                      />
                      <span>%</span>
                    </div>
                    <div className="edit-actions">
                      <button 
                        className="btn-save"
                        onClick={() => {
                          const textInput = document.getElementById(`question-text-${question.id}`) as HTMLTextAreaElement;
                          const answerInput = document.getElementById(`question-answer-${question.id}`) as HTMLInputElement;
                          updateQuestion(question.id, { 
                            question_text: textInput.value, 
                            correct_answer: Math.max(0, Math.min(100, parseInt(answerInput.value) || 0))
                          });
                        }}
                      >
                        保存
                      </button>
                      <button className="btn-cancel" onClick={() => setEditingQuestion(null)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="question-info">
                      <span className="question-number">Q{question.order_num}</span>
                      <span className="question-text">{question.question_text}</span>
                      <span className="question-answer">正解: {question.correct_answer}%</span>
                      {question.is_answered && <span className="answered-badge">済</span>}
                    </div>
                    <div className="item-actions">
                      <button className="btn-edit" onClick={() => setEditingQuestion(question.id)}>
                        編集
                      </button>
                      <button className="btn-delete" onClick={() => deleteQuestion(question.id)}>
                        削除
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
            {game.questions?.length === 0 && (
              <p className="empty-message">問題を追加してください</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SetupPanel;