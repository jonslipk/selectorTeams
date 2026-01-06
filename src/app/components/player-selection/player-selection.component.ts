import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-player-selection',
  templateUrl: './player-selection.component.html',
  styleUrls: ['./player-selection.component.css']
})
export class PlayerSelectionComponent {
  @Output() generateTeams = new EventEmitter<void>();

  playerCount: number = 0;
  players: string[] = [];
  goalkeepers: string[] = [];
  headToHeadPlayers: Set<string> = new Set();
  playersText: string = '';
  goalkeepersText: string = '';

  updatePlayersFromTextarea(): void {
    this.players = this.playersText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  updateGoalkeepersFromTextarea(): void {
    this.goalkeepers = this.goalkeepersText
      .split('\n')
      .map(g => g.trim())
      .filter(g => g.length > 0);
  }

  toggleHeadToHead(player: string): void {
    if (this.headToHeadPlayers.has(player)) {
      this.headToHeadPlayers.delete(player);
    } else {
      this.headToHeadPlayers.add(player);
    }
  }

  isHeadToHead(player: string): boolean {
    return this.headToHeadPlayers.has(player);
  }

  onGenerateTeams(): void {
    this.generateTeams.emit();
  }
}
