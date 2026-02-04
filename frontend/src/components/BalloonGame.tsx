import Balloon from './Balloon';
import '../styles/BalloonGame.css';
import type { Team } from '../types';

interface BalloonGameProps {
  teams: Team[];
}

function BalloonGame({ teams }: BalloonGameProps) {
  const scaleMarkers = Array.from({ length: 11 }, (_, i) => 100 - i * 10);

  return (
    <div className="balloon-game">
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
          {teams.map((team) => (
            <Balloon
              key={team.id}
              team={team}
              totalTeams={teams.length}
            />
          ))}
        </div>
      </div>

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