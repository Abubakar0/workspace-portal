import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { TeamsService } from '../../../../core/services/teams.service';
import { VpsService } from '../../../../core/services/vps.service';
import { AuditLog } from '../../../../shared/models/audit-log.model';
import { Team } from '../../../../shared/models/team.model';
import { User } from '../../../../shared/models/user.model';
import { Vps } from '../../../../shared/models/vps.model';

type AdminTab = 'overview' | 'employees' | 'vps' | 'teams' | 'audit';

@Component({
  selector: 'app-admin-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-console.component.html',
  styleUrls: ['./admin-console.component.scss']
})
export class AdminConsoleComponent implements OnInit {
  activeTab: AdminTab = 'overview';
  employees: User[] = [];
  vpsList: Vps[] = [];
  teams: Team[] = [];
  auditLogs: AuditLog[] = [];
  message = '';
  search = '';

  employeeForm: Partial<User> & { password: string; id?: number } = this.emptyEmployee();
  vpsForm: Partial<Vps> & { id?: number } = this.emptyVps();
  teamForm: Partial<Team> & { id?: number } = this.emptyTeam();

  constructor(
    private adminService: AdminService,
    private teamsService: TeamsService,
    private vpsService: VpsService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.adminService.getEmployees().subscribe((employees) => (this.employees = employees));
    this.vpsService.getAll().subscribe((vpsList) => (this.vpsList = vpsList));
    this.teamsService.getAll().subscribe((teams) => (this.teams = teams));
    this.adminService.getAuditLogs().subscribe((auditLogs) => (this.auditLogs = auditLogs));
  }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    this.message = '';
  }

  get activeEmployees(): number {
    return this.employees.filter((employee) => employee.status === 'active').length;
  }

  get onlineVps(): number {
    return this.vpsList.filter((vps) => vps.status === 'online').length;
  }

  get marketplaces(): number {
    return new Set(this.teams.map((team) => team.marketplace)).size;
  }

  get filteredEmployees(): User[] {
    const search = this.search.toLowerCase().trim();

    if (!search) {
      return this.employees;
    }

    return this.employees.filter((employee) =>
      [employee.name, employee.email, employee.team, employee.marketplace, employee.role]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  get filteredVpsList(): Vps[] {
    const search = this.search.toLowerCase().trim();

    if (!search) {
      return this.vpsList;
    }

    return this.vpsList.filter((vps) =>
      [vps.name, vps.team, vps.assignedEmployee, vps.marketplace, vps.region, vps.connectionId]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  get filteredTeams(): Team[] {
    const search = this.search.toLowerCase().trim();

    if (!search) {
      return this.teams;
    }

    return this.teams.filter((team) =>
      [team.name, team.marketplace, team.lead].join(' ').toLowerCase().includes(search)
    );
  }

  resetForms(): void {
    this.employeeForm = this.emptyEmployee();
    this.vpsForm = this.emptyVps();
    this.teamForm = this.emptyTeam();
    this.message = '';
  }

  saveEmployee(): void {
    const request = this.employeeForm.id
      ? this.adminService.updateEmployee(this.employeeForm.id, this.employeeForm)
      : this.adminService.createEmployee(this.employeeForm as Partial<User> & { password: string });

    request.subscribe({
      next: () => {
        this.employeeForm = this.emptyEmployee();
        this.message = 'Employee saved';
        this.loadAll();
      },
      error: (error) => (this.message = error.error?.message || 'Employee save failed')
    });
  }

  editEmployee(employee: User): void {
    this.employeeForm = { ...employee, password: '' };
  }

  deleteEmployee(id: number): void {
    this.adminService.deleteEmployee(id).subscribe({
      next: () => {
        this.message = 'Employee deleted';
        this.loadAll();
      },
      error: (error) => (this.message = error.error?.message || 'Delete failed')
    });
  }

  saveVps(): void {
    const request = this.vpsForm.id
      ? this.adminService.updateVps(this.vpsForm.id, this.vpsForm)
      : this.adminService.createVps(this.vpsForm);

    request.subscribe({
      next: () => {
        this.vpsForm = this.emptyVps();
        this.message = 'VPS saved';
        this.loadAll();
      },
      error: (error) => (this.message = error.error?.message || 'VPS save failed')
    });
  }

  editVps(vps: Vps): void {
    this.vpsForm = { ...vps };
  }

  deleteVps(id: number): void {
    this.adminService.deleteVps(id).subscribe(() => {
      this.message = 'VPS deleted';
      this.loadAll();
    });
  }

  saveTeam(): void {
    const request = this.teamForm.id
      ? this.adminService.updateTeam(this.teamForm.id, this.teamForm)
      : this.adminService.createTeam(this.teamForm);

    request.subscribe({
      next: () => {
        this.teamForm = this.emptyTeam();
        this.message = 'Team saved';
        this.loadAll();
      },
      error: (error) => (this.message = error.error?.message || 'Team save failed')
    });
  }

  editTeam(team: Team): void {
    this.teamForm = { ...team };
  }

  deleteTeam(id: number): void {
    this.adminService.deleteTeam(id).subscribe(() => {
      this.message = 'Team deleted';
      this.loadAll();
    });
  }

  private emptyEmployee(): Partial<User> & { password: string } {
    return {
      name: '',
      email: '',
      password: '',
      role: 'employee',
      team: '',
      marketplace: '',
      status: 'active',
      shift: 'Day'
    };
  }

  private emptyVps(): Partial<Vps> {
    return {
      name: '',
      team: '',
      assignedEmployee: '',
      status: 'offline',
      connectionId: '',
      marketplace: '',
      region: 'US'
    };
  }

  private emptyTeam(): Partial<Team> {
    return {
      name: '',
      marketplace: '',
      lead: '',
      assigned: 0,
      members: 0
    };
  }
}
