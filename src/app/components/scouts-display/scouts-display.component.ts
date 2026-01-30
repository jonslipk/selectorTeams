import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-scouts-display',
  templateUrl: './scouts-display.component.html',
  styleUrls: ['./scouts-display.component.css']
})
export class ScoutsDisplayComponent implements OnInit {

  @Input() scouts: Scout[] = [];
  expandedPlayers: Set<string> = new Set();

  constructor() { }

  ngOnInit(): void {
    if (!this.scouts || this.scouts.length === 0) {
      this.scouts = [
        { player: 'Jogador 1', pontos: 10, gols: 3, assistencias: 2, actions: [] },
        { player: 'Jogador 2', pontos: 8,  gols: 2, assistencias: 1, actions: [] },
        { player: 'Jogador 3', pontos: 6,  gols: 1, assistencias: 1, actions: [] }
      ];
    }
  }

  toggleHistory(player: string){
    if (this.expandedPlayers.has(player)) this.expandedPlayers.delete(player);
    else this.expandedPlayers.add(player);
  }

}

export interface Scout {
  player: string;
  pontos: number;
  gols: number;
  assistencias: number;
  actions?: { action: string; time: number }[];
}
