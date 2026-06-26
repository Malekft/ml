import { Component, OnInit, signal, computed, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { 
  LucideAngularModule, 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Plus,
  Send, 
  Camera,
  X,
  Download
} from 'lucide-angular';

@Component({
  selector: 'app-emp-tickets-page',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Mes Tickets</h2>
        <div class="subtitle">Créez et suivez vos demandes de support</div>
      </div>
      <button class="btn btn-primary" (click)="openModal()">
        <i-lucide [name]="Plus" [size]="18" color="#ffffff"></i-lucide>
        Nouveau ticket
      </button>
    </div>

    <!-- Stats -->
    <section class="stats-grid" style="margin-bottom:24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-blue-bg);">
          <i-lucide [name]="TicketIcon" [size]="22" color="var(--color-blue)"></i-lucide>
        </div>
        <div>
          <p class="value value-blue">{{ stats().total }}</p>
          <div class="muted" style="margin-top:4px;">Total tickets</div>
        </div>
      </article>
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-orange-bg);">
          <i-lucide [name]="Clock" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div>
          <p class="value value-orange">{{ stats().pending }}</p>
          <div class="muted" style="margin-top:4px;">En cours / Attente</div>
        </div>
      </article>
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-green-bg);">
          <i-lucide [name]="CheckCircle" [size]="22" color="var(--color-green)"></i-lucide>
        </div>
        <div>
          <p class="value value-green">{{ stats().closed }}</p>
          <div class="muted" style="margin-top:4px;">Résolus / Fermés</div>
        </div>
      </article>
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-red-bg);">
          <i-lucide [name]="AlertTriangle" [size]="22" color="var(--color-red)"></i-lucide>
        </div>
        <div>
          <p class="value value-red">{{ stats().urgent }}</p>
          <div class="muted" style="margin-top:4px;">Urgents</div>
        </div>
      </article>
    </section>

    <!-- Search & Filter -->
    <div class="card" style="margin-bottom:20px;">
      <div class="search-row">
        <div class="search-input-wrapper">
          <i-lucide [name]="Search" [size]="18" class="search-icon-inner"></i-lucide>
          <input class="with-icon" 
                 [ngModel]="searchQuery()" 
                 (ngModelChange)="searchQuery.set($event)" 
                 placeholder="Rechercher un ticket..." style="width:100%;" />
        </div>
        <select [ngModel]="priorityFilter()" 
                (ngModelChange)="priorityFilter.set($event)" 
                style="min-width:150px;">
          <option value="all">Toutes priorités</option>
          <option value="URGENTE">Urgente</option>
          <option value="HAUTE">Haute</option>
          <option value="MOYENNE">Moyenne</option>
          <option value="BASSE">Basse</option>
        </select>
        <select [ngModel]="statusFilter()" 
                (ngModelChange)="statusFilter.set($event)" 
                style="min-width:140px;">
          <option value="all">Tous statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLU">Résolu</option>
          <option value="FERME">Fermé</option>
          <option value="ANNULEE">Annulé</option>
        </select>
        
        <!-- Date Filter -->
        <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
          <select [ngModel]="selectedYear()" (ngModelChange)="selectedYear.set($event)" class="date-filter-select">
            <option [ngValue]="null">Toutes les années</option>
            <option *ngFor="let y of availableYears()" [ngValue]="y">{{ y }}</option>
          </select>
          
          <select [ngModel]="selectedMonth()" (ngModelChange)="selectedMonth.set($event)" [disabled]="!selectedYear()" [style.opacity]="!selectedYear() ? '0.5' : '1'" class="date-filter-select">
            <option [ngValue]="null">Tous les mois</option>
            <option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tickets List -->
    <div class="emp-tickets-list">
      <div *ngFor="let t of filteredList(); trackBy: trackByTicketId" class="card emp-ticket-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; gap:14px; align-items:flex-start;">
            <div class="emp-ticket-id">#{{ t.localId }}</div>
            <div>
              <div style="font-weight:700; font-size:15px; color:var(--text-main);">{{ t.titre }}</div>
              <div class="muted" style="font-size:13px; margin-top:4px; line-height:1.5;">{{ t.description }}</div>
              <div style="display:flex; gap:12px; margin-top:10px; flex-wrap:wrap; align-items:center;">
                <a *ngIf="t.fileUrl" [href]="getFullUrl(t.fileUrl)" target="_blank" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Visualiser">
                  <i-lucide [name]="Camera" [size]="14"></i-lucide>
                  Voir
                </a>
                <a *ngIf="t.fileUrl" [href]="getDownloadUrl(t.fileUrl)" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Télécharger">
                  <i-lucide [name]="Download" [size]="14"></i-lucide>
                </a>
              </div>
              <div style="display:flex; gap:8px; margin-top:12px;">
                <span [class]="getStatusChipClass(t.statut)" style="font-size:11px; padding:4px 10px;">{{ getStatusLabel(t.statut) }}</span>
                <span [class]="getPriorityChipClass(t.priorite)" style="font-size:11px; padding:4px 10px;">{{ t.priorite }}</span>
              </div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
            <div class="muted" style="font-size:11px;">{{ t.dateCreation | date:'dd/MM/yyyy HH:mm' }}</div>
            <div *ngIf="t.statut === 'EN_ATTENTE'">
              <button *ngIf="canCancel(t.dateCreation)" 
                      class="btn btn-secondary" 
                      style="padding:6px 12px; font-size:12px; margin-top:8px;"
                      (click)="cancelTicket(t)">
                <i-lucide [name]="X" [size]="12" color="var(--color-red)"></i-lucide>
                Annuler
              </button>
              <div *ngIf="!canCancel(t.dateCreation)" style="margin-top:8px; text-align:right;">
                <span class="muted" style="font-size:11px;">Délai d'annulation (60s) dépassé.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="filteredList().length === 0" style="text-align:center; padding:60px 20px; color:var(--text-muted);">
      <i-lucide [name]="TicketIcon" [size]="48" color="var(--border-color)" style="margin-bottom:16px;"></i-lucide>
      <p style="font-size:16px; font-weight:600;">Aucun ticket trouvé</p>
      <p class="muted">Créez votre premier ticket en cliquant sur le bouton ci-dessus.</p>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal">
      <form class="modal-card" (ngSubmit)="submitTicket()">
        <h2>Ouvrir un ticket</h2>
        <p class="muted">Décrivez votre problème ou votre demande.</p>

        <div>
          <label>Titre du ticket</label>
          <input name="titre" [(ngModel)]="form.titre" (input)="validateTitle()" required placeholder="Ex: Problème d'accès, demande PC..." />
          <div *ngIf="titleError()" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ titleError() }}
          </div>
        </div>

        <div style="display:flex;gap:16px;">
          <div style="flex:1;">
            <label>Catégorie</label>
            <select name="categorie" [(ngModel)]="form.categorie" required>
              <option value="IT">Informatique / IT</option>
              <option value="Matériel">Matériel / Bureau</option>
              <option value="RH">Ressources Humaines</option>
              <option value="Support">Support Général</option>
            </select>
          </div>
          <div style="flex:1;">
            <label>Priorité</label>
            <select name="priorite" [(ngModel)]="form.priorite" required>
              <option value="BASSE">Basse</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        <div>
          <label>Description détaillée</label>
          <textarea name="description" rows="4" [(ngModel)]="form.description" (input)="validateDesc()" required placeholder="Expliquez votre problème ici..."></textarea>
          <div *ngIf="descError()" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ descError() }}
          </div>
        </div>

        <div style="padding:16px; background:var(--bg-app); border:1px dashed var(--border-color); border-radius:var(--radius-sm);">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
            <i-lucide [name]="Camera" [size]="20" color="var(--color-primary)"></i-lucide>
            <span style="font-weight:600;">Ajouter une capture d'écran</span>
            <input type="file" (change)="onFileSelected($event)" style="display:none" accept="image/*,.pdf">
          </label>
          <p *ngIf="selectedFile" style="margin:8px 0 0 30px; color:var(--color-green); font-weight:500;">
            ✓ {{ selectedFile.name }}
          </p>
        </div>

        <div class="btn-row" style="justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting">
            <i-lucide [name]="Send" [size]="16" color="#fff"></i-lucide>
            {{ submitting ? 'Envoi...' : 'Envoyer le ticket' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`.date-filter-select { height:36px; padding:0 30px 0 12px; font-size:13px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); outline:none; cursor:pointer; }`]
})
export class EmpTicketsPageComponent implements OnInit, OnDestroy {
  // Constant Data
  readonly months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  // Lucide Icons
  protected readonly TicketIcon = TicketIcon;
  protected readonly Clock = Clock;
  protected readonly CheckCircle = CheckCircle;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Search = Search;
  protected readonly Plus = Plus;
  protected readonly Send = Send;
  protected readonly Camera = Camera;
  protected readonly X = X;
  protected readonly Download = Download;

