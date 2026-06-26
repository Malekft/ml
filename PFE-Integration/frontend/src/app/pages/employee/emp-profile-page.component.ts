import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { PresenceService } from '../../core/presence.service';
import { EmployeeDto } from '../../core/api.types';
import { AvatarColorPipe } from '../../core/avatar-color.pipe';
import { InitialsPipe } from '../../core/initials.pipe';

@Component({
  selector: 'app-emp-profile-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, LucideAngularModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Mon Profil Personnel</h2>
        <div class="subtitle">Gérez vos informations et consultez vos documents</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 380px; gap:24px; align-items: start;" *ngIf="employee">
      <!-- Main Content (Left) -->
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Profile Card -->
        <article class="card" style="padding:32px;">
          <div style="display:flex; align-items:center; gap:24px; margin-bottom:32px;">
            <div class="avatar emp-avatar" [ngClass]="employee.email | avatarColor : employee.avatar" style="width:100px; height:100px; font-size:32px;">{{ initials }}</div>
            <div>
              <h2 style="margin:0; font-size:24px; color:var(--text-main);">{{ employee.prenom }} {{ employee.nom }}</h2>
              <p class="muted" style="margin:4px 0 0; font-size:16px;">{{ employee.poste }}</p>
              <div style="display:flex; gap:8px; margin-top:12px; align-items:center;">
                <span style="display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; padding: 4px 10px; border-radius: 20px; background: var(--bg-app); border: 1px solid var(--border-light);">
                  <span [style.background]="presence.isUserOnline(employee.id) ? '#22c55e' : '#94a3b8'" style="width:8px; height:8px; border-radius:50%; display:inline-block;"></span>
                  {{ presence.isUserOnline(employee.id) ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:32px;">
            <div *ngFor="let group of infoGroups">
              <h4 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); letter-spacing:1px; margin-bottom:12px;">{{ group.label }}</h4>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div *ngFor="let item of group.items" style="display:flex; align-items:center; gap:16px;">
                  <ng-container *ngIf="!item.isAvatar">
                    <div [style.background]="item.bg" [style.color]="item.color" style="width:36px; height:36px; border-radius:10px; display:grid; place-items:center; flex-shrink:0;">
                      <i-lucide [name]="item.icon" [size]="18"></i-lucide>
                    </div>
                  </ng-container>
                  <ng-container *ngIf="item.isAvatar">
                    <div class="avatar" [ngClass]="item.value | avatarColor" style="width:36px; height:36px; font-size:12px;">
                      {{ item.value | initials }}
                    </div>
                  </ng-container>
                  <div>
                    <div style="font-size:11px; color:var(--text-muted); font-weight:500;">{{ item.title }}</div>
                    <div style="font-weight:600; color:var(--text-main); font-size:14px;">{{ item.value }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- Training/Skills -->
        <article class="card">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:20px; color:var(--text-main);">Compétences & Formations</h3>
          <div style="display:flex; flex-wrap:wrap; gap:10px;" *ngIf="skills.length > 0">
            <span *ngFor="let skill of skills" class="tab-btn" style="cursor:default; background:var(--bg-app);">{{ skill }}</span>
          </div>
          <div *ngIf="skills.length === 0" class="muted" style="font-size:13px; text-align:center; padding:10px;">
            Aucune compétence renseignée.
          </div>
        </article>
      </div>

      <!-- Right Sidebar -->
      <aside style="display:flex; flex-direction:column; gap:24px;">
        <!-- Documents Section -->
        <article class="card">
          <div style="margin-bottom:24px;">
            <h3 style="font-size:16px; font-weight:700; color:var(--text-main); margin:0;">Documents Récents</h3>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div *ngFor="let doc of paginatedDocuments" class="doc-card" style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border-light); border-radius:12px; transition:all 0.2s; cursor:pointer; background: var(--bg-input);">
              <div style="width:40px; height:40px; border-radius:8px; background:rgba(59, 130, 246, 0.1); color:#3b82f6; display:grid; place-items:center; flex-shrink:0;">
                <i-lucide name="FileText" [size]="18"></i-lucide>
              </div>
              <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:13px; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ doc.fileName }}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">{{ doc.uploadedAt }} · {{ doc.type }}</div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <a [href]="getFullUrl(doc.fileUrl)" target="_blank" class="icon-btn-sm" style="flex-shrink:0; display:grid; place-items:center; text-decoration:none;" title="Voir">
                  <i-lucide name="Eye" [size]="14"></i-lucide>
                </a>
                <a [href]="getDownloadUrl(doc.fileUrl)" class="icon-btn-sm" style="flex-shrink:0; display:grid; place-items:center; text-decoration:none;" title="Télécharger">
                  <i-lucide name="Download" [size]="14"></i-lucide>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <div *ngIf="totalPages > 1" style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-light);">
            <button (click)="currentPage = currentPage - 1" [disabled]="currentPage === 1" 
                    style="padding:6px 12px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-app); color:var(--text-main); cursor:pointer; font-size:12px; display:flex; align-items:center; gap:4px;">
              <i-lucide name="ChevronLeft" [size]="14"></i-lucide>
              Précédent
            </button>
            <span style="font-size:12px; color:var(--text-muted);">{{ currentPage }} / {{ totalPages }}</span>
            <button (click)="currentPage = currentPage + 1" [disabled]="currentPage === totalPages"
                    style="padding:6px 12px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-app); color:var(--text-main); cursor:pointer; font-size:12px; display:flex; align-items:center; gap:4px;">
              Suivant
              <i-lucide name="ChevronRight" [size]="14"></i-lucide>
            </button>
          </div>
          
          <div *ngIf="!employee.documents?.length" class="muted" style="text-align:center; padding:20px; font-size:13px;">
            Aucun document récent disponible.
          </div>
        </article>
      </aside>
    </div>
  `
})
export class EmpProfilePageComponent implements OnInit {
  // Component State
  employee: EmployeeDto | null = null;
  initials = '';
  infoGroups: any[] = [];
  skills: string[] = [];

  // Pagination
  currentPage = 1;
  readonly pageSize = 6;

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    protected readonly presence: PresenceService
  ) {}

  // --- Computed Getters ---

  /** Returns only admin-uploaded (validated) documents, filtered once and reused. */
  private get officialDocuments(): any[] {
    return this.employee?.documents?.filter(d => d.validated === true) ?? [];
  }

  get paginatedDocuments(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.officialDocuments.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.officialDocuments.length / this.pageSize) || 0;
  }

  // --- Lifecycle & Data Loading ---

  ngOnInit(): void {
    const empId = Number(localStorage.getItem('hr_employeId')) || 0;
    const profileEmail = localStorage.getItem('hr_email') || '';

    if (empId > 0) {
      this.api.getEmployee(empId).subscribe({
        next: (data) => this.mapEmployeeData(data),
        error: () => this.fallbackLoadByEmail(profileEmail)
      });
    } else if (profileEmail) {
      this.fallbackLoadByEmail(profileEmail);
    }
  }

  private fallbackLoadByEmail(email: string): void {
    if (!email) return;
    this.api.getEmployees().subscribe({
      next: (emps) => {
        const found = emps.find(e => e.email === email);
        if (found) {
          if (found.id) localStorage.setItem('hr_employeId', String(found.id));
          this.mapEmployeeData(found);
        }
      }
    });
  }

  // --- Data Mapping ---

  private mapEmployeeData(data: EmployeeDto): void {
    this.employee = data;

    // Sort documents by date (newest first)
    this.employee.documents?.sort((a, b) =>
      new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    );

    // Initials
    this.initials = ((data.prenom?.[0] || '') + (data.nom?.[0] || '')).toUpperCase();

    // Skills
    this.skills = data.competences?.length ? data.competences : [];

    // Build info groups dynamically from DB
    this.infoGroups = [
      {
        label: 'Coordonnées',
        items: [
          { icon: 'Mail', title: 'Email Professionnel', value: data.email || 'Non renseigné', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
          { icon: 'Phone', title: 'Téléphone', value: data.telephone || 'Non renseigné', bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
          { icon: 'MapPin', title: 'Bureau', value: data.bureau || 'Non assigné', bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }
        ]
      },
      {
        label: 'Contrat & RH',
        items: [
          { icon: 'Hash', title: 'Matricule', value: data.matricule || 'N/A', bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
          { icon: 'Calendar', title: "Date d'embauche", value: data.dateEmbauche || 'Inconnue', bg: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6' },
          { icon: 'User', title: 'Manager', value: data.manager || 'Non assigné', bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', isAvatar: !!data.manager }
        ]
      }
    ];

    this.cdr.detectChanges();
  }

  // --- URL Helpers ---

  getFullUrl(path?: string | null): string {
    return this.api.getFullUrl(path);
  }

  getDownloadUrl(path?: string | null): string {
    return this.api.getDownloadUrl(path);
  }
}
