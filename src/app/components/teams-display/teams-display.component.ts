import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';

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
  @Input() playCount: number = 0
  @Output() playerAction: EventEmitter<{player: string, action: string}> = new EventEmitter();
  @Input() lastActionsByPlayer: { [player: string]: string[] } = {};
  @Output() winnerDeclared: EventEmitter<Team> = new EventEmitter();
  @Output() drawDeclared: EventEmitter<void> = new EventEmitter();

  // Cronômetro
  timeRemaining: number = 420; // 7 minutos em segundos
  isRunning: boolean = false;
  private intervalId: any;
  playersTeam: string[] = []
  goalKeepersTeam: string[] = []
  playerModal: any;
  modalAberto = false;
  golsPartida: number = 0;




  ngOnInit(): void {
    this.resetTimer();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  selectDetails(player:any, event:any){
    const action = event?.target?.value;
    if(!action) return;
    // emit { player, action } for parent to update scouts and action history
    this.playerAction.emit({ player, action });
    // reset select to default (if present)
    try{ event.target.value = ''; }catch(e){}

    if(action === 'gol'){
      this.golsPartida++;
      this.setGoals(this.teams.find(t => t.players.includes(player))!, this.golsPartida.toString());
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

  changePlayer(playerValue:any){
    this.teams.forEach(team => {
                        const index = team.players.findIndex(p => p === this.playerModal);

                        if (index !== -1) {
                          team.players.splice(index, 1, playerValue);
                          this.remainingPlayers.splice(this.remainingPlayers.indexOf(playerValue),1)
                        }
    });

  this.remainingPlayers.push(this.playerModal)

  this.modalAberto = false;
 ;
}

  abrirModal(substituto:any) {
    this.playerModal = substituto;
    this.modalAberto = true;
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
      } else {
        this.pauseTimer();
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  resetTimer(): void {
    this.pauseTimer();
    this.timeRemaining = 420; // 7 minutos
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
    console.log('setWinner chamado com time:', team.name);
    team.isWinner = true;

    console.log('setWinner times:', this.teams)

    // Emitir evento com o time vencedor
    this.onWinnerSelected(team);
    this.winnerDeclared.emit(team);

    this.teams.forEach(t => t.isWinner = false);
    // Zerar gols
    this.teams.forEach(t => t.goals = 0);
    // Definir novo vencedor

  }

  canSetWinner(team: Team): boolean {
    // Encontrar o outro time
    const otherTeam = this.teams.find(t => t !== team);
    if (!otherTeam) return false;

    // Só permite marcar vencedor se este time tiver mais gols que o outro
    return this.getGoals(team) > this.getGoals(otherTeam);
  }

  setDraw(): void {


    this.teams.forEach(t => t.isWinner = false);
    this.teams.forEach(t => t.players.forEach(p => this.playersTeam.push(p)))
    this.teams.forEach(t => this.goalKeepersTeam.push(t.goalkeeper))

    const shuffledAllPlayers = this.shuffleArray(this.playersTeam);
    const shuffledGoalkeepers = this.shuffleArray(this.goalKeepersTeam);

    for (const player of shuffledAllPlayers) {
      this.remainingPlayers.push(player);
    }

     const numTeams = 2;

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

      console.log("teams gerados depois do empate", this.teams)
      this.drawDeclared.emit();

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
    console.log('=== onWinnerSelected CHAMADO ===');
    console.log('Time vencedor:', winnerTeam);

    console.log('Times:', this.teams);
    this.teams.forEach(t => this.goalKeepersTeam.push(t.goalkeeper))

    // Encontrar o time que perdeu
    const loserTeam = this.teams.find(t => t.name !== winnerTeam.name);


    if (!loserTeam) {
      console.log('Erro: Não encontrado time perdedor');
      return;
    }

    console.log('Time perdedor:', loserTeam.name);
    console.log('Jogadores do time perdedor:', loserTeam.players);
    console.log('remainingPlayers antes:', this.remainingPlayers);

    // Adicionar os jogadores do time que perdeu ao final da lista de jogadores sem time
    this.remainingPlayers.push(...loserTeam.players);

    console.log('remainingPlayers depois de push:', this.remainingPlayers);
    console.log('Quantidade necessária:', 5);

    // Verificar se consegue montar novo time (apenas verificar jogadores)
    if (this.remainingPlayers.length < 5) {
      console.log('ERRO: Insuficientes jogadores');
      // Não consegue montar novo time
      this.teams = [winnerTeam];
      console.log('Não há jogadores suficientes para formar novo time');
      return;
    }

    // Montar novo time com os PRIMEIROS jogadores da lista (ordem)
    const newTeamPlayers = this.remainingPlayers.splice(0, 5);
    // Usar um goleiro diferente do Time 1 (vencedor)
    const newGoalkeeper = this.goalKeepersTeam.find(gk => gk !== winnerTeam.goalkeeper) || this.goalKeepersTeam[0];

    console.log('Jogadores do novo time:', newTeamPlayers);
    console.log('Goleiro do novo time:', newGoalkeeper);

    const newTeam: Team = {
      name: 'Time 2',
      players: newTeamPlayers,
      goalkeeper: newGoalkeeper
    };

    // Atualizar times
    winnerTeam.name = 'Time 1';
    this.teams = [winnerTeam, newTeam];



    // Resetar gols e status
    this.teams.forEach(t => {
      t.goals = 0;
      t.isWinner = false;
    });

    console.log('=== NOVO TIME MONTADO ===');
    console.log('Times agora:', this.teams);
    console.log('Jogadores restantes após montagem:', this.remainingPlayers);
  }
}
