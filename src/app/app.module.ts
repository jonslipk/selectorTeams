import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlayerSelectionComponent } from './components/player-selection/player-selection.component';
import { TeamsDisplayComponent } from './components/teams-display/teams-display.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayerSelectionComponent,
    TeamsDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
