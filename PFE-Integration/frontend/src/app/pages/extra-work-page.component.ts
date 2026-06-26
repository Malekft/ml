import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';
import { 
  LucideAngularModule, 
  Clock, 
  Hourglass, 
  CheckCircle,
  Inbox,
  Calendar,
  XCircle,
  Users
} from 'lucide-angular';

/**
 * Component for managing employee extra work requests.
 * Handles display, filtering, and status updates (Approval/Refusal).
 */
@Component({
  selector: 'app-extra-work-page',
  standalone: true,
  imports: [
    NgFor, NgIf, NgClass, FormsModule, 
    LucideAngularModule, DatePipe, 
    AvatarColorPipe, InitialsPipe
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>Demandes de Travail Supplémentaire</h2>
        <div class="subtitle">Consultez les heures supplémentaires et interventions des employés</div>
      </div>
    </div>

    <!-- KPI Statistics -->
    <section class="stats-grid" style="grid-template-columns:repeat(4,1fr); margin-bottom:24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-purple-bg);">
          <i-lucide [name]="Clock" [size]="22" color="var(--color-purple)"></i-lucide>
        </div>
        <div>
          <p class="value" style="color:var(--color-purple)">{{ stats.total }}</p>
          <div class="muted" style="margin-top:4px;">Total</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-orange-bg);">
          <i-lucide [name]="Hourglass" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div>
          <p class="value value-orange">{{ stats.pending }}</p>
          <div class="muted" style="margin-top:4px;">En attente</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-green-bg);">
          <i-lucide [name]="CheckCircle" [size]="22" color="var(--color-green)"></i-lucide>
        </div>
        <div>
          <p class="value value-green">{{ stats.approved }}</p>
          <div class="muted" style="margin-top:4px;">Approuvées</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-red-bg);">
          <i-lucide [name]="XCircle" [size]="22" color="var(--color-red)"></i-lucide>
        </div>
        <div>
          <p class="value value-red">{{ stats.refused }}</p>
          <div class="muted" style="margin-top:4px;">Refusées</div>
        </div>
      </article>
    </section>

    <!-- Filters & Tabs -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
      <div class="tabs-container" style="margin-bottom:0;">
        <button 
          *ngFor="let tab of statusTabs" 
          class="tab-btn" 
          [class.active]="activeTab === tab.value"
          (click)="setActiveTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div style="display:flex; align-items:center; gap:10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 2px 10px; min-width: 250px;">
        <i-lucide [name]="UsersIcon" [size]="18" color="var(--text-light)"></i-lucide>
        <select [(ngModel)]="employeeFilter" (change)="persistFilters()" style="border:none; background:transparent; width:100%; outline:none; color:var(--text-main); font-family:inherit; font-size:14px; cursor:pointer; padding: 8px 0;">
          <option value="all">Tous les employés</option>
          <option *ngFor="let emp of employees" [value]="emp.id">
            {{ emp.prenom }} {{ emp.nom }}
          </option>
        </select>
      </div>
    </div>

    <!-- Requests Listing -->
    <div class="kpi-grid" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
      <div *ngFor="let req of getFilteredRequests(); trackBy: trackByRequestId" class="card" style="padding:20px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="avatar" [ngClass]="(req.email || req.employeNom) | avatarColor : req.avatar">
              {{ req.employeNom | initials }}
            </div>
            <div>
              <div style="font-weight:600; font-size:14px; color:var(--text-main);">{{ req.employeNom }}</div>
              <div class="muted" style="font-size:12px; display:flex; align-items:center; gap:4px; margin-top:2px;">
                <i-lucide [name]="CalendarIcon" [size]="12"></i-lucide> 
                {{ req.dateTravail | date:'dd/MM/yyyy' }}
                <span style="margin-left: 8px; font-weight: 600; color: var(--color-purple);">({{ req.nbHeures }}h)</span>
              </div>
              <div class="muted" style="font-size:11px; margin-top: 2px;">
                Soumis le {{ req.dateCreation | date:'dd/MM/yyyy HH:mm' }}
              </div>
            </div>
          </div>
          <span class="chip" [ngClass]="getStatusChipClass(req.statut)">
            {{ getStatusLabel(req.statut) }}
          </span>
        </div>
        
        <p style="font-size:13px; color:var(--text-muted); margin:0; line-height:1.5; background:var(--bg-app); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
          "{{ req.motif }}"
        </p>
        
        <div style="display:flex; justify-content:flex-end; gap:8px;" *ngIf="req.statut === 'EN_ATTENTE'">
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size:12px;" (click)="updateRequestStatus(req, 'REFUSEE')">Refuser</button>
          <button class="btn btn-primary" style="padding: 6px 12px; font-size:12px;" (click)="updateRequestStatus(req, 'APPROUVEE')">Approuver</button>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div *ngIf="getFilteredRequests().length === 0" style="text-align:center; padding:40px; color:var(--text-muted);">
      <i-lucide [name]="InboxIcon" [size]="48" color="var(--border-color)" style="margin-bottom:16px;"></i-lucide>
      <p>Aucune demande ne correspond à ce filtre.</p>
    </div>
  `
})
export class ExtraWorkPageComponent implements OnInit, OnDestroy {
  // Lucide Icons mapping
  protected readonly Clock = Clock;
  protected readonly Hourglass = Hourglass;
  protected readonly CheckCircle = CheckCircle;
  protected readonly InboxIcon = Inbox;
  protected readonly CalendarIcon = Calendar;
  protected readonly XCircle = XCircle;
  protected readonly UsersIcon = Users;

  // State Management
  activeTab = localStorage.getItem('extrawork_tab') || 'all';
  employeeFilter: string | number = localStorage.getItem('extrawork_emp') || 'all';
  
  employees: any[] = [];
  requests: any[] = [];
  
  readonly statusTabs = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Approuvées', value: 'APPROUVEE' },
    { label: 'Refusées', value: 'REFUSEE' }
  ];

  private pollingTimer: any;

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchInitialData();
    this.initPolling();
  }

  ngOnDestroy(): void {
    this.terminatePolling();
  }

  // --- Data Loading & Polling ---

  private fetchInitialData(): void {
    // Fetch employees for filter dropdown
    this.api.getEmployees().subscribe(res => {
      this.employees = res || [];
      this.cdr.detectChanges();
    });
    
    // Initial fetch for requests
    this.refreshRequests();
  }

  private initPolling(): void {
    this.pollingTimer = setInterval(() => this.refreshRequests(), 5000);
  }

  private terminatePolling(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  private refreshRequests(): void {
    this.api.getAllExtraWork().subscribe(res => {
      const processed = this.sanitizeAndSortRequests(res);
      
      // Only update if data has actually changed to avoid unnecessary UI flickering
      if (JSON.stringify(processed) !== JSON.stringify(this.requests)) {
        this.requests = processed;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cleans up raw API response and sorts requests by priority (Pending first, then by date).
   */
  private sanitizeAndSortRequests(rawRes: any[]): any[] {
    const list = (rawRes || []).map(r => ({
      ...r,
      dateCreation: this.parseServerDate(r.dateCreation),
      dateTravail: this.parseServerDate(r.dateTravail)
    }));

    return list.sort((a, b) => {
      // Pending always on top
      if (a.statut === 'EN_ATTENTE' && b.statut !== 'EN_ATTENTE') return -1;
      if (a.statut !== 'EN_ATTENTE' && b.statut === 'EN_ATTENTE') return 1;
      // Then sorted by newest creation date
      return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
    });
  }

  /**
   * Helper to parse dates coming from backend (could be ISO string or Array).
   */
  private parseServerDate(date: any): Date {
    if (Array.isArray(date)) {
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0);
    }
    return date ? new Date(date) : new Date();
  }

  // --- Logic & Filtering ---

  get stats() {
    const list = this.getFilteredRequests();
    return {
      total: list.length,
      pending: list.filter(r => r.statut === 'EN_ATTENTE').length,
      approved: list.filter(r => r.statut === 'APPROUVEE').length,
      refused: list.filter(r => r.statut === 'REFUSEE').length
    };
  }

  getFilteredRequests(): any[] {
    return this.requests.filter(r => {
      const isCorrectStatus = this.activeTab === 'all' || r.statut === this.activeTab;
      const isCorrectEmployee = this.employeeFilter === 'all' || Number(r.employeId) === Number(this.employeeFilter);
      
      // Security/UX measure: Hide requests that were just created (grace period of 1 minute)
      const isOutsideGracePeriod = !this.isInGracePeriod(r.dateCreation, r.statut);
      
      return isCorrectStatus && isCorrectEmployee && isOutsideGracePeriod;
    });
  }

  private isInGracePeriod(dateCreation: any, status: string): boolean {
    if (status !== 'EN_ATTENTE' || !dateCreation) return false;
    const now = Date.now();
    const created = new Date(dateCreation).getTime();
    return (now - created) <= 60000;
  }

  // --- User Actions ---

  setActiveTab(value: string): void {
    this.activeTab = value;
    localStorage.setItem('extrawork_tab', value);
  }

  persistFilters(): void {
    localStorage.setItem('extrawork_emp', String(this.employeeFilter));
  }

  updateRequestStatus(req: any, status: 'APPROUVEE' | 'REFUSEE'): void {
    this.api.updateExtraWorkStatus(req.id, status as any).subscribe({
      next: () => {
        req.statut = status;
        this.cdr.detectChanges();
      },
      error: (err) => alert(err.error?.message || 'Erreur lors de la mise à jour')
    });
  }

  // --- UI Helpers ---

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En Attente',
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

  trackByRequestId(_: number, item: any): number {
    return item.id;
  }
}
