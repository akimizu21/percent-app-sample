from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from datetime import datetime

# .envファイルから環境変数を読み込み
load_dotenv()

app = Flask(__name__)
CORS(app)

# Secret Key設定（セッション管理やCSRF保護に必要）
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/percent_quiz')
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    teams = db.relationship('Team', backref='game', lazy=True, cascade='all, delete-orphan')
    questions = db.relationship('Question', backref='game', lazy=True, cascade='all, delete-orphan')

class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    points = db.Column(db.Integer, default=100)
    color = db.Column(db.String(20), default='#FF6B6B')
    answers = db.relationship('TeamAnswer', backref='team', lazy=True, cascade='all, delete-orphan')

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    question_text = db.Column(db.String(500), nullable=False)
    correct_answer = db.Column(db.Integer, nullable=False)  # Percentage 0-100
    order_num = db.Column(db.Integer, nullable=False)
    is_answered = db.Column(db.Boolean, default=False)
    answers = db.relationship('TeamAnswer', backref='question', lazy=True, cascade='all, delete-orphan')

class TeamAnswer(db.Model):
    __tablename__ = 'team_answers'
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    answer = db.Column(db.Integer, nullable=False)  # Percentage 0-100
    difference = db.Column(db.Integer, nullable=True)  # Calculated difference

# ゲームごとの結果表示状態を保持（メモリ内）
game_result_status = {}

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

# Game routes
@app.route('/api/games', methods=['GET'])
def get_games():
    games = Game.query.order_by(Game.created_at.desc()).all()
    return jsonify([{
        'id': g.id,
        'name': g.name,
        'created_at': g.created_at.isoformat(),
        'team_count': len(g.teams),
        'question_count': len(g.questions)
    } for g in games])

@app.route('/api/games', methods=['POST'])
def create_game():
    data = request.json
    game = Game(name=data.get('name', 'New Game'))
    db.session.add(game)
    db.session.commit()
    return jsonify({'id': game.id, 'name': game.name}), 201

@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    game = Game.query.get_or_404(game_id)
    return jsonify({
        'id': game.id,
        'name': game.name,
        'teams': [{
            'id': t.id,
            'name': t.name,
            'points': t.points,
            'color': t.color
        } for t in sorted(game.teams, key=lambda x: x.id)],
        'questions': [{
            'id': q.id,
            'question_text': q.question_text,
            'correct_answer': q.correct_answer,
            'order_num': q.order_num,
            'is_answered': q.is_answered
        } for q in sorted(game.questions, key=lambda x: x.order_num)]
    })

