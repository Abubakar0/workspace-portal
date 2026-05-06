import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TeamsService } from '../../../../core/services/teams.service';
import { Team } from '../../../../shared/models/team.model';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];

  constructor(private teamsService: TeamsService) {}

  ngOnInit(): void {
    this.teamsService.getAll().subscribe((teams) => {
      this.teams = teams;
    });
  }
}
