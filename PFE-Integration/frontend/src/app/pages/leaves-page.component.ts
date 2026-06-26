import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { DemandeDto, TypeCongeDto, SousTypeCongeDto, EmployeeDto } from '../core/api.types';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';
import {
  LucideAngularModule,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Check,
  X,
  Download,
  Filter
} from 'lucide-angular';

/**
 * Component for managing leave requests (Congés).
 * Supports filtering by employee, type, date, and status.
 */
@Component({
  selector: 'app-leaves-page',
  standalone: true,
  imports: [
    NgFor, NgIf, NgClass, FormsModule, 
    LucideAngularModule, AvatarColorPipe, InitialsPipe
  ],
  template: `
    <!-- Header with Year/Month Filters -->
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <h2>Gestion des Congés</h2>
        <div class="subtitle">Gérez les demandes de congés et consultez votre solde</div>
      </div>
      <div style="display:flex; gap:10px;">
        <select [(ngModel)]="selectedYear" class="form-control" style="padding: 10px 16px; border-radius: 12px; border: 1px solid var(--border-light); background: var(--bg-main); outline: none; color: var(--text-main); font-family: inherit; font-size: 14px; cursor: pointer; min-width: 120px;">
          <option value="all">Année</option>
          <option *ngFor="let y of getAvailableYears()" [value]="y">{{ y }}</option>
        </select>
        
        <select [(ngModel)]="selectedMonth" class="form-control" style="padding: 10px 16px; border-radius: 12px; border: 1px solid var(--border-light); background: var(--bg-main); outline: none; color: var(--text-main); font-family: inherit; font-size: 14px; cursor: pointer; min-width: 140px;">
          <option value="all">Mois</option>
          <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
        </select>
      </div>
    </div>

    <!-- KPI Statistics -->
    <section class="stats-grid" style="margin-bottom: 24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-blue-bg);">
          <i-lucide [name]="Calendar" [size]="22" color="var(--color-blue)"></i-lucide>
        </div>
        <div>
          <p class="value value-blue">{{ getTotalCount() }}</p>
          <div class="muted" style="margin-top:4px;">Total demandes</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-orange-bg);">
          <i-lucide [name]="Clock" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div>
          <p class="value value-orange">{{ countByStatus('EN_ATTENTE') }}</p>
          <div class="muted" style="margin-top:4px;">En attente</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-green-bg);">
          <i-lucide [name]="CheckCircle" [size]="22" color="var(--color-green)"></i-lucide>
        </div>
        <div>
          <p class="value value-green">{{ countByStatus('APPROUVEE') }}</p>
          <div class="muted" style="margin-top:4px;">Approuvées</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-red-bg);">
          <i-lucide [name]="XCircle" [size]="22" color="var(--color-red)"></i-lucide>
        </div>
        <div>
          <p class="value value-red">{{ countByStatus('REFUSEE') }}</p>
          <div class="muted" style="margin-top:4px;">Refusées</div>
        </div>
      </article>
    </section>

    <!-- Filter Toolbar -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div style="display:flex; gap:12px; align-items:center;">
        <!-- Employee Filter -->
        <div class="card toolbar-select-card" style="width: 260px;">
          <i-lucide [name]="Search" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="selectedEmployeId" class="toolbar-select">
            <option value="all">Tous les employés</option>
            <option *ngFor="let emp of employees" [value]="emp.id">
              {{ emp.prenom }} {{ emp.nom }}
            </option>
          </select>
        </div>

        <!-- Leave Type Filter -->
        <div class="card toolbar-select-card" style="width: 220px;">
          <i-lucide [name]="Filter" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="selectedTypeCongeId" (ngModelChange)="selectedSousTypeCongeId = 'all'" class="toolbar-select">
            <option value="all">Tous les types</option>
            <option *ngFor="let t of leaveTypes" [value]="t.id">{{ t.nom }}</option>
          </select>
        </div>

        <!-- Sub-Type Filter (Dynamic) -->
        <div class="card toolbar-select-card" style="width: 220px;" *ngIf="getFilteredSousTypes().length > 0">
          <i-lucide [name]="Filter" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="selectedSousTypeCongeId" class="toolbar-select">
            <option value="all">Tous les motifs</option>
            <option *ngFor="let st of getFilteredSousTypes()" [value]="st.id">{{ st.nom }}</option>
          </select>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="tab-bar" style="margin-bottom:0;">
        <button
          *ngFor="let tab of statusTabs"
          class="tab-btn"
          [class.active]="activeTab === tab.value"
          (click)="activeTab = tab.value"
        >
          {{ getTabWithCountLabel(tab) }}
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <section class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Employé</th>
            <th>Type</th>
            <th>Période</th>
            <th>Durée</th>
            <th>Date Demande</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of getFilteredDemands(); trackBy: trackById">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar avatar-sm" [ngClass]="(d.email || d.employeNom) | avatarColor : d.avatar">
                  {{ d.employeNom | initials }}
                </div>
                <span style="font-weight:600;">{{ d.employeNom }}</span>
              </div>
            </td>
            <td>
              {{ d.typeLabel }}
              <!-- Salary Impact Badge for Special Leaves -->
              <div *ngIf="d.isLongTermLeave && d.statut !== 'REFUSEE'" 
                   [style.background]="getSalaryImpactStyles(d, 'bg')" 
                   [style.color]="getSalaryImpactStyles(d, 'text')" 
                   class="salary-badge">
                {{ getSalaryImpactLabel(d) }}
              </div>
              <!-- Attachments -->
              <div *ngIf="d.justificatifUrl" style="margin-top:4px; display:flex; gap:8px;">
                <a [href]="getFullUrl(d.justificatifUrl)" target="_blank" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Visualiser">
                  <i-lucide [name]="FileText" [size]="14"></i-lucide> Voir
                </a>
                <a [href]="getDownloadUrl(d.justificatifUrl)" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Télécharger">
                  <i-lucide [name]="Download" [size]="14"></i-lucide>
                </a>
              </div>
            </td>
            <td style="white-space:nowrap;">{{ d.periodeLabel }}</td>
            <td>{{ d.dureeLabel }}</td>
            <td>
              <div class="muted" style="font-size:12px;">
                <i-lucide [name]="Clock" [size]="12" style="vertical-align:middle;"></i-lucide>
                {{ formatDisplayDate(d.dateCreation) }}
              </div>
            </td>
            <td>
              <span class="chip" [ngClass]="getStatusChipClass(d.statut)">
                {{ getStatusLabel(d.statut) }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:6px;" *ngIf="d.statut === 'EN_ATTENTE'">
                <button class="btn btn-secondary action-btn" (click)="processApproval(d.id, true)">
                  <i-lucide [name]="Check" [size]="14" color="var(--color-green)"></i-lucide>
                </button>
                <button class="btn btn-secondary action-btn" (click)="processApproval(d.id, false)">
                  <i-lucide [name]="X" [size]="14" color="var(--color-red)"></i-lucide>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .toolbar-select-card { padding: 10px 16px; display:flex; align-items:center; gap:10px; border-radius: 12px; margin-bottom:0; }
    .toolbar-select { border:none; background:transparent; width:100%; outline:none; color:var(--text-main); font-family:inherit; font-size:14px; cursor:pointer; }
    .salary-badge { font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; margin-top:4px; display:inline-block; border:1px solid currentColor; }
    .action-btn { padding:6px 12px; font-size:13px; }
  `]
})
export class LeavesPageComponent implements OnInit, OnDestroy {
  // Lucide Icons
  protected readonly Calendar = Calendar;
  protected readonly Clock = Clock;
  protected readonly CheckCircle = CheckCircle;
  protected readonly XCircle = XCircle;
  protected readonly Search = Search;
  protected readonly FileText = FileText;
  protected readonly Check = Check;
  protected readonly X = X;
  protected readonly Download = Download;
  protected readonly Filter = Filter;

