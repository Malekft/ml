import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { EmployeeDto } from '../core/api.types';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';
import {
  LucideAngularModule,
  Clock,
  Search,
  Plus,
  DoorOpen,
  Calendar,
  X,
  Filter
} from 'lucide-angular';

@Component({
  selector: 'app-autorisations-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, LucideAngularModule, AvatarColorPipe, InitialsPipe, DatePipe],
  template: `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <h2>Autorisations de sortie</h2>
        <div class="subtitle">Gérez et enregistrez les sorties de courte durée (maximum 2h/jour)</div>
      </div>
      <button class="btn btn-primary" (click)="openModal()">
        <i-lucide [name]="Plus" [size]="18" color="#ffffff"></i-lucide>
        Nouvelle autorisation
      </button>
    </div>

    <section class="stats-grid" style="margin-bottom: 24px;">
      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:rgba(99, 102, 241, 0.1);">
          <i-lucide [name]="DoorOpen" [size]="22" color="#6366f1"></i-lucide>
        </div>
        <div>
          <p class="value" style="color:#6366f1">{{ autorisations.length }}</p>
          <div class="muted" style="margin-top:4px;">Total autorisations</div>
        </div>
      </article>

      <article class="card emp-stat-card">
        <div class="emp-stat-icon" style="background:var(--color-orange-bg);">
          <i-lucide [name]="Clock" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div>
          <p class="value value-orange">{{ getTotalHours() }}h</p>
          <div class="muted" style="margin-top:4px;">Heures déduites au total</div>
        </div>
      </article>
    </section>

    <!-- Toolbar: Search -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:16px;">
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <div class="card" style="padding: 10px 16px; display:flex; align-items:center; gap:10px; width: 260px; border-radius: 12px; margin-bottom:0;">
          <i-lucide [name]="Search" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="selectedEmployeId" (ngModelChange)="onEmployeeChange()" style="border:none; background:transparent; width:100%; outline:none; color:var(--text-main); font-family:inherit; font-size:14px; cursor:pointer;">
            <option value="all">Tous les employés</option>
            <option *ngFor="let emp of employees" [value]="emp.id">
              {{ emp.prenom }} {{ emp.nom }}
            </option>
          </select>
        </div>
        
        <div *ngIf="selectedEmployeId !== 'all' && selectedSolde" class="card" style="padding: 10px 16px; display:flex; align-items:center; gap:16px; border-radius: 12px; margin-bottom:0; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.1);">
          <div>
            <div style="font-size:16px; font-weight:700; color:var(--color-primary);">{{ selectedSolde.heuresSortie || 0 }} <span style="font-size:12px; font-weight:500;">heures cumulées</span></div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
              Soit <strong>{{ getJoursDeduits() }}</strong> jour(s) déduit(s) (Règle d'autorisation)
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:8px;">
        <i-lucide [name]="Filter" [size]="14" color="var(--text-muted)"></i-lucide>
        <span style="font-size:13px; color:var(--text-muted); font-weight:500;">Filtrer :</span>
        <select [(ngModel)]="selectedYear" class="date-filter-select">
          <option [ngValue]="'all'">Toutes les années</option>
          <option *ngFor="let y of getAvailableYears()" [ngValue]="y">{{ y }}</option>
        </select>
        
        <select [(ngModel)]="selectedMonth" [disabled]="selectedYear === 'all'" [style.opacity]="selectedYear === 'all' ? '0.5' : '1'" class="date-filter-select">
          <option [ngValue]="'all'">Tous les mois</option>
          <option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <section class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Employé</th>
            <th>Date de la sortie</th>
            <th>Durée autorisée</th>
            <th>Statut</th>
            <th>Date d'enregistrement</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let a of filteredAutorisations()">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar avatar-sm" [ngClass]="(a.email || a.employeNom) | avatarColor : a.avatar">{{ a.employeNom | initials }}</div>
                <span style="font-weight:600;">{{ a.employeNom }}</span>
              </div>
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:6px;">
                <i-lucide [name]="Calendar" [size]="14" color="var(--text-muted)"></i-lucide>
                {{ a.dateAutorisation | date:'dd/MM/yyyy' }}
              </div>
            </td>
            <td><strong style="color:var(--text-main)">{{ a.heures }}h</strong></td>
            <td>
              <span class="chip chip-green">Approuvée</span>
            </td>
            <td class="muted">{{ a.dateSaisie | date:'dd/MM/yyyy HH:mm' }}</td>
          </tr>
          <tr *ngIf="filteredAutorisations().length === 0">
            <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
              Aucune autorisation trouvée
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="modal-overlay" *ngIf="showModal">
      <form class="modal-card" (ngSubmit)="submitAutorisation()">
        <h2>Enregistrer autorisation (sortie)</h2>
        <p class="muted">Déclarez les heures de sortie anticipée validées oralement.</p>

        <div style="background: var(--bg-app); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 16px;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Employé sélectionné *</div>
          <select name="employe" [(ngModel)]="form.employeId" style="width:100%; border:1px solid var(--border-light); background:white; padding:8px; border-radius:6px; outline:none;" required>
            <option [ngValue]="null">Sélectionner un employé</option>
            <option *ngFor="let emp of employees" [ngValue]="emp.id">{{ emp.prenom }} {{ emp.nom }}</option>
          </select>
        </div>

        <div style="display:flex; gap:12px; margin-top:16px;">
          <div style="flex:1;">
            <label>Date de sortie</label>
            <input type="date" name="dateSortie" [(ngModel)]="form.dateAutorisation" required>
          </div>
          <div style="flex:1;">
            <label>Heures manquées</label>
            <input type="number" name="heures" [(ngModel)]="form.heures" min="1" max="2" required>
            <div *ngIf="form.heures && form.heures > 2" style="color:var(--color-red); font-size:12px; margin-top:4px;">
              Maximum 2 heures autorisées par jour.
            </div>
          </div>
        </div>

        <div class="btn-row" style="margin-top:20px;">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="!form.employeId || !form.dateAutorisation || !form.heures || form.heures > 2">Enregistrer</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.date-filter-select { height:36px; padding:0 30px 0 12px; font-size:13px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); outline:none; cursor:pointer; }`]
})
/**
 * Admin portal component for managing employee exit authorizations.
 * Max 2h/day allowed per employee.
 */
