import { Component, ViewChild } from '@angular/core';
import { PlayerSelectionComponent } from './components/player-selection/player-selection.component';

interface Team {
  name: string;
  players: string[];
  goalkeeper: string;
  goals?: number;
  isWinner?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild(PlayerSelectionComponent) playerSelectionComponent!: PlayerSelectionComponent;

  title = 'select-teams-fut';
  activeTab: 'selection' | 'teams' | 'scouts' = 'selection';
  teams: Team[] = [];
  remainingTeams: Team[] = [];
  remainingPlayers: string[] = [];
  newPlayerInput: string = '';
  playerCount: number = 0;
  allGoalkeepers: string[] = [];
  scouts: { player: string; pontos: number; gols: number; assistencias: number; actions: { action: string; time: number }[] }[] = [];
  lastActionsByPlayer: { [player: string]: string[] } = {};

  setActiveTab(tab: 'selection' | 'teams' | 'scouts'): void {
    this.activeTab = tab;
  }

  onMatchWinner(team: Team){
    // clear local action badges when a winner is declared
    this.lastActionsByPlayer = {};
  }

  onMatchDraw(){
    // clear local action badges on draw
    this.lastActionsByPlayer = {};
  }

  onGenerateTeams(): void {
    const playerCount = this.playerSelectionComponent.playerCount;
    const players = this.playerSelectionComponent.players;
    const goalkeepers = this.playerSelectionComponent.goalkeepers;
    const headToHeadPlayers = this.playerSelectionComponent.headToHeadPlayers;

    // Armazenar para uso posterior
    this.playerCount = playerCount;
    this.allGoalkeepers = [...goalkeepers];

    // Validações
    if (playerCount <= 0) {
      alert('Por favor, defina a quantidade de jogadores por time');
      return;
    }

    // Validar se há pelo menos 2 goleiros para 2 times
    if (goalkeepers.length < 2) {
      alert('Você precisa de pelo menos 2 goleiros para montar 2 times');
      return;
    }

    const headToHeadArray = Array.from(headToHeadPlayers).filter(p => players.includes(p));
    const regularPlayers = players.filter(p => !headToHeadPlayers.has(p));
    const availableGoalkeepers = [...goalkeepers];

    // FORÇAR APENAS 2 TIMES
    const numTeams = 2;

    // Embaralhar jogadores regulares
    const shuffledRegularPlayers = this.shuffleArray(regularPlayers);
    const shuffledGoalkeepers = this.shuffleArray(availableGoalkeepers);

    // Inicializar 2 times
    this.teams = [];
    for (let i = 0; i < numTeams; i++) {
      this.teams.push({
        name: `Time ${i + 1}`,
        players: [],
        goalkeeper: shuffledGoalkeepers[i]
      });
    }

    // Distribuir cabeças de chave primeiro (um por time, de forma distribuída)
    let teamIndex = 0;
    for (const headToHead of this.shuffleArray(headToHeadArray)) {
      if (teamIndex >= this.teams.length) {
        teamIndex = 0;
      }
      this.teams[teamIndex].players.push(headToHead);
      teamIndex++;
    }

    // Distribuir jogadores regulares de forma randômica
    let currentTeamIndex = 0;
    for (const player of shuffledRegularPlayers) {
      if (this.teams[currentTeamIndex].players.length < playerCount) {
        this.teams[currentTeamIndex].players.push(player);
      }

      // Passar para próximo time quando atingir limite
      if (this.teams[currentTeamIndex].players.length === playerCount) {
        currentTeamIndex++;
        if (currentTeamIndex >= this.teams.length) {
          currentTeamIndex = 0;
        }
      }
    }

    // Calcular jogadores restantes
    this.calculateRemainingPlayers();

    // Mudar para aba de times
    this.activeTab = 'teams';
    console.log('Times gerados:', this.teams);
    console.log('Jogadores restantes inicialmente:', this.remainingPlayers);
    console.log('Times restantes:', this.remainingTeams);
  }

  private calculateRemainingPlayers(): void {
    const usedPlayers = new Set<string>();

    // Coletar todos os jogadores usados
    for (const team of this.teams) {
      for (const player of team.players) {
        usedPlayers.add(player);
      }
    }

    // Encontrar jogadores não usados (incluir novos jogadores adicionados)
    const allPlayers = [...this.playerSelectionComponent.players];
    this.remainingPlayers = allPlayers.filter(p => !usedPlayers.has(p));

    // Montar times com os jogadores restantes
    //this.buildRemainingTeams();
  }

