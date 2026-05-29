import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-scouts-display',
  templateUrl: './scouts-display.component.html',
  styleUrls: ['./scouts-display.component.css']
})
export class ScoutsDisplayComponent implements OnInit {

  @Input() scouts: Scout[] = [];

  constructor() { }

  ngOnInit(): void {}

  get sortedScouts(): Scout[] {
    return [...(this.scouts || [])].sort((a, b) => b.pontos - a.pontos);
  }

  get maxPontos(): number {
    return Math.max(...(this.scouts || []).map(s => s.pontos));
  }

  get minPontos(): number {
    return Math.min(...(this.scouts || []).map(s => s.pontos));
  }

}

export interface Scout {
  player: string;
  pontos: number;
  gols: number;
  assistencias: number;
  jogadasRuins?: number;
  golsContra?: number;
  vitorias?: number;
  actions?: { action: string; time: number }[];
}
