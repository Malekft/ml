import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { TicketDto, StatutDemande } from '../core/api.types';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';
import { 
  LucideAngularModule, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  X,
  Camera,
  Users,
  Download
} from 'lucide-angular';

interface TicketView {
  id: number;
  titre: string;
  description: string;
  dateCreation: string;
  employeNom: string;
  categorie: string;
  priorite: string;
  statut: string;
  employeId: number;
  fileUrl?: string;
  localId?: number;
  avatar?: string;
  email?: string;
}

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, LucideAngularModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Gestion des Tickets</h2>
        <div class="subtitle">Support et suivi des demandes</div>
      </div>
    </div>

    <!-- KPI Cards -->
    <section class="stats-grid" style="margin-bottom: 24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-blue-bg);">
          <i-lucide [name]="Ticket" [size]="22" color="var(--color-blue)"></i-lucide>
        </div>
        <div>
          <p class="value value-blue">{{ filteredTickets().length }}</p>
          <div class="muted" style="margin-top:4px;">Total tickets</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-orange-bg);">
          <i-lucide [name]="Clock" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div>
          <p class="value value-orange">{{ countStatus('EN_ATTENTE') + countStatus('IN_PROGRESS') }}</p>
          <div class="muted" style="margin-top:4px;">En attente / En cours</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-green-bg);">
          <i-lucide [name]="CheckCircle" [size]="22" color="var(--color-green)"></i-lucide>
        </div>
        <div>
          <p class="value value-green">{{ countStatus('RESOLU') }}</p>
          <div class="muted" style="margin-top:4px;">Résolus</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-gray-bg);">
          <i-lucide [name]="X" [size]="22" color="var(--color-gray)"></i-lucide>
        </div>
        <div>
          <p class="value value-gray">{{ countStatus('FERME') }}</p>
          <div class="muted" style="margin-top:4px;">Fermés</div>
        </div>
      </article>
    </section>

    <!-- Search and Filter -->
    <section class="card" style="margin-bottom: 20px;">
      <div class="search-row" style="display:flex; align-items:center; gap:12px;">
        <div class="search-input-wrapper" style="flex:1;">
          <i-lucide [name]="Search" [size]="18" class="search-icon-inner"></i-lucide>
          <input
            class="with-icon"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher un ticket..."
            style="width:100%;"
          />
        </div>

        <div style="display:flex; align-items:center; gap:10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 2px 10px; min-width: 200px;">
          <i-lucide [name]="UsersIcon" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="employeeFilter" style="border:none; background:transparent; width:100%; outline:none; color:var(--text-main); font-family:inherit; font-size:14px; cursor:pointer; padding: 8px 0;">
            <option value="all">Tous les employés</option>
            <option *ngFor="let emp of employees" [value]="emp.id">
              {{ emp.prenom }} {{ emp.nom }}
            </option>
          </select>
        </div>

        <select [(ngModel)]="priorityFilter" style="min-width:150px;">
          <option value="all">Toutes priorités</option>
          <option value="URGENTE">Urgente</option>
          <option value="HAUTE">Haute</option>
          <option value="MOYENNE">Moyenne</option>
          <option value="BASSE">Basse</option>
        </select>
        <select [(ngModel)]="statusFilter" style="min-width:140px;">
          <option value="all">Tous statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLU">Résolu</option>
          <option value="FERME">Fermé</option>
        </select>
      </div>
    </section>

    <!-- Table -->
    <section class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Employé</th>
            <th>Catégorie</th>
            <th>Priorité</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of filteredTickets()">
            <td>
              <div>
                <div style="font-weight:600;">#{{ t.localId || t.id }} - {{ t.titre }}</div>
                <div class="muted" style="font-size:12px;">{{ t.description }}</div>
                <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
                  <div class="muted" style="font-size:11px;">Créé: {{ t.dateCreation }}</div>
                  <a *ngIf="t.fileUrl" [href]="getFullUrl(t.fileUrl)" target="_blank" class="link-blue" style="font-size:11px; display:flex; align-items:center; gap:4px;" title="Visualiser">
                    <i-lucide [name]="Camera" [size]="12"></i-lucide>
                    Voir
                  </a>
                  <a *ngIf="t.fileUrl" [href]="getDownloadUrl(t.fileUrl)" class="link-blue" style="font-size:11px; display:flex; align-items:center; gap:4px;" title="Télécharger">
                    <i-lucide [name]="Download" [size]="12"></i-lucide>
                  </a>
                </div>
              </div>
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="avatar avatar-sm" [ngClass]="(t.email || t.employeNom) | avatarColor : t.avatar">{{ t.employeNom | initials }}</div>
                <span>{{ t.employeNom }}</span>
              </div>
            </td>
            <td>{{ t.categorie }}</td>
            <td>
              <span class="chip chip-red" *ngIf="t.priorite === 'URGENTE'">Urgente</span>
              <span class="chip chip-orange" *ngIf="t.priorite === 'HAUTE'">Haute</span>
              <span class="chip chip-blue" *ngIf="t.priorite === 'MOYENNE'">Moyenne</span>
              <span class="chip chip-green" *ngIf="t.priorite === 'BASSE'">Basse</span>
            </td>
            <td>
              <span class="chip chip-blue" *ngIf="t.statut === 'EN_ATTENTE'">En attente</span>
              <span class="chip chip-purple" *ngIf="t.statut === 'IN_PROGRESS'">En cours</span>
              <span class="chip chip-green" *ngIf="t.statut === 'RESOLU'">Résolu</span>
              <span class="chip chip-gray" *ngIf="t.statut === 'FERME'">Fermé</span>
              <span class="chip chip-orange" *ngIf="t.statut === 'ANNULEE'">Annulé</span>
            </td>
            <td>
              <div style="display:flex; gap:8px;">
                <button *ngIf="t.statut === 'EN_ATTENTE'" 
                        class="btn btn-secondary" 
                        style="padding: 6px 12px; font-size: 12px;" 
                        (click)="startProgress(t.id)">
                  <i-lucide [name]="CheckCircle" [size]="14" color="var(--color-purple)"></i-lucide>
                  Prendre en charge
                </button>
                <button *ngIf="t.statut === 'IN_PROGRESS'" 
                        class="btn btn-secondary" 
                        style="padding: 6px 12px; font-size: 12px;" 
                        (click)="resolveTicket(t.id)">
                  <i-lucide [name]="CheckCircle" [size]="14" color="var(--color-green)"></i-lucide>
                  Résoudre
                </button>
                <button *ngIf="t.statut === 'RESOLU'" 
                        class="btn btn-secondary" 
                        style="padding: 6px 12px; font-size: 12px;" 
                        (click)="closeTicket(t.id)">
                  <i-lucide [name]="X" [size]="14" color="var(--color-gray)"></i-lucide>
                  Clôturer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `
})
/**
 * Admin portal component for managing all employee tickets.
 * Handles status workflow: EN_ATTENTE → IN_PROGRESS → RESOLU → FERME.
 */
export class TicketsPageComponent implements OnInit, OnDestroy {
  // Lucide Icons
  protected readonly Ticket = Ticket;
  protected readonly Clock = Clock;
  protected readonly CheckCircle = CheckCircle;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Search = Search;
  protected readonly X = X;
  protected readonly Camera = Camera;
  protected readonly UsersIcon = Users;
  protected readonly Download = Download;

  // Component State
  private pollingTimer: any;
  searchQuery = '';
  priorityFilter = 'all';
  statusFilter = 'all';
  employeeFilter: any = 'all';
  showModal = false;
  selectedFile: File | null = null;
  employees: any[] = [];

  form = {
    titre: '',
    description: '',
    categorie: 'IT',
    priorite: 'MOYENNE'
  };

  ticketViews: TicketView[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}


  getFullUrl(path?: string | null): string { return this.api.getFullUrl(path); }
  getDownloadUrl(path?: string | null): string { return this.api.getDownloadUrl(path); }

  ngOnInit(): void {
    this.api.getEmployees().subscribe(res => this.employees = res || []);
    this.refreshTickets();
    this.initPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  // --- Data Loading & Polling ---

  private initPolling(): void {
    this.pollingTimer = setInterval(() => this.refreshTickets(), 5000);
  }

  /** Loads tickets, filters out those in the 60s grace period, and maps to TicketView. */
  private refreshTickets(): void {
    this.api.getTickets().subscribe({
      next: (res) => {
        this.ticketViews = (res || [])
          .filter(t => !(t.statut === 'EN_ATTENTE' && this.isInGracePeriod(t.dateCreation)))
          .map(t => ({
            id: t.id,
            titre: t.titre,
            description: t.description || '',
            dateCreation: t.dateCreation,
            employeNom: t.employeNom,
            categorie: t.categorie || 'Support',
            priorite: t.priorite,
            statut: t.statut,
            employeId: t.employeId,
            fileUrl: t.fileUrl,
            avatar: (t as any).avatar,
            email: (t as any).email
          }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticketViews = [];
        this.cdr.detectChanges();
      }
    });
  }

  // --- Modal (unused in admin but kept for parity) ---
  openModal(): void { this.showModal = true; }
  closeModal(): void {
    this.showModal = false;
    this.form = { titre: '', description: '', categorie: 'IT', priorite: 'MOYENNE' };
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submitTicket(): void {
    if (!this.form.titre || !this.form.description) return;
    this.api.createTicket({
      employeId: 1,
      titre: this.form.titre,
      description: this.form.description,
      categorie: this.form.categorie,
      priorite: this.form.priorite as any
    }).subscribe({
      next: () => { this.closeModal(); this.refreshTickets(); },
      error: (err) => alert(err.error?.message || 'Erreur lors de la création du ticket')
    });
  }

  // --- KPI & Filtering ---

  countStatus(s: string): number {
    return this.filteredTickets().filter(t => t.statut === s).length;
  }

  filteredTickets(): TicketView[] {
    const query = this.searchQuery.trim().toLowerCase();
    const filtered = this.ticketViews.filter(t => {
      const textMatch = !query || t.titre.toLowerCase().includes(query) || t.employeNom.toLowerCase().includes(query);
      const statusMatch = this.statusFilter === 'all' || t.statut === this.statusFilter;
      const priorityMatch = this.priorityFilter === 'all' || t.priorite === this.priorityFilter;
      const employeeMatch = this.employeeFilter === 'all' || Number(t.employeId) === Number(this.employeeFilter);
      return textMatch && statusMatch && priorityMatch && employeeMatch;
    });

    // Sort ascending to assign sequential IDs, then reverse for display
    const sorted = [...filtered].sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime());
    sorted.forEach((t, i) => t.localId = i + 1);
    return sorted.reverse();
  }

  // --- Status Workflow ---

  startProgress(id: number): void {
    if (confirm('Voulez-vous marquer ce ticket comme "En cours" ?')) {
      this.updateStatus(id, 'IN_PROGRESS');
    }
  }

  resolveTicket(id: number): void {
    if (confirm('Voulez-vous marquer ce ticket comme résolu ?')) {
      this.updateStatus(id, 'RESOLU');
    }
  }

  closeTicket(id: number): void {
    if (confirm('Voulez-vous clôturer ce ticket ?')) {
      this.updateStatus(id, 'FERME');
    }
  }

  private updateStatus(id: number, status: StatutDemande): void {
    this.api.updateTicketStatus(id, status).subscribe({
      next: () => this.refreshTickets(),
      error: () => {
        this.ticketViews = this.ticketViews.map(t =>
          t.id === id ? { ...t, statut: status } : t
        );
      }
    });
  }

  /** Checks if a ticket is within the 60s grace period after creation (hidden from admin). */
  private isInGracePeriod(dateCreation: any): boolean {
    if (!dateCreation) return false;
    return (Date.now() - new Date(dateCreation).getTime()) <= 60000;
  }
}