  private buildRemainingTeams(): void {
    if (this.remainingPlayers.length === 0) {
      this.remainingTeams = [];
      return;
    }

    const playerCount = this.playerSelectionComponent.playerCount;
    const remainingGoalkeepers = this.playerSelectionComponent.goalkeepers.filter(
      gk => !this.teams.some(team => team.goalkeeper === gk)
    );

    // Se não há goleiros suficientes, não forma times restantes
    if (remainingGoalkeepers.length === 0) {
      this.remainingTeams = [];
      return;
    }

    // Calcular quantos times podem ser formados com os restantes
    const totalRemaining = this.remainingPlayers.length + remainingGoalkeepers.length;
    const numRemainingTeams = Math.floor(totalRemaining / (playerCount + 1));

    if (numRemainingTeams === 0) {
      this.remainingTeams = [];
      return;
    }

    // Embaralhar jogadores e goleiros restantes
    const shuffledRemaining = this.shuffleArray(this.remainingPlayers);
    const shuffledRemainingGK = this.shuffleArray(remainingGoalkeepers);

    // Inicializar times restantes
    this.remainingTeams = [];
    for (let i = 0; i < numRemainingTeams; i++) {
      this.remainingTeams.push({
        name: `Time Reserve ${i + 1}`,
        players: [],
        goalkeeper: shuffledRemainingGK[i]
      });
    }

    // Distribuir jogadores restantes
    let currentTeamIndex = 0;
    for (const player of shuffledRemaining) {
      if (this.remainingTeams[currentTeamIndex].players.length < playerCount) {
        this.remainingTeams[currentTeamIndex].players.push(player);
      }

      // Passar para próximo time quando atingir limite
      if (this.remainingTeams[currentTeamIndex].players.length === playerCount) {
        currentTeamIndex++;
        if (currentTeamIndex >= this.remainingTeams.length) {
          break;
        }
      }
    }
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

  onPlayerAction(ev: { player: string; action: string }){
    const { player, action } = ev;
    let scout = this.scouts.find(s => s.player === player);
    const now = Date.now();
    if (!scout){
      scout = { player, pontos: 0, gols: 0, assistencias: 0, actions: [] };
      this.scouts.push(scout);
    }

    // record action in history
    scout.actions.push({ action, time: now });

    // also keep local action badges per player (persist across tabs)
    if (!this.lastActionsByPlayer[player]) this.lastActionsByPlayer[player] = [];
    this.lastActionsByPlayer[player].push(action);
    if (this.lastActionsByPlayer[player].length > 8) this.lastActionsByPlayer[player].shift();

    // apply scoring rules
    switch(action){
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

    // Keep points non-negative if you prefer
    // scout.pontos = Math.max(0, scout.pontos);
    console.log('scouts updated', this.scouts);
  }

  getEmptySet(): Set<string> {
    return new Set();
  }

  addNewPlayer(): void {
    const playerName = this.newPlayerInput.trim();

    // Adicionar diretamente à lista de jogadores sem time
    this.remainingPlayers.push(playerName);
    this.newPlayerInput = '';

    // Reconstruir times restantes se necessário
    //this.buildRemainingTeams();
  }

  removeNewPlayer(index: number): void {
    //const playerToRemove = this.newPlayersAdded[index];
    //this.newPlayersAdded.splice(index, 1);

    // Remover também de remainingPlayers
    //const remainingIndex = this.remainingPlayers.indexOf(playerToRemove);
    if (this.remainingPlayers.hasOwnProperty(index)) {
      this.remainingPlayers.splice(index, 1);
    }

    // Reconstruir times restantes
    //this.buildRemainingTeams();
  }

  applyNewPlayers(): void {
    //if (this.newPlayersAdded.length === 0) {
      //return;
    //}

    // Adicionar novos jogadores à lista original
    const playerCount = this.playerSelectionComponent.playerCount;
    const allPlayers = [...this.playerSelectionComponent.players];
    const allGoalkeepers = this.playerSelectionComponent.goalkeepers;

    // Validar se há pelo menos 2 goleiros
    if (allGoalkeepers.length < 2) {
      alert('Você precisa de pelo menos 2 goleiros para montar 2 times');
      return;
    }

    // FORÇAR APENAS 2 TIMES
    const numTeams = 2;

    // Reorganizar todos os jogadores (existentes + novos)
    const shuffledAllPlayers = this.shuffleArray(allPlayers);
    const shuffledGoalkeepers = this.shuffleArray(allGoalkeepers);

    // Reinicializar 2 times
    this.teams = [];
    for (let i = 0; i < numTeams; i++) {
      this.teams.push({
        name: `Time ${i + 1}`,
        players: [],
        goalkeeper: shuffledGoalkeepers[i]
      });
    }

    // Distribuir todos os jogadores
    let currentTeamIndex = 0;
    for (const player of shuffledAllPlayers) {
      if (this.teams[currentTeamIndex].players.length < playerCount) {
        this.teams[currentTeamIndex].players.push(player);
      }

      // Passar para próximo time quando atingir limite
      if (this.teams[currentTeamIndex].players.length === playerCount) {
        currentTeamIndex++;
        if (currentTeamIndex >= this.teams.length) {
          currentTeamIndex = 0;
        }
      }
    }

    // Recalcular jogadores restantes
    this.calculateRemainingPlayers();

    // Limpar entrada
    //this.newPlayersAdded = [];
    this.newPlayerInput = '';

    console.log('Times redistribuídos com novos jogadores:', this.teams);
  }


}