export class AutorisationsPageComponent implements OnInit {
  // Lucide Icons
  protected readonly Clock = Clock;
  protected readonly Search = Search;
  protected readonly Plus = Plus;
  protected readonly DoorOpen = DoorOpen;
  protected readonly Calendar = Calendar;
  protected readonly X = X;
  protected readonly Filter = Filter;

  // Constant Data
  readonly months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Component State
  selectedEmployeId: any = 'all';
  employees: EmployeeDto[] = [];
  autorisations: any[] = [];
  showModal = false;
  selectedSolde: any = null;
  selectedYear: any = 'all';
  selectedMonth: any = 'all';

  // Form Model
  form = { employeId: null as number | null, dateAutorisation: '', heures: null as number | null };

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  // --- Lifecycle & Data Loading ---

  ngOnInit(): void {
    this.loadEmployees();
    this.loadData();
  }

  loadEmployees(): void {
    this.api.getEmployees().subscribe({
      next: (res) => {
        this.employees = res || [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadData(): void {
    this.api.getAutorisations().subscribe({
      next: (res) => {
        this.autorisations = res || [];
        // Trier par date descendante
        this.autorisations.sort((a, b) => new Date(b.dateSaisie || 0).getTime() - new Date(a.dateSaisie || 0).getTime());
        this.cdr.detectChanges();
      }
    });
  }

  getAvailableYears(): number[] {
    const years = this.autorisations
      .filter(a => a.dateAutorisation)
      .map(a => new Date(a.dateAutorisation).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }

  // --- Filtering ---

  filteredAutorisations(): any[] {
    let filtered = this.autorisations;

    if (this.selectedEmployeId !== 'all') {
      filtered = filtered.filter(a => a.employeId == this.selectedEmployeId);
    }

    if (this.selectedYear !== 'all') {
      filtered = filtered.filter(a => {
        if (!a.dateAutorisation) return false;
        const d = new Date(a.dateAutorisation);
        if (d.getFullYear() !== this.selectedYear) return false;
        return this.selectedMonth === 'all' || (d.getMonth() + 1) === this.selectedMonth;
      });
    }

    return filtered;
  }

  // --- Employee Selection ---

  onEmployeeChange(): void {
    if (this.selectedEmployeId === 'all') {
      this.selectedSolde = null;
    } else {
      this.api.getEmployeeSolde(this.selectedEmployeId).subscribe(s => {
        this.selectedSolde = s;
        this.cdr.detectChanges();
      });
    }
  }

  getJoursDeduits(): number {
    if (!this.selectedSolde) return 0;
    return Math.floor((this.selectedSolde.heuresSortie || 0) / 8);
  }

  getTotalHours(): number {
    return this.filteredAutorisations().reduce((sum, a) => sum + (a.heures || 0), 0);
  }

  // --- Modal Management ---

  openModal(): void { this.showModal = true; }
  closeModal(): void {
    this.showModal = false;
    this.form = { employeId: null, dateAutorisation: '', heures: null };
  }

  // --- Form Submission ---

  submitAutorisation(): void {
    if (!this.form.employeId || !this.form.dateAutorisation || !this.form.heures) return;

    const payload = {
      employeId: this.form.employeId as number,
      dateAutorisation: this.form.dateAutorisation,
      heures: this.form.heures as number
    };

    this.api.createAutorisation(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: (err) => alert(err.error?.message || "Erreur lors de l'enregistrement")
    });
  }
}
