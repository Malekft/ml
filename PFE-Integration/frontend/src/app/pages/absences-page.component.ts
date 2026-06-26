import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { EmployeeDto } from '../core/api.types';
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
  Filter,
  AlertTriangle,
  CalendarOff,
  Plus
} from 'lucide-angular';

/**
 * Component for managing irregular absences.
 * Handles detection, manual creation, and justification workflow.
 */
@Component({
  selector: 'app-absences-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, LucideAngularModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <h2>Gestion des Absences</h2>
        <div class="subtitle">Gérez et régularisez les absences irrégulières des employés</div>
      </div>
      <button class="btn btn-primary-orange" (click)="openAbsenceModal()">
        <i-lucide [name]="CalendarOff" [size]="18" color="#ffffff"></i-lucide>
        Nouvelle absence
      </button>
    </div>

    <!-- KPI Statistics -->
    <section class="stats-grid" style="margin-bottom: 24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-blue-bg);">
          <i-lucide [name]="Calendar" [size]="22" color="var(--color-blue)"></i-lucide>
        </div>
        <div>
          <p class="value value-blue">{{ absences.length }}</p>
          <div class="muted" style="margin-top:4px;">Total absences</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-red-bg);">
          <i-lucide [name]="AlertTriangle" [size]="22" color="var(--color-red)"></i-lucide>
        </div>
        <div>
          <p class="value value-red">{{ countByStatus('TEMPORAIRE') }}</p>
          <div class="muted" style="margin-top:4px;">Non justifiées</div>
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
          <p class="value value-green">{{ countByStatus('JUSTIFIEE') }}</p>
          <div class="muted" style="margin-top:4px;">Justifiées</div>
        </div>
      </article>
    </section>

    <!-- Toolbar Filters -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div style="display:flex; gap:12px; align-items:center;">
        <!-- Employee Selector -->
        <div class="card filter-card" style="width: 260px;">
          <i-lucide [name]="Search" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="selectedEmployeId" (ngModelChange)="onEmployeeFilterChange()" class="filter-select">
            <option value="all">Tous les employés</option>
            <option *ngFor="let emp of employees" [value]="emp.id">
              {{ emp.prenom }} {{ emp.nom }}
            </option>
          </select>
        </div>

        <!-- Employee-Specific Contextual Info -->
        <div *ngIf="selectedEmployeId !== 'all'" class="card filter-card employee-impact-card">
          <div>
            <div style="font-size:16px; font-weight:700; color:var(--color-red);">
              {{ getDefinitiveCount() }} <span style="font-size:12px; font-weight:500;">absence(s) définitive(s)</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
              Soit <strong>{{ getJoursDeduits() }}</strong> jour(s) déduit(s) (Règle d'absence)
            </div>
          </div>
        </div>

        <!-- Date Filters -->
        <div style="display:flex; align-items:center; gap:8px;">
          <i-lucide [name]="Filter" [size]="14" color="var(--text-muted)"></i-lucide>
          <span style="font-size:13px; color:var(--text-muted); font-weight:500;">Filtrer :</span>
          <select [(ngModel)]="selectedYear" class="date-select">
            <option value="all">Toutes les années</option>
            <option *ngFor="let y of getAvailableYears()" [value]="y">{{ y }}</option>
          </select>
          
          <select [(ngModel)]="selectedMonth" [disabled]="selectedYear === 'all'" [style.opacity]="selectedYear === 'all' ? '0.5' : '1'" class="date-select">
            <option value="all">Tous les mois</option>
            <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
          </select>
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
    </div>

    <!-- Absences Table -->
    <section class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Employé</th>
            <th>Type</th>
            <th>Date Début</th>
            <th>Indicateur Temps</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of getFilteredAbsences()">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar avatar-sm" [ngClass]="(a.email || a.employeNom) | avatarColor : a.avatar">
                  {{ a.employeNom | initials }}
                </div>
                <span style="font-weight:600;">{{ a.employeNom }}</span>
              </div>
            </td>
            <td>
              Absence Irrégulière
              <div *ngIf="a.justificatifUrl" style="margin-top:4px; display:flex; gap:8px;">
                <a [href]="getFullUrl(a.justificatifUrl)" target="_blank" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Visualiser">
                  <i-lucide [name]="FileText" [size]="14"></i-lucide> Voir
                </a>
                <a [href]="getDownloadUrl(a.justificatifUrl)" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Télécharger">
                  <i-lucide [name]="Download" [size]="14"></i-lucide>
                </a>
              </div>
            </td>
            <td>{{ a.dateDebut ? a.dateDebut.toString().slice(0, 10) : '-' }}</td>
            <td>
              <span [style.color]="a.statut === 'TEMPORAIRE' ? 'var(--color-red)' : ''" style="font-weight:500;">
                {{ a.infoStr }}
              </span>
            </td>
            <td>
              <span class="chip" [ngClass]="getStatusChipClass(a.statut)">
                {{ getStatusLabel(a.statut) }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:6px;" *ngIf="a.statut === 'EN_ATTENTE'">
                <button class="btn btn-secondary action-btn" (click)="processValidation(a.id, true)">
                  <i-lucide [name]="Check" [size]="14" color="var(--color-green)"></i-lucide>
                </button>
                <button class="btn btn-secondary action-btn" (click)="processValidation(a.id, false)">
                  <i-lucide [name]="X" [size]="14" color="var(--color-red)"></i-lucide>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Modal: New Absence -->
    <div class="modal-overlay" *ngIf="showAbsenceModal">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="icon-circle icon-orange">
              <i-lucide [name]="CalendarOff" [size]="20"></i-lucide>
            </div>
            <div>
              <h3 style="margin:0; font-size:18px;">Ajouter une absence irrégulière</h3>
              <p class="muted" style="font-size:13px; margin:2px 0 0;">Nouvel enregistrement</p>
            </div>
          </div>
          <button class="close-btn" (click)="closeAbsenceModal()">&times;</button>
        </div>

        <div class="modal-body" style="padding:24px;">
          <div class="alert alert-warning">
            <i-lucide [name]="AlertTriangle" [size]="18"></i-lucide>
            <div>
              <strong>Règle de justification:</strong> L'employé disposera de <strong>48 heures</strong> pour justifier cette absence. Passé ce délai, elle sera marquée comme définitive.
            </div>
          </div>

          <div style="display:grid; gap:16px;">
            <div class="form-group">
              <label>Employé *</label>
              <select [(ngModel)]="absenceForm.employeId" class="form-control" required>
                <option [ngValue]="null">Sélectionner un employé</option>
                <option *ngFor="let emp of employees" [ngValue]="emp.id">{{ emp.prenom }} {{ emp.nom }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date de l'absence *</label>
              <input type="datetime-local" [(ngModel)]="absenceForm.dateDebut" class="form-control" required />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeAbsenceModal()">Annuler</button>
          <button class="btn btn-primary btn-primary-orange" (click)="submitAbsence()" [disabled]="!isAbsenceFormValid()">
            Confirmer l'absence
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-primary-orange { background:var(--color-orange); border-color:var(--color-orange); color:white; font-weight:500; display:flex; align-items:center; gap:8px; }
    .filter-card { padding: 10px 16px; display:flex; align-items:center; gap:10px; border-radius: 12px; margin-bottom:0; }
    .filter-select { border:none; background:transparent; width:100%; outline:none; color:var(--text-main); font-family:inherit; font-size:14px; cursor:pointer; }
    .employee-impact-card { background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.1); }
    .date-select { height:36px; padding:0 30px 0 12px; font-size:13px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); outline:none; cursor:pointer; }
    .action-btn { padding:6px 12px; font-size:13px; }
    .alert-warning { margin-bottom:20px; display:flex; gap:12px; padding:12px; background:#fff7ed; border:1px solid #ffedd5; border-radius:8px; color:#9a3412; font-size:13px; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: grid; place-items: center; z-index: 1000; animation: fadeIn 0.2s ease-out; }
    .modal-content { background: white; border-radius: 16px; box-shadow: var(--shadow-xl); width: 90%; overflow: hidden; animation: slideUp 0.3s ease-out; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
    .icon-circle { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; }
    .icon-orange { background: #fff7ed; color: #f97316; }
    .close-btn { background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text-main); }
    .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-size: 14px; transition: all 0.2s; }
    .modal-footer { padding:16px 24px; background:var(--bg-app); display:flex; justify-content:flex-end; gap:12px; border-bottom-left-radius:12px; border-bottom-right-radius:12px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class AbsencesPageComponent implements OnInit, OnDestroy {
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
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly CalendarOff = CalendarOff;
  protected readonly Plus = Plus;
  
  // Constant Data
  readonly months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  readonly statusTabs = [
    { label: 'Toutes', value: 'all' },
    { label: 'Non justifiées', value: 'TEMPORAIRE' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Justifiées', value: 'JUSTIFIEE' }
  ];

  // State Management
  selectedEmployeId: any = 'all';
  activeTab = 'all';
  selectedYear: any = 'all';
  selectedMonth: any = 'all';
  
  employees: EmployeeDto[] = [];
  absences: any[] = [];
  selectedEmployeeAbsences: any[] = [];
  
  showAbsenceModal = false;
  absenceForm = { employeId: null as number | null, dateDebut: '' };

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
    this.refreshAbsences();
  }

  private initPolling(): void {
    this.pollingTimer = setInterval(() => this.refreshAbsences(), 5000);
  }

  private terminatePolling(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  private refreshAbsences(): void {
    this.api.getAbsences().subscribe(res => {
      if (JSON.stringify(res) !== JSON.stringify(this.absences)) {
        this.absences = res || [];
        this.cdr.detectChanges();
      }
    });
  }

  // --- Filtering & Logic ---

  getFilteredAbsences(ignoreStatus: boolean = false): any[] {
    let filtered = this.absences
      .filter(a => ['EN_ATTENTE', 'JUSTIFIEE', 'TEMPORAIRE'].includes(a.statut))
      .map(a => this.mapAbsenceToUiModel(a));

    if (this.selectedEmployeId !== 'all') {
      filtered = filtered.filter(a => a.employeId == this.selectedEmployeId);
    }

    if (this.selectedYear !== 'all') {
      filtered = filtered.filter(a => {
        if (!a.dateDebut) return false;
        const d = new Date(a.dateDebut);
        const matchYear = d.getFullYear() == this.selectedYear;
        const matchMonth = this.selectedMonth === 'all' || (d.getMonth() + 1) == this.selectedMonth;
        return matchYear && matchMonth;
      });
    }

    if (!ignoreStatus && this.activeTab !== 'all') {
      filtered = filtered.filter(a => a.statut === this.activeTab);
    }

    return filtered.sort((a, b) => new Date(b.dateDebut || 0).getTime() - new Date(a.dateDebut || 0).getTime());
  }

  private mapAbsenceToUiModel(a: any) {
    let infoStr = '';
    const now = new Date();

    if (a.statut === 'TEMPORAIRE') {
      const limite = new Date(a.dateLimiteJustification || now);
      const diffHours = Math.max(0, Math.floor((limite.getTime() - now.getTime()) / (1000 * 60 * 60)));
      infoStr = `${diffHours}h restantes`;
    } else if (a.statut === 'EN_ATTENTE') {
      const justif = a.dateJustification ? new Date(a.dateJustification) : (a.dateDebut ? new Date(a.dateDebut) : now);
      const diffHours = Math.floor((now.getTime() - justif.getTime()) / (1000 * 60 * 60));
      infoStr = `${diffHours}h en attente`;
    } else if (a.statut === 'JUSTIFIEE') {
      const start = new Date(a.dateDebut);
      const end = new Date(a.dateFin || now);
      const days = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      infoStr = `${days} jour(s)`;
    }
    
    return { ...a, infoStr };
  }

  onEmployeeFilterChange(): void {
    if (this.selectedEmployeId === 'all') {
      this.selectedEmployeeAbsences = [];
    } else {
      this.api.getEmployeeAbsences(this.selectedEmployeId).subscribe(res => {
        this.selectedEmployeeAbsences = res || [];
        this.cdr.detectChanges();
      });
    }
  }

  // --- Statistics & Labels ---

  countByStatus(status: string): number {
    return this.getFilteredAbsences(true).filter(a => a.statut === status).length;
  }

  getTabWithCountLabel(tab: any): string {
    const count = tab.value === 'all' ? this.getFilteredAbsences(true).length : this.countByStatus(tab.value);
    return `${tab.label} (${count})`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'JUSTIFIEE': 'Justifiée',
      'TEMPORAIRE': 'Non justifiée'
    };
    return labels[status] || status;
  }

  getStatusChipClass(status: string): string {
    return {
      'EN_ATTENTE': 'chip-orange',
      'JUSTIFIEE': 'chip-green',
      'TEMPORAIRE': 'chip-red'
    }[status] || '';
  }

  getDefinitiveCount(): number {
    return this.selectedEmployeeAbsences.filter(a => this.isDefinitive(a)).length;
  }

  getJoursDeduits(): number { return this.getDefinitiveCount() * 5; }

  private isDefinitive(a: any): boolean {
    if (a.statut === 'DEFINITIVE') return true;
    if (a.statut === 'TEMPORAIRE') {
      const limit = new Date(a.dateLimiteJustification);
      return limit.getTime() <= Date.now();
    }
    return false;
  }

  getAvailableYears(): number[] {
    const years = new Set(this.absences.map(a => a.dateDebut ? new Date(a.dateDebut).getFullYear() : null).filter(y => y !== null));
    return Array.from(years).sort((a, b) => (b as number) - (a as number)) as number[];
  }

  // --- Actions & Modal ---

  openAbsenceModal(): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.absenceForm = { employeId: null, dateDebut: now.toISOString().slice(0, 16) };
    this.showAbsenceModal = true;
  }

  closeAbsenceModal(): void {
    this.showAbsenceModal = false;
  }

  isAbsenceFormValid(): boolean { return !!this.absenceForm.employeId && !!this.absenceForm.dateDebut; }

  submitAbsence(): void {
    if (!this.isAbsenceFormValid()) return;
    this.api.createAbsence({
      employeId: this.absenceForm.employeId!,
      dateDebut: this.absenceForm.dateDebut,
      dateFin: this.absenceForm.dateDebut,
      type: 'ABSENCE_IRREGULIERE'
    }).subscribe({
      next: () => {
        this.closeAbsenceModal();
        this.refreshAbsences();
      },
      error: (err) => alert(err.error?.message || "Erreur lors de l'enregistrement")
    });
  }

  processValidation(id: number, isApproved: boolean): void {
    const msg = isApproved ? "Voulez-vous valider cette justification ?" : "Voulez-vous refuser cette justification ?";
    if (confirm(msg)) {
      this.api.validateAbsence(id, isApproved).subscribe({
        next: () => this.refreshAbsences(),
        error: (err) => alert(err.error?.message || 'Erreur lors de la validation')
      });
    }
  }

  // --- Helpers ---
  getFullUrl(path?: string | null): string { return this.api.getFullUrl(path); }
  getDownloadUrl(path?: string | null): string { return this.api.getDownloadUrl(path); }
}
