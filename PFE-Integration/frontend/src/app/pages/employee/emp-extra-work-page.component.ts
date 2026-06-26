import { Component, OnInit, signal, computed, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { 
  LucideAngularModule, 
  PlusCircle, 
  Clock, 
  Hourglass, 
  CheckCircle, 
  Briefcase, 
  X, 
  Send, 
  Inbox,
  XCircle,
  Filter 
} from 'lucide-angular';

/**
 * Employee portal component for declaring and tracking extra work hours.
 * Uses Angular signals for reactive state management.
 */
@Component({
  selector: 'app-emp-extra-work-page',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Travail Supplémentaire</h2>
        <div class="subtitle">Déclaration et suivi de vos heures (Mode API)</div>
      </div>
      <button class="btn btn-primary" (click)="openModal()">
        <i-lucide [name]="PlusCircle" [size]="18" color="#fff"></i-lucide>
        Nouvelle demande
      </button>
    </div>

    <!-- KPI Statistics -->
    <section class="stats-grid" style="grid-template-columns:repeat(4,1fr); margin-bottom:24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-purple-bg);">
          <i-lucide [name]="Clock" [size]="22" color="var(--color-purple)"></i-lucide>
        </div>
        <div>
          <p class="value" style="color:var(--color-purple)">{{ stats().total }}</p>
          <div class="muted" style="margin-top:4px;">Total</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-orange-bg);">
          <i-lucide [name]="Hourglass" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div>
          <p class="value value-orange">{{ stats().pending }}</p>
          <div class="muted" style="margin-top:4px;">En attente</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-green-bg);">
          <i-lucide [name]="CheckCircle" [size]="22" color="var(--color-green)"></i-lucide>
        </div>
        <div>
          <p class="value value-green">{{ stats().approved }}</p>
          <div class="muted" style="margin-top:4px;">Approuvées</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-red-bg);">
          <i-lucide [name]="XCircle" [size]="22" color="var(--color-red)"></i-lucide>
        </div>
        <div>
          <p class="value value-red">{{ stats().refused }}</p>
          <div class="muted" style="margin-top:4px;">Refusées</div>
        </div>
      </article>
    </section>

    <!-- Tabs & Date Filters -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div class="tab-bar" style="margin-bottom:0;">
        <button *ngFor="let t of statusTabs" 
                class="tab-btn" 
                [class.active]="tab() === t.value" 
                (click)="setActiveTab(t.value)">{{ t.label }}</button>
      </div>

      <!-- Date Filter -->
      <div style="display:flex; align-items:center; gap:8px;">
        <i-lucide [name]="Filter" [size]="14" color="var(--text-muted)"></i-lucide>
        <span style="font-size:13px; color:var(--text-muted); font-weight:500;">Filtrer :</span>
        <select [ngModel]="selectedYear()" (ngModelChange)="selectedYear.set($event)" class="date-filter-select">
          <option [ngValue]="null">Toutes les années</option>
          <option *ngFor="let y of availableYears()" [ngValue]="y">{{ y }}</option>
        </select>
        
        <select [ngModel]="selectedMonth()" (ngModelChange)="selectedMonth.set($event)" 
                [disabled]="!selectedYear()" [style.opacity]="!selectedYear() ? '0.5' : '1'" 
                class="date-filter-select">
          <option [ngValue]="null">Tous les mois</option>
          <option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option>
        </select>
      </div>
    </div>

    <!-- Requests List -->
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:16px;">
      <div *ngFor="let r of filteredList(); trackBy: trackByRequestId" class="card" style="padding:20px; animation: fadeIn 0.4s ease-out;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="display:flex;gap:12px;align-items:center;">
            <div class="emp-stat-icon" style="background:var(--color-purple-bg);width:44px;height:44px;">
              <i-lucide [name]="Briefcase" [size]="20" color="var(--color-purple)"></i-lucide>
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;">{{ r.dateTravail | date:'dd/MM/yyyy' }} ({{ r.nbHeures }}h)</div>
              <div class="muted" style="font-size:12px;">Soumis le {{ r.dateCreation | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
          </div>
          <span class="chip" 
                [class.chip-orange]="r.statut==='EN_ATTENTE'" 
                [class.chip-green]="r.statut==='APPROUVEE'" 
                [class.chip-red]="r.statut==='REFUSEE'"
                [style.background]="r.statut==='ANNULEE' ? '#f1f5f9' : null"
                [style.color]="r.statut==='ANNULEE' ? '#64748b' : null"
                [style.border]="r.statut==='ANNULEE' ? '1px solid #e2e8f0' : null">
             {{ getStatusLabel(r.statut) }}
          </span>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin:14px 0 0;line-height:1.6;background:var(--bg-app);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--border-light);">"{{ r.motif }}"</p>
        <div *ngIf="r.statut==='EN_ATTENTE'" style="margin-top:12px;display:flex;justify-content:flex-end;">
          <button *ngIf="canCancel(r.dateCreation)" class="btn btn-secondary" style="padding:6px 14px;font-size:12px;" (click)="cancelRequest(r)">
            <i-lucide [name]="XIcon" [size]="14" color="var(--color-red)"></i-lucide> Annuler
          </button>
          <div *ngIf="!canCancel(r.dateCreation)" style="text-align:right;">
            <span class="muted" style="font-size:11px;">Délai d'annulation (60s) dépassé.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="loading" style="text-align:center;padding:40px;">
      <div class="muted">Chargement de vos demandes...</div>
    </div>

    <!-- Empty State -->
    <div *ngIf="!loading && filteredList().length === 0" style="text-align:center;padding:60px;color:var(--text-muted);">
      <i-lucide [name]="Inbox" [size]="48" color="var(--border-color)"></i-lucide>
      <p style="font-weight:600;margin-top:16px;">Aucune donnée trouvée en base pour cet employé.</p>
    </div>

    <!-- Modal: New Request -->
    <div class="modal-overlay" *ngIf="showModal">
      <form class="modal-card" (ngSubmit)="submitRequest()" style="max-width:500px;">
        <h2>Déclarer des Heures</h2>
        <p class="muted">Saisissez les détails de vos heures supplémentaires.</p>
        <div>
          <label>Date du travail</label>
          <input type="date" name="d" [(ngModel)]="form.dateTravail" (change)="validateDate()" required />
          <div *ngIf="dateErrorMessage()" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ dateErrorMessage() }}
          </div>
        </div>
        <div>
          <label>Heures effectuées</label>
          <input type="number" name="h" [(ngModel)]="form.nbHeures" (change)="validateHours()" min="1" max="12" required placeholder="Ex: 4"/>
          <div *ngIf="hoursErrorMessage()" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ hoursErrorMessage() }}
          </div>
        </div>
        <div>
          <label>Motif / Mission</label>
          <textarea name="m" rows="4" [(ngModel)]="form.motif" (input)="validateMotif()" placeholder="Ex: Migration serveurs, support client..."></textarea>
          <div *ngIf="motifErrorMessage()" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ motifErrorMessage() }}
          </div>
        </div>
        
        <div *ngIf="globalErrorMessage()" style="color:var(--color-red); font-size:12px; margin-top:8px; font-weight:500;">
          {{ globalErrorMessage() }}
        </div>

        <div class="btn-row" style="justify-content:space-between;margin-top:24px;">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting">
            <i-lucide [name]="Send" [size]="16" color="#fff"></i-lucide> 
            {{ submitting ? 'Envoi...' : 'Soumettre' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .date-filter-select { height:36px; padding:0 30px 0 12px; font-size:13px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); outline:none; cursor:pointer; }
  `]
})
export class EmpExtraWorkPageComponent implements OnInit, OnDestroy {
  // Lucide Icons
  protected readonly PlusCircle = PlusCircle;
  protected readonly Clock = Clock;
  protected readonly Hourglass = Hourglass;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Briefcase = Briefcase;
  protected readonly XIcon = X;
  protected readonly Send = Send;
  protected readonly Inbox = Inbox;
  protected readonly XCircle = XCircle;
  protected readonly Filter = Filter;

  // Constant Data
  readonly months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  readonly statusTabs = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Approuvées', value: 'APPROUVEE' },
    { label: 'Refusées', value: 'REFUSEE' },
    { label: 'Annulées', value: 'ANNULEE' }
  ];

  // State Management
  showModal = false; 
  submitting = false;
  loading = false;
  employeId: number | null = null;

  tab = signal('all');
  reqs = signal<any[]>([]);
  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);

  // Form State
  form = { dateTravail: '', nbHeures: 0, motif: '' };

  // Validation Signals
  globalErrorMessage = signal<string | null>(null);
  dateErrorMessage = signal<string | null>(null);
  hoursErrorMessage = signal<string | null>(null);
  motifErrorMessage = signal<string | null>(null);

  private pollingTimer: any;

  // Computed Signals: Reactive Filtering & Statistics
  filteredList = computed(() => {
    const list = this.reqs();
    const currentTab = this.tab();
    const yr = this.selectedYear();
    const mo = this.selectedMonth();
    
    return list.filter(r => {
      const matchStatus = currentTab === 'all' || r.statut === currentTab;
      const matchYear = yr === null || new Date(r.dateCreation).getFullYear() === yr;
      const matchMonth = (yr === null || mo === null) || (new Date(r.dateCreation).getMonth() + 1) === mo;
      return matchStatus && matchYear && matchMonth;
    });
  });

  availableYears = computed(() => {
    const years = this.reqs().map(r => new Date(r.dateCreation).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  });

  stats = computed(() => {
    const list = this.reqs();
    return {
      total: list.length,
      pending: list.filter(r => (r.statut === 'EN_ATTENTE' || r.statut === 'OUVERT')).length,
      approved: list.filter(r => r.statut === 'APPROUVEE').length,
      refused: list.filter(r => (r.statut === 'REFUSEE' || r.statut === 'REJETEE')).length
    };
  });

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resolveEmployeeAndLoad();
  }

  ngOnDestroy(): void {
    this.terminatePolling();
  }

  // --- Data Loading & Polling ---

  private resolveEmployeeAndLoad(): void {
    const storedId = localStorage.getItem('hr_employeId');
    const storedEmail = localStorage.getItem('hr_email');

    if (storedId) {
      this.employeId = Number(storedId);
      this.refreshRequests();
      this.initPolling();
    } else {
      this.loading = true;
      this.api.getEmployees().subscribe({
        next: (emps) => {
          if (emps && emps.length > 0) {
            const currentEmp = emps.find(e => e.email === storedEmail) || emps[0];
            this.employeId = currentEmp.id;
            localStorage.setItem('hr_employeId', String(this.employeId));
            this.refreshRequests();
            this.initPolling();
          }
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  private initPolling(): void {
    this.pollingTimer = setInterval(() => {
      if (this.employeId) this.refreshRequests();
    }, 5000);
  }

  private terminatePolling(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  private refreshRequests(): void {
    if (!this.employeId) return;
    this.api.getEmployeeExtraWork(this.employeId).subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          const processed = this.sanitizeAndSortRequests(res);
          this.reqs.set(processed);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Parses backend dates (ISO string or Array format) and sorts by newest first.
   */
  private sanitizeAndSortRequests(rawList: any[]): any[] {
    const mapped = rawList.map(r => ({
      ...r,
      dateTravail: this.parseServerDate(r.dateTravail),
      dateCreation: this.parseServerDate(r.dateCreation)
    }));
    return mapped.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
  }

  private parseServerDate(date: any): Date {
    if (Array.isArray(date)) {
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0);
    }
    return date ? new Date(date) : new Date();
  }

  // --- User Actions ---

  setActiveTab(value: string): void {
    this.tab.set(value);
  }

  canCancel(dateCreation: any): boolean {
    if (!dateCreation) return false;
    return (Date.now() - new Date(dateCreation).getTime()) <= 60000;
  }

  cancelRequest(r: any): void {
    if (!this.canCancel(r.dateCreation)) {
      alert("Le délai d'annulation de 60 secondes est dépassé.");
      if (this.employeId) this.refreshRequests();
      return;
    }

    if (confirm('Voulez-vous annuler cette demande ?')) {
       this.api.updateExtraWorkStatus(r.id, 'ANNULEE').subscribe({
         next: () => {
           this.reqs.update(items => items.map(item => item.id === r.id ? { ...item, statut: 'ANNULEE' } : item));
           this.cdr.detectChanges();
         },
         error: () => alert('Erreur lors de l\'annulation')
       });
    }
  }

  // --- Modal Management ---

  openModal(): void {
    this.showModal = true;
    this.clearAllErrors();
  }

  closeModal(): void {
    this.showModal = false;
    this.form = { dateTravail: '', nbHeures: 0, motif: '' };
    this.clearAllErrors();
  }

  private clearAllErrors(): void {
    this.globalErrorMessage.set(null);
    this.dateErrorMessage.set(null);
    this.hoursErrorMessage.set(null);
    this.motifErrorMessage.set(null);
  }

  // --- Validation ---
  
  validateDate(): void {
    this.dateErrorMessage.set(null);
    if (!this.form.dateTravail) {
      this.dateErrorMessage.set('Veuillez remplir la date.');
      return;
    }

    const selectedDate = new Date(this.form.dateTravail);
    selectedDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate <= today) {
      this.dateErrorMessage.set('La date doit être strictement supérieure à aujourd\'hui.');
    }
  }

  validateHours(): void {
    this.hoursErrorMessage.set(null);
    if (this.form.nbHeures === null || this.form.nbHeures === undefined || this.form.nbHeures <= 0) {
      this.hoursErrorMessage.set('Le nombre d\'heures doit être supérieur à 0.');
    }
  }

  validateMotif(): void {
    this.motifErrorMessage.set(null);
    if (!this.form.motif || this.form.motif.trim().length === 0) {
      this.motifErrorMessage.set('Le motif est obligatoire pour soumettre la demande.');
    }
  }

  // --- Form Submission ---

  submitRequest(): void {
    this.globalErrorMessage.set(null);
    
    // Trigger all validations
    this.validateDate();
    this.validateHours();
    this.validateMotif();

    if (this.dateErrorMessage() || this.hoursErrorMessage() || this.motifErrorMessage()) {
      return;
    }

    if (!this.employeId) return;
    this.submitting = true;

    this.api.createExtraWork({
      employeId: this.employeId,
      dateTravail: this.form.dateTravail,
      nbHeures: this.form.nbHeures,
      motif: this.form.motif,
      statut: 'EN_ATTENTE'
    }).subscribe({
      next: (res) => {
        this.reqs.update(items => [res, ...items]);
        this.submitting = false;
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: () => {
        this.submitting = false;
        alert('Erreur lors de la soumission de la demande.');
      }
    });
  }

  // --- UI Helpers ---

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En Attente',
      'APPROUVEE': 'Approuvée',
      'REFUSEE': 'Refusée',
      'ANNULEE': 'Annulée'
    };
    return labels[status] || status;
  }

  trackByRequestId(_: number, item: any): number {
    return item.id || 0;
  }
}
