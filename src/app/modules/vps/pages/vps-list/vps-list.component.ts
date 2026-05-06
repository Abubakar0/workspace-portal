import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { VpsService } from '../../../../core/services/vps.service';
import { Vps } from '../../../../shared/models/vps.model';

@Component({
  selector: 'app-vps-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vps-list.component.html',
  styleUrls: ['./vps-list.component.scss']
})
export class VpsListComponent implements OnInit {
  vpsList: Vps[] = [];

  constructor(private vpsService: VpsService) {}

  ngOnInit(): void {
    this.vpsService.getAll().subscribe((data) => {
      this.vpsList = data;
    });
  }

  openWorkspace(vps: Vps): void {
    this.vpsService.launch(vps.id).subscribe((session) => {
      window.open(session.workspaceUrl, '_blank', 'noopener,noreferrer');
    });
  }
}
