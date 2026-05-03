import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { StorageService } from '../../services/storage.service';

interface PlayerSelectionState {
  playerCount: number;
  players: string[];
  goalkeepers: string[];
  headToHeadPlayers: string[];
  playersText: string;
  goalkeepersText: string;
}

const SELECTION_KEY = 'playerSelectionState';

@Component({
  selector: 'app-player-selection',
  templateUrl: './player-selection.component.html',
  styleUrls: ['./player-selection.component.css']
})
export class PlayerSelectionComponent implements OnInit {
  @Output() generateTeams = new EventEmitter<void>();

  playerCount: number = 5;
  players: string[] = [];
  goalkeepers: string[] = [];
  headToHeadPlayers: Set<string> = new Set();
  playersText: string = '';
  goalkeepersText: string = '';

  constructor(private storage: StorageService) {}

  async ngOnInit(): Promise<void> {
    const saved = await this.storage.load<PlayerSelectionState>(SELECTION_KEY);
    if (saved) {
      this.playerCount = saved.playerCount ?? 5;
      this.players = saved.players ?? [];
      this.goalkeepers = saved.goalkeepers ?? [];
      this.headToHeadPlayers = new Set(saved.headToHeadPlayers ?? []);
      this.playersText = saved.playersText ?? '';
      this.goalkeepersText = saved.goalkeepersText ?? '';
    }
  }

  private saveState(): void {
    const state: PlayerSelectionState = {
      playerCount: this.playerCount,
      players: this.players,
      goalkeepers: this.goalkeepers,
      headToHeadPlayers: Array.from(this.headToHeadPlayers),
      playersText: this.playersText,
      goalkeepersText: this.goalkeepersText,
    };
    this.storage.save(SELECTION_KEY, state);
  }

  updatePlayersFromTextarea(): void {
    this.players = this.playersText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    this.saveState();
  }

  updateGoalkeepersFromTextarea(): void {
    this.goalkeepers = this.goalkeepersText
      .split('\n')
      .map(g => g.trim())
      .filter(g => g.length > 0);
    this.saveState();
  }

  toggleHeadToHead(player: string): void {
    if (this.headToHeadPlayers.has(player)) {
      this.headToHeadPlayers.delete(player);
    } else {
      this.headToHeadPlayers.add(player);
    }
    this.saveState();
  }

  isHeadToHead(player: string): boolean {
    return this.headToHeadPlayers.has(player);
  }

  onPlayerCountChange(): void {
    this.saveState();
  }

  onGenerateTeams(): void {
    this.saveState();
    this.generateTeams.emit();
  }
}