  private pollingTimer: any;

  searchQuery = signal('');
  statusFilter = signal('all');
  priorityFilter = signal('all');
  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);
  
  showModal = false;
  submitting = false;
  selectedFile: File | null = null;
  employeId: number | null = null;
  titleError = signal<string | null>(null);
  descError = signal<string | null>(null);

  form = {
    titre: '',
    description: '',
    categorie: 'IT',
    priorite: 'MOYENNE'
  };

  tickets = signal<any[]>([]);

  filteredList = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const yr = this.selectedYear();
    const mo = this.selectedMonth();
    
    return this.tickets().filter(t => {
      const text = q.length === 0 || t.titre.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      const matchStatus = status === 'all' || t.statut === status;
      const matchPriority = priority === 'all' || t.priorite === priority;
      const matchYear = yr === null || new Date(t.dateCreation).getFullYear() === yr;
      const matchMonth = (yr === null || mo === null) || (new Date(t.dateCreation).getMonth() + 1) === mo;
      
      return text && matchStatus && matchPriority && matchYear && matchMonth;
    });
  });

  availableYears = computed(() => {
    const years = this.tickets().map(t => new Date(t.dateCreation).getFullYear());
    return Array.from(new Set(years)).sort((a,b) => b - a);
  });

  stats = computed(() => {
    const list = this.tickets();
    return {
      total: list.length,
      pending: list.filter(t => t.statut === 'EN_ATTENTE' || t.statut === 'IN_PROGRESS').length,
      closed: list.filter(t => t.statut === 'RESOLU' || t.statut === 'FERME').length,
      urgent: list.filter(t => t.priorite === 'URGENTE').length
    };
  });

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  getFullUrl(path?: string | null): string {
    return this.api.getFullUrl(path);
  }

  getDownloadUrl(path?: string | null): string {
    return this.api.getDownloadUrl(path);
  }

  ngOnInit(): void {
    this.resolveEmployeeAndLoad();
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  // --- Data Loading & Polling ---

  private resolveEmployeeAndLoad(): void {
    const id = Number(localStorage.getItem('hr_employeId')) || 0;
    if (id > 0) {
      this.employeId = id;
      this.refreshTickets();
      this.initPolling();
    } else {
      this.api.getEmployees().subscribe(emps => {
        if (emps && emps[0]) {
          this.employeId = emps[0].id;
          localStorage.setItem('hr_employeId', String(this.employeId));
          this.refreshTickets();
          this.initPolling();
        }
      });
    }
  }

  private initPolling(): void {
    this.pollingTimer = setInterval(() => {
      if (this.employeId) this.refreshTickets();
    }, 5000);
  }

  private refreshTickets(): void {
    if (!this.employeId) return;
    this.api.getEmployeeTickets(this.employeId).subscribe({
      next: (res) => {
        if (res && Array.isArray(res)) {
          this.tickets.set(this.sanitizeAndNumberTickets(res));
        } else {
          this.tickets.set([]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.tickets.set([]);
        this.cdr.detectChanges();
      }
    });
  }

  /** Parses backend dates, assigns sequential localId, and sorts newest-first. */
  private sanitizeAndNumberTickets(raw: any[]): any[] {
    const mapped = raw.map(r => ({
      ...r,
      dateCreation: this.parseServerDate(r.dateCreation)
    }));
    // Sort ascending to assign sequential IDs
    mapped.sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime());
    mapped.forEach((t, i) => t.localId = i + 1);
    // Return newest-first for display
    return mapped.reverse();
  }

  private parseServerDate(date: any): Date {
    if (Array.isArray(date)) {
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0);
    }
    return date ? new Date(date) : new Date();
  }

  trackByTicketId(_: number, item: any): number {
    return item.id;
  }

  // --- UI Helpers ---

  getPriorityChipClass(p: string): string {
    const map: Record<string, string> = {
      'URGENTE': 'chip chip-red', 'HAUTE': 'chip chip-orange',
      'MOYENNE': 'chip chip-blue', 'BASSE': 'chip chip-green'
    };
    return map[p] || 'chip chip-green';
  }

  getStatusChipClass(s: string): string {
    const map: Record<string, string> = {
      'EN_ATTENTE': 'chip chip-blue', 'IN_PROGRESS': 'chip chip-purple',
      'RESOLU': 'chip chip-green', 'FERME': 'chip chip-gray', 'ANNULEE': 'chip chip-orange'
    };
    return map[s] || 'chip chip-blue';
  }

  getStatusLabel(s: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente', 'IN_PROGRESS': 'En cours',
      'RESOLU': 'Résolu', 'FERME': 'Fermé', 'ANNULEE': 'Annulé'
    };
    return labels[s] || s;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  // --- Modal Management ---

  openModal(): void {
    this.showModal = true;
    this.clearErrors();
  }

  closeModal(): void {
    this.showModal = false;
    this.form = { titre: '', description: '', categorie: 'IT', priorite: 'MOYENNE' };
    this.selectedFile = null;
    this.clearErrors();
  }

  private clearErrors(): void {
    this.titleError.set(null);
    this.descError.set(null);
  }

  validateTitle(): void {
    this.titleError.set(!this.form.titre || !this.form.titre.trim() ? "Le titre est obligatoire." : null);
  }

  validateDesc(): void {
    this.descError.set(!this.form.description || !this.form.description.trim() ? "La description est obligatoire." : null);
  }

  submitTicket(): void {
    this.validateTitle();
    this.validateDesc();

    if (this.titleError() || this.descError() || !this.employeId) return;
    this.submitting = true;

    if (this.selectedFile) {
      this.api.uploadFile(this.selectedFile).subscribe({
        next: (fileRes) => {
          this.performSubmitTicket(fileRes.url);
        },
        error: () => this.performSubmitTicket()
      });
    } else {
      this.performSubmitTicket();
    }
  }

  private performSubmitTicket(fileUrl?: string): void {
    this.api.createTicket({
      employeId: this.employeId!,
      titre: this.form.titre,
      description: this.form.description,
      categorie: this.form.categorie,
      priorite: this.form.priorite as any,
      fileUrl: fileUrl
    }).subscribe({
      next: (res) => {
        const newTicket = { ...res, dateCreation: this.parseServerDate(res.dateCreation) };
        this.tickets.update(tks => this.sanitizeAndNumberTickets([...tks, newTicket]));
        this.submitting = false;
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: add ticket locally if API fails
        const fallback = {
          id: Date.now(),
          titre: this.form.titre,
          description: this.form.description,
          dateCreation: new Date(),
          categorie: this.form.categorie,
          priorite: this.form.priorite,
          statut: 'EN_ATTENTE'
        };
        this.tickets.update(tks => this.sanitizeAndNumberTickets([...tks, fallback]));
        this.submitting = false;
        this.closeModal();
      }
    });
  }

  canCancel(dateCreation: any): boolean {
    if (!dateCreation) return false;
    return (Date.now() - new Date(dateCreation).getTime()) <= 60000;
  }

  cancelTicket(t: any): void {
    if (!this.canCancel(t.dateCreation)) {
      alert("Le délai d'annulation de 60 secondes est dépassé.");
      this.refreshTickets();
      return;
    }

    if (confirm('Voulez-vous vraiment annuler ce ticket ?')) {
       this.api.updateTicketStatus(t.id, 'ANNULEE').subscribe({
         next: () => {
           this.tickets.update(tks => 
             tks.map(ticket => ticket.id === t.id ? { ...ticket, statut: 'ANNULEE' } : ticket)
           );
           this.cdr.detectChanges();
         },
         error: () => {
           this.tickets.update(tks =>
             tks.map(ticket => ticket.id === t.id ? { ...ticket, statut: 'ANNULEE' } : ticket)
           );
         }
       });
    }
  }
}
