import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { StorageService } from '../../services/storage.service';

const TIMER_KEY = 'timerState';

export interface Team {
  name: string;
  players: string[];
  goalkeeper: string;
  goals?: number;
  isWinner?:boolean;
}

@Component({
  selector: 'app-teams-display',
  templateUrl: './teams-display.component.html',
  styleUrls: ['./teams-display.component.css']
})
export class TeamsDisplayComponent implements OnInit, OnDestroy {
  @Input() teams: Team[] = [];
  @Input() headToHeadPlayers: Set<string> = new Set();
  @Input() remainingPlayers: string[] = [];
  @Input() playCount: number = 0;
  @Input() gameTimeSecs: number = 420;
  @Input() goalLimit: number = 2;
  @Output() playerAction: EventEmitter<{player: string, action: string}> = new EventEmitter();
  @Input() lastActionsByPlayer: { [player: string]: string[] } = {};
  @Output() winnerDeclared: EventEmitter<{ winnerTeam: Team, teams: Team[], remainingPlayers: string[] }> = new EventEmitter();
  @Output() drawDeclared: EventEmitter<{ teams: Team[], remainingPlayers: string[] }> = new EventEmitter();
  @Output() removeAction: EventEmitter<{player: string, action: string}> = new EventEmitter();
  @Output() teamsUpdated: EventEmitter<{ teams: Team[], remainingPlayers: string[] }> = new EventEmitter();

  // Cronômetro
  timeRemaining: number = 420;
  isRunning: boolean = false;
  timeUp: boolean = false;
  private intervalId: any;
  playersTeam: string[] = []
  playerModal: any;
  modalAberto = false;
  confirmDrawAberto = false;
  confirmResetTimerAberto = false;

  constructor(private storage: StorageService) {}

