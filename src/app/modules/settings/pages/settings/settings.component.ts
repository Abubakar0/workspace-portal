import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BackendSettings, SettingsService } from '../../../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settings: BackendSettings | null = null;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe((settings) => {
      this.settings = settings;
    });
  }
}