@app.route('/api/games/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    game = Game.query.get_or_404(game_id)
    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': 'Game deleted'}), 200

@app.route('/api/games/<int:game_id>/reset', methods=['POST'])
def reset_game(game_id):
    game = Game.query.get_or_404(game_id)
    for team in game.teams:
        team.points = 100
        TeamAnswer.query.filter_by(team_id=team.id).delete()
    for question in game.questions:
        question.is_answered = False
    # 結果表示状態もリセット
    game_result_status[game_id] = False
    db.session.commit()
    return jsonify({'message': 'Game reset'}), 200

# 結果表示状態を取得
@app.route('/api/games/<int:game_id>/result-status', methods=['GET'])
def get_result_status(game_id):
    Game.query.get_or_404(game_id)
    show_result = game_result_status.get(game_id, False)
    return jsonify({'show_result': show_result})

# 結果表示状態を設定
@app.route('/api/games/<int:game_id>/show-result', methods=['POST'])
def set_result_status(game_id):
    Game.query.get_or_404(game_id)
    data = request.json
    show = data.get('show', False)
    game_result_status[game_id] = show
    return jsonify({'show_result': show})

# Team routes
@app.route('/api/games/<int:game_id>/teams', methods=['POST'])
def create_team(game_id):
    game = Game.query.get_or_404(game_id)
    data = request.json
    
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
    color_index = len(game.teams) % len(colors)
    
    team = Team(
        game_id=game_id,
        name=data.get('name', f'Team {len(game.teams) + 1}'),
        color=data.get('color', colors[color_index])
    )
    db.session.add(team)
    db.session.commit()
    return jsonify({
        'id': team.id,
        'name': team.name,
        'points': team.points,
        'color': team.color
    }), 201

@app.route('/api/teams/<int:team_id>', methods=['PUT'])
def update_team(team_id):
    team = Team.query.get_or_404(team_id)
    data = request.json
    if 'name' in data:
        team.name = data['name']
    if 'color' in data:
        team.color = data['color']
    if 'points' in data:
        team.points = max(0, min(100, data['points']))
    db.session.commit()
    return jsonify({
        'id': team.id,
        'name': team.name,
        'points': team.points,
        'color': team.color
    })

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    team = Team.query.get_or_404(team_id)
    db.session.delete(team)
    db.session.commit()
    return jsonify({'message': 'Team deleted'}), 200

# Question routes
@app.route('/api/games/<int:game_id>/questions', methods=['POST'])
def create_question(game_id):
    game = Game.query.get_or_404(game_id)
    data = request.json
    
    max_order = db.session.query(db.func.max(Question.order_num)).filter_by(game_id=game_id).scalar() or 0
    
    question = Question(
        game_id=game_id,
        question_text=data.get('question_text', ''),
        correct_answer=data.get('correct_answer', 50),
        order_num=max_order + 1
    )
    db.session.add(question)
    db.session.commit()
    return jsonify({
        'id': question.id,
        'question_text': question.question_text,
        'correct_answer': question.correct_answer,
        'order_num': question.order_num,
        'is_answered': question.is_answered
    }), 201

@app.route('/api/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    question = Question.query.get_or_404(question_id)
    data = request.json
    if 'question_text' in data:
        question.question_text = data['question_text']
    if 'correct_answer' in data:
        question.correct_answer = max(0, min(100, data['correct_answer']))
    db.session.commit()
    return jsonify({
        'id': question.id,
        'question_text': question.question_text,
        'correct_answer': question.correct_answer,
        'order_num': question.order_num,
        'is_answered': question.is_answered
    })

@app.route('/api/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    question = Question.query.get_or_404(question_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({'message': 'Question deleted'}), 200

# Answer submission and scoring
@app.route('/api/questions/<int:question_id>/submit', methods=['POST'])
def submit_answers(question_id):
    question = Question.query.get_or_404(question_id)
    data = request.json
    team_answers = data.get('answers', [])  # [{team_id: x, answer: y}, ...]
    
    results = []
    for ta in team_answers:
        team = Team.query.get(ta['team_id'])
        if not team:
            continue
        
        answer_value = max(0, min(100, ta['answer']))
        difference = abs(answer_value - question.correct_answer)
        
        # Save answer
        existing_answer = TeamAnswer.query.filter_by(
            team_id=team.id,
            question_id=question_id
        ).first()
        
        if existing_answer:
            existing_answer.answer = answer_value
            existing_answer.difference = difference
        else:
            team_answer = TeamAnswer(
                team_id=team.id,
                question_id=question_id,
                answer=answer_value,
                difference=difference
            )
            db.session.add(team_answer)
        
        # Update team points
        team.points = max(0, team.points - difference)
        
        results.append({
            'team_id': team.id,
            'team_name': team.name,
            'answer': answer_value,
            'correct_answer': question.correct_answer,
            'difference': difference,
            'new_points': team.points
        })
    
    question.is_answered = True
    db.session.commit()
    
    return jsonify({
        'question_id': question_id,
        'correct_answer': question.correct_answer,
        'results': results
    })

@app.route('/api/games/<int:game_id>/standings', methods=['GET'])
def get_standings(game_id):
    game = Game.query.get_or_404(game_id)
    teams = sorted(game.teams, key=lambda t: t.points, reverse=True)
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'points': t.points,
        'color': t.color,
        'rank': i + 1
    } for i, t in enumerate(teams)])

# Initialize database
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)