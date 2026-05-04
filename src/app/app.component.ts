import { Component, OnInit, ViewChild } from '@angular/core';
import { PlayerSelectionComponent } from './components/player-selection/player-selection.component';
import { Team } from './components/teams-display/teams-display.component';
import { StorageService } from './services/storage.service';

interface Scout {
  player: string;
  pontos: number;
  gols: number;
  assistencias: number;
  vitorias?: number;
  actions: { action: string; time: number }[];
}

interface GameState {
  teams: Team[];
  remainingPlayers: string[];
  scouts: Scout[];
  lastActionsByPlayer: { [player: string]: string[] };
  activeTab: 'selection' | 'teams' | 'scouts';
  playerCount: number;
  allGoalkeepers: string[];
}

const GAME_STATE_KEY = 'gameState';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(PlayerSelectionComponent) playerSelectionComponent!: PlayerSelectionComponent;

  title = 'select-teams-fut';
  activeTab: 'selection' | 'teams' | 'scouts' = 'selection';
  teams: Team[] = [];
  remainingTeams: Team[] = [];
  remainingPlayers: string[] = [];
  newPlayerInput: string = '';
  playerCount: number = 5;
  allGoalkeepers: string[] = [];
  scouts: Scout[] = [];
  lastActionsByPlayer: { [player: string]: string[] } = {};

  constructor(private storage: StorageService) {}

  async ngOnInit(): Promise<void> {
    const saved = await this.storage.load<GameState>(GAME_STATE_KEY);
    if (saved) {
      this.teams = saved.teams ?? [];
      this.remainingPlayers = saved.remainingPlayers ?? [];
      this.scouts = saved.scouts ?? [];
      this.lastActionsByPlayer = saved.lastActionsByPlayer ?? {};
      this.activeTab = saved.activeTab ?? 'selection';
      this.playerCount = saved.playerCount ?? 0;
      this.allGoalkeepers = saved.allGoalkeepers ?? [];
    }
  }

  private saveGameState(): void {
    const state: GameState = {
      teams: this.teams,
      remainingPlayers: this.remainingPlayers,
      scouts: this.scouts,
      lastActionsByPlayer: this.lastActionsByPlayer,
      activeTab: this.activeTab,
      playerCount: this.playerCount,
      allGoalkeepers: this.allGoalkeepers,
    };
    this.storage.save(GAME_STATE_KEY, state);
  }

  setActiveTab(tab: 'selection' | 'teams' | 'scouts'): void {
    this.activeTab = tab;
    this.saveGameState();
  }

  onMatchWinner(ev: { winnerTeam: Team, teams: Team[], remainingPlayers: string[] }): void {
    this.teams = ev.teams;
    this.remainingPlayers = ev.remainingPlayers;
    this.lastActionsByPlayer = {};
    this.scouts.forEach(s => s.actions = []);

    for (const player of ev.winnerTeam.players) {
      let scout = this.scouts.find(s => s.player === player);
      if (!scout) {
        scout = { player, pontos: 0, gols: 0, assistencias: 0, actions: [] };
        this.scouts.push(scout);
      }
      scout.pontos += 1;
      scout.vitorias = (scout.vitorias || 0) + 1;
    }

    this.saveGameState();
  }

  onMatchDraw(ev: { teams: Team[], remainingPlayers: string[] }): void {
    this.teams = ev.teams;
    this.remainingPlayers = ev.remainingPlayers;
    this.lastActionsByPlayer = {};
    this.scouts.forEach(s => s.actions = []);
    this.saveGameState();
  }

  onTeamsUpdated(ev: { teams: Team[], remainingPlayers: string[] }): void {
    this.teams = ev.teams;
    this.remainingPlayers = ev.remainingPlayers;
    this.saveGameState();
  }

  onRemovePlayerAction(ev: { player: string; action: string }): void {
    const { player, action } = ev;

    if (this.lastActionsByPlayer[player]) {
      const index = this.lastActionsByPlayer[player].indexOf(action);
      if (index > -1) {
        this.lastActionsByPlayer[player].splice(index, 1);
      }
    }

    const team = this.teams.find(t => t.players.includes(player));
    const scout = this.scouts.find(s => s.player === player);
    if (scout) {
      const actionIndex = scout.actions.findIndex(a => a.action === action);
      if (actionIndex > -1) {
        scout.actions.splice(actionIndex, 1);
        switch (action) {
          case 'gol':
            scout.gols = Math.max(0, (scout.gols || 0) - 1);
            scout.pontos -= 3;
            if (team) team.goals = Math.max(0, (team.goals || 0) - 1);
            break;
          case 'ruim':
            scout.pontos += 1;
            break;
          case 'contra':
            scout.pontos += 2;
            if (team) {
              const opposingTeam = this.teams.find(t => t !== team);
              if (opposingTeam) opposingTeam.goals = Math.max(0, (opposingTeam.goals || 0) - 1);
            }
            break;
          case 'passe':
            scout.assistencias = Math.max(0, (scout.assistencias || 0) - 1);
            scout.pontos -= 2;
            break;
        }
      }
    }

    this.saveGameState();
  }

  onGenerateTeams(): void {
    const playerCount = this.playerSelectionComponent.playerCount;
    const players = this.playerSelectionComponent.players;
    const goalkeepers = this.playerSelectionComponent.goalkeepers;
    const headToHeadPlayers = this.playerSelectionComponent.headToHeadPlayers;

    this.playerCount = playerCount;
    this.allGoalkeepers = [...goalkeepers];

    if (playerCount <= 0) {
      alert('Por favor, defina a quantidade de jogadores por time');
      return;
    }

    if (goalkeepers.length < 2) {
      alert('Você precisa de pelo menos 2 goleiros para montar 2 times');
      return;
    }

    const headToHeadArray = Array.from(headToHeadPlayers).filter(p => players.includes(p));
    const regularPlayers = players.filter(p => !headToHeadPlayers.has(p));
    const availableGoalkeepers = [...goalkeepers];

    const numTeams = 2;
    const shuffledRegularPlayers = this.shuffleArray(regularPlayers);
    const shuffledGoalkeepers = this.shuffleArray(availableGoalkeepers);

    this.teams = [];
    for (let i = 0; i < numTeams; i++) {
      this.teams.push({ name: `Time ${i + 1}`, players: [], goalkeeper: shuffledGoalkeepers[i] });
    }

    let teamIndex = 0;
    for (const headToHead of this.shuffleArray(headToHeadArray)) {
      if (teamIndex >= this.teams.length) teamIndex = 0;
      this.teams[teamIndex].players.push(headToHead);
      teamIndex++;
    }

    let currentTeamIndex = 0;
    for (const player of shuffledRegularPlayers) {
      if (this.teams[currentTeamIndex].players.length < playerCount) {
        this.teams[currentTeamIndex].players.push(player);
      }
      if (this.teams[currentTeamIndex].players.length === playerCount) {
        currentTeamIndex++;
        if (currentTeamIndex >= this.teams.length) currentTeamIndex = 0;
      }
    }

    this.calculateRemainingPlayers();
    this.activeTab = 'teams';
    this.saveGameState();
  }

  private calculateRemainingPlayers(): void {
    const usedPlayers = new Set<string>();
    for (const team of this.teams) {
      for (const player of team.players) usedPlayers.add(player);
    }
    const allPlayers = [...this.playerSelectionComponent.players];
    this.remainingPlayers = allPlayers.filter(p => !usedPlayers.has(p));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getHeadToHeadPlayers(): Set<string> {
    return this.playerSelectionComponent?.headToHeadPlayers || new Set();
  }

  onPlayerAction(ev: { player: string; action: string }): void {
    const { player, action } = ev;
    let scout = this.scouts.find(s => s.player === player);
    const now = Date.now();
    if (!scout) {
      scout = { player, pontos: 0, gols: 0, assistencias: 0, actions: [] };
      this.scouts.push(scout);
    }

    scout.actions.push({ action, time: now });

    if (!this.lastActionsByPlayer[player]) this.lastActionsByPlayer[player] = [];
    this.lastActionsByPlayer[player].push(action);

    switch (action) {
      case 'gol':
        scout.gols = (scout.gols || 0) + 1;
        scout.pontos += 3;
        break;
      case 'ruim':
        scout.pontos -= 1;
        break;
      case 'contra':
        scout.pontos -= 2;
        break;
      case 'passe':
        scout.assistencias = (scout.assistencias || 0) + 1;
        scout.pontos += 2;
        break;
    }

    this.saveGameState();
  }

  getEmptySet(): Set<string> {
    return new Set();
  }

  addNewPlayer(): void {
    const playerName = this.newPlayerInput.trim();
    if (!playerName) return;
    this.remainingPlayers.push(playerName);
    this.newPlayerInput = '';
    this.saveGameState();
  }

  removeNewPlayer(index: number): void {
    if (this.remainingPlayers.hasOwnProperty(index)) {
      this.remainingPlayers.splice(index, 1);
      this.saveGameState();
    }
  }

  moveRemainingUp(index: number): void {
    if (index <= 0 || index >= this.remainingPlayers.length) return;
    const arr = this.remainingPlayers;
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    this.saveGameState();
  }

  moveRemainingDown(index: number): void {
    if (index < 0 || index >= this.remainingPlayers.length - 1) return;
    const arr = this.remainingPlayers;
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    this.saveGameState();
  }

  applyNewPlayers(): void {
    const playerCount = this.playerSelectionComponent.playerCount;
    const allPlayers = [...this.playerSelectionComponent.players];
    const allGoalkeepers = this.playerSelectionComponent.goalkeepers;

    if (allGoalkeepers.length < 2) {
      alert('Você precisa de pelo menos 2 goleiros para montar 2 times');
      return;
    }

    const numTeams = 2;
    const shuffledAllPlayers = this.shuffleArray(allPlayers);
    const shuffledGoalkeepers = this.shuffleArray(allGoalkeepers);

    this.teams = [];
    for (let i = 0; i < numTeams; i++) {
      this.teams.push({ name: `Time ${i + 1}`, players: [], goalkeeper: shuffledGoalkeepers[i] });
    }

    let currentTeamIndex = 0;
    for (const player of shuffledAllPlayers) {
      if (this.teams[currentTeamIndex].players.length < playerCount) {
        this.teams[currentTeamIndex].players.push(player);
      }
      if (this.teams[currentTeamIndex].players.length === playerCount) {
        currentTeamIndex++;
        if (currentTeamIndex >= this.teams.length) currentTeamIndex = 0;
      }
    }

    this.calculateRemainingPlayers();
    this.newPlayerInput = '';
    this.saveGameState();
  }
}