  async ngOnInit(): Promise<void> {
    const saved = await this.storage.load<{ timeRemaining: number }>(TIMER_KEY);
    if (saved) {
      this.timeRemaining = saved.timeRemaining;
    } else {
      this.timeRemaining = this.gameTimeSecs;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private playAlarm(): void {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beepCount = 4;
    const beepDuration = 0.2;
    const beepGap = 0.15;

    for (let i = 0; i < beepCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.value = 880;

      const start = ctx.currentTime + i * (beepDuration + beepGap);
      const end = start + beepDuration;

      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      osc.start(start);
      osc.stop(end);
    }
  }

  selectDetails(player:any, event:any){
    const action = event?.target?.value;
    if(!action) return;
    // emit { player, action } for parent to update scouts and action history
    this.playerAction.emit({ player, action });
    // reset select to default (if present)
    try{ event.target.value = ''; }catch(e){}

    const team = this.teams.find(t => t.players.includes(player) || t.goalkeeper === player);
    // Increment goals for the player's team when action is 'gol'
    if (action === 'gol') {
      if (team) {
        team.goals = (team.goals || 0) + 1;
      }
    }else if(action === 'contra'){
      if (team) {
        const opposingTeam = this.teams.find(t => t !== team);
        if (opposingTeam) {
          opposingTeam.goals = Math.max(0, (opposingTeam.goals || 0) + 1);
        }
      }
    }
  }

  getActionIcon(action: string): string{
    switch(action){
      case 'gol': return '⚽';
      case 'ruim': return '⚠️';
      case 'contra': return '❌';
      case 'passe': return '🅰️';
      default: return '';
    }
  }

  promoverGoleiro(team: Team, player: string): void {
    const goleirAtual = team.goalkeeper;
    team.goalkeeper = player;
    const idx = team.players.indexOf(player);
    if (idx > -1) team.players.splice(idx, 1, goleirAtual);
    this.teamsUpdated.emit({ teams: this.teams, remainingPlayers: this.remainingPlayers });
  }

  changePlayer(playerValue: any) {
    let trocou = false;

    // Verifica se é substituição de goleiro
    this.teams.forEach(team => {
      if (team.goalkeeper === this.playerModal) {
        team.goalkeeper = playerValue;
        this.remainingPlayers.splice(this.remainingPlayers.indexOf(playerValue), 1);
        trocou = true;
      }
    });

    // Substituição de jogador de campo
    if (!trocou) {
      this.teams.forEach(team => {
        const index = team.players.findIndex(p => p === this.playerModal);
        if (index !== -1) {
          team.players.splice(index, 1, playerValue);
          this.remainingPlayers.splice(this.remainingPlayers.indexOf(playerValue), 1);
          trocou = true;
        }
      });
    }

    if (trocou) this.remainingPlayers.push(this.playerModal);
    this.modalAberto = false;
    this.teamsUpdated.emit({ teams: this.teams, remainingPlayers: this.remainingPlayers });
  }

  abrirModal(substituto:any) {
    this.playerModal = substituto;
    this.modalAberto = true;
  }

  removePlayerAction(player: string, action: string, event: Event): void {
    event.stopPropagation();
    this.removeAction.emit({ player, action });
  }




  toggleTimer(): void {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }


  startTimer(): void {
    if (this.isRunning || this.timeRemaining === 0) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.storage.save(TIMER_KEY, { timeRemaining: this.timeRemaining });
      } else {
        this.pauseTimer();
        this.timeUp = true;
        this.playAlarm();
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.storage.save(TIMER_KEY, { timeRemaining: this.timeRemaining });
  }

  resetTimer(): void {
    this.pauseTimer();
    this.timeRemaining = this.gameTimeSecs;
    this.timeUp = false;
    this.storage.save(TIMER_KEY, { timeRemaining: this.timeRemaining });
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isHeadToHead(player: string): boolean {
    return this.headToHeadPlayers.has(player);
  }

  setWinner(team: Team): void {
    team.isWinner = true;
    this.onWinnerSelected(team);
    this.teams.forEach(t => t.isWinner = false);
    this.teams.forEach(t => t.goals = 0);
    this.resetTimer();
    this.winnerDeclared.emit({ winnerTeam: team, teams: this.teams, remainingPlayers: this.remainingPlayers });
  }

  canSetWinner(team: Team): boolean {
    const otherTeam = this.teams.find(t => t !== team);
    if (!otherTeam) return false;
    const hasMoreGoals = this.getGoals(team) > this.getGoals(otherTeam);
    if (this.timeUp) return hasMoreGoals;
    return this.getGoals(team) >= this.goalLimit && hasMoreGoals;
  }

  setDraw(): void {
    const fixedGoalkeepers = this.teams.map(t => t.goalkeeper);

    this.teams.forEach(t => t.isWinner = false);
    this.teams.forEach(t => t.players.forEach(p => this.playersTeam.push(p)));

    const shuffledAllPlayers = this.shuffleArray(this.playersTeam);

    for (const player of shuffledAllPlayers) {
      this.remainingPlayers.push(player);
    }

    const numTeams = 2;

    // Reinicializar 2 times mantendo os goleiros fixos
    this.teams = [];
    for (let i = 0; i < numTeams; i++) {
      this.teams.push({
        name: `Time ${i + 1}`,
        players: [],
        goalkeeper: fixedGoalkeepers[i]
      });
    }

    // Distribuir todos os jogadores
    let currentTeamIndex = 0;
    for (const player of this.remainingPlayers) {
      if (this.teams[currentTeamIndex].players.length < this.playCount) {
        this.teams[currentTeamIndex].players.push(player);
      }

      // Passar para próximo time quando atingir limite
      if (this.teams[currentTeamIndex].players.length === this.playCount) {
        currentTeamIndex++;
        if (currentTeamIndex >= this.teams.length) {
          currentTeamIndex = 0;
        }
      }
    }

    this.teams.forEach(t =>
      t.players.forEach(p =>
        this.remainingPlayers.splice(this.remainingPlayers.indexOf(p),1)
      )
      )

      this.playersTeam = []

      this.resetTimer();
      console.log("teams gerados depois do empate", this.teams)
      this.drawDeclared.emit({ teams: this.teams, remainingPlayers: this.remainingPlayers });

  }

  onGoalsChange(team: Team, event: any): void {
    const action = event.target.value;
    const gols  = 0
    const value = action === 'gol' ? gols + 1 : gols;
    this.setGoals(team, value.toString());
  }

  setGoals(team: Team, goals: any): void {
    const numGoals = parseInt(goals, 10);
    console.log("setGoals chamado com time:", team.name, "e gols:", numGoals);
    team.goals = Math.max(0, isNaN(numGoals) ? 0 : numGoals);
  }

  getGoals(team: Team): number {
    return team.goals || 0;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  onWinnerSelected(winnerTeam: Team): void {
    const loserTeam = this.teams.find(t => t.name !== winnerTeam.name);

    if (!loserTeam) return;

    const loserGoalkeeper = loserTeam.goalkeeper;

    this.remainingPlayers.push(...loserTeam.players);

    if (this.remainingPlayers.length < this.playCount) {
      this.teams = [winnerTeam];
      return;
    }

    const newTeamPlayers = this.remainingPlayers.splice(0, this.playCount);

    const newTeam: Team = {
      name: 'Time 2',
      players: newTeamPlayers,
      goalkeeper: loserGoalkeeper
    };

    winnerTeam.name = 'Time 1';
    this.teams = [winnerTeam, newTeam];

    this.teams.forEach(t => {
      t.goals = 0;
      t.isWinner = false;
    });
  }
}