  // Constant Data
  readonly months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  readonly statusTabs = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Approuvées', value: 'APPROUVEE' },
    { label: 'Refusées', value: 'REFUSEE' }
  ];

  // State
  selectedEmployeId: any = 'all';
  selectedTypeCongeId: any = 'all';
  selectedSousTypeCongeId: any = 'all';
  selectedYear: any = 'all';
  selectedMonth: any = 'all';
  activeTab = 'all';

  employees: EmployeeDto[] = [];
  demands: DemandeDto[] = [];
  leaveTypes: TypeCongeDto[] = [];
  
  private pollingTimer: any;

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchInitialData();
    this.initPolling();
  }

  ngOnDestroy(): void {
    this.terminatePolling();
  }

  // --- Data Management & Polling ---

  private fetchInitialData(): void {
    this.api.getEmployees().subscribe(res => {
      this.employees = res || [];
      this.cdr.detectChanges();
    });

    this.api.getLeaveTypes().subscribe(res => {
      this.leaveTypes = res || [];
      this.cdr.detectChanges();
    });

    this.refreshDemands();
  }

  private initPolling(): void {
    this.pollingTimer = setInterval(() => this.refreshDemands(), 5000);
  }

  private terminatePolling(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  private refreshDemands(): void {
    this.api.getDemands().subscribe({
      next: (res) => {
        const processed = (res || []).filter(d => 
          (d.typeCongeId || d.typeCongeNom || d.dateDebut) && 
          d.statut !== 'ANNULEE' &&
          !this.isRecentPending(d.dateCreation, d.statut)
        );
        
        if (JSON.stringify(processed) !== JSON.stringify(this.demands)) {
          this.demands = processed;
          this.cdr.detectChanges();
        }
      }
    });
  }

  private isRecentPending(dateCreation: any, status: string): boolean {
    if (status !== 'EN_ATTENTE' || !dateCreation) return false;
    const now = Date.now();
    const created = new Date(dateCreation).getTime();
    return (now - created) <= 60000; // 1-minute grace period
  }

  // --- Filtering Logic ---

  getFilteredDemands(): any[] {
    let filtered = this.demands.map(d => this.mapDemandToUiModel(d));

    // Sequential filtering for clarity
    if (this.selectedEmployeId !== 'all') {
      filtered = filtered.filter(d => d.employeId == this.selectedEmployeId);
    }
    if (this.selectedTypeCongeId !== 'all') {
      filtered = filtered.filter(d => d.typeCongeId == this.selectedTypeCongeId);
    }
    if (this.selectedSousTypeCongeId !== 'all') {
      filtered = filtered.filter(d => d.sousTypeCongeId == this.selectedSousTypeCongeId);
    }
    if (this.selectedYear !== 'all') {
      filtered = filtered.filter(d => new Date(d.dateCreation).getFullYear() == this.selectedYear);
    }
    if (this.selectedMonth !== 'all') {
      filtered = filtered.filter(d => (new Date(d.dateCreation).getMonth() + 1) == this.selectedMonth);
    }
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(d => d.statut === this.activeTab);
    }

    return filtered.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }

  private mapDemandToUiModel(d: any) {
    const fullName = d.employePrenom ? `${d.employePrenom} ${d.employeNom}` : d.employeNom;
    return {
      ...d,
      employeNom: fullName,
      typeLabel: d.sousTypeCongeNom ? `${d.typeCongeNom} (${d.sousTypeCongeNom})` : (d.typeCongeNom || 'Congé'),
      periodeLabel: `${this.formatDisplayDate(d.dateDebut)} → ${this.formatDisplayDate(d.dateFin)}`,
      dureeLabel: d.dureeJours ? `${d.dureeJours} jours` : '-',
      isLongTermLeave: (d.sousTypeCongeNom === 'LONGUE_DUREE' || d.sousTypeCongeId === 6)
    };
  }

  getFilteredSousTypes(): any[] {
    const allSousTypes = [
      { id: 5, typeCongeId: 2, nom: 'MALADIE_ORDINAIRE' },
      { id: 6, typeCongeId: 2, nom: 'LONGUE_DUREE' },
      { id: 1, typeCongeId: 3, nom: 'DECES' },
      { id: 2, typeCongeId: 3, nom: 'MARIAGE' },
      { id: 8, typeCongeId: 3, nom: 'MATERNITE' },
      { id: 3, typeCongeId: 3, nom: 'PATERNITE' },
      { id: 4, typeCongeId: 3, nom: 'Visite d’une institution gouvernementale' },
      { id: 7, typeCongeId: 3, nom: 'Congé d\'accompagnement' }
    ];

    return this.selectedTypeCongeId === 'all' 
      ? allSousTypes 
      : allSousTypes.filter(s => s.typeCongeId == this.selectedTypeCongeId);
  }

  getAvailableYears(): number[] {
    const years = this.demands.map(d => new Date(d.dateCreation).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }

  // --- Statistics & Labels ---

  getTotalCount(): number {
    return this.countByStatus('all');
  }

  countByStatus(status: string): number {
    return this.demands.filter(d => {
      const matchStatus = status === 'all' || d.statut === status;
      const matchEmp = this.selectedEmployeId === 'all' || d.employeId == this.selectedEmployeId;
      return matchStatus && matchEmp;
    }).length;
  }

  getTabWithCountLabel(tab: any): string {
    const count = tab.value === 'all' ? this.getTotalCount() : this.countByStatus(tab.value);
    return `${tab.label} (${count})`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'APPROUVEE': 'Approuvée',
      'REFUSEE': 'Refusée'
    };
    return labels[status] || status;
  }

  getStatusChipClass(status: string): string {
    return {
      'EN_ATTENTE': 'chip-orange',
      'APPROUVEE': 'chip-green',
      'REFUSEE': 'chip-red'
    }[status] || '';
  }

  // --- Actions ---

  processApproval(id: number, isApproved: boolean): void {
    if (isApproved) {
      if (!confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) return;
      this.api.approveDemand(id, 1).subscribe({
        next: () => this.refreshDemands(),
        error: (err) => alert(err.error?.message || 'Erreur lors de l\'approbation')
      });
    } else {
      const motif = prompt('Veuillez saisir le motif du refus :');
      if (!motif) return;
      this.api.rejectDemand(id, 1, motif).subscribe({
        next: () => this.refreshDemands(),
        error: (err) => alert(err.error?.message || 'Erreur lors du refus')
      });
    }
  }

  // --- Salary Logic ---

  getSalaryImpactLabel(d: any): string {
    if (!d.isLongTermLeave) return '';
    
    const currentYear = new Date(d.dateDebut || d.dateCreation).getFullYear();
    const priorApprovedDays = this.demands
      .filter(l => 
        l.employeId === d.employeId && 
        (l.sousTypeCongeNom === 'LONGUE_DUREE' || l.sousTypeCongeId === 6) && 
        l.statut === 'APPROUVEE' &&
        new Date(l.dateDebut || '').getFullYear() === currentYear &&
        new Date(l.dateDebut || '').getTime() < new Date(d.dateDebut || '').getTime()
      )
      .reduce((sum, l) => sum + (l.dureeJours || 0), 0);
    
    return (priorApprovedDays >= 30) ? 'Demi-Salaire (50%)' : 'Salaire Complet (100%)';
  }

  getSalaryImpactStyles(d: any, property: 'bg' | 'text'): string {
    const label = this.getSalaryImpactLabel(d);
    if (label.includes('100%')) return property === 'bg' ? 'rgba(16,185,129,0.1)' : '#10b981';
    if (label.includes('50%')) return property === 'bg' ? 'rgba(239,68,68,0.1)' : '#ef4444';
    return property === 'bg' ? 'rgba(245,158,11,0.1)' : '#f59e0b';
  }

  // --- Helpers ---

  formatDisplayDate(dateStr: any): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  getFullUrl(path?: string | null): string { return this.api.getFullUrl(path); }
  getDownloadUrl(path?: string | null): string { return this.api.getDownloadUrl(path); }
  trackById(_: number, item: any): any { return item.id; }
}
