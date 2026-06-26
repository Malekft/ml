import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PresenceService } from '../core/presence.service';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';
import {
  LucideAngularModule,
  Shield, Users, ShieldCheck, Activity, UserCog, User, Clock,
  UserPlus, Key, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle
} from 'lucide-angular';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
  avatar?: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, LucideAngularModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header">
      <div>
        <h2 style="display:flex;align-items:center;gap:12px;">
          <i-lucide [name]="Shield" [size]="24" color="var(--color-red)"></i-lucide>
          Hub d'Administration
        </h2>
        <div class="subtitle">Contrôle global du système et des accès</div>
      </div>
      <span class="chip chip-red" style="padding:10px 20px;font-size:14px;font-weight:600;">Privilèges Administrateur</span>
    </div>

    <div style="display:flex; flex-direction:column; gap:32px;">
      
      <!-- Section 1: Gestion des Utilisateurs -->
      <section>
        <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:var(--text-main);">
            <i-lucide [name]="Users" [size]="20" color="var(--color-primary)"></i-lucide>
            Gestion des Utilisateurs
          </h3>
          <button class="btn btn-primary" (click)="openModal()">
            <i-lucide [name]="UserPlus" [size]="18" style="margin-right:8px;"></i-lucide>
            Ajouter un utilisateur
          </button>
        </div>

        <div class="card" style="padding:0; overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of paginatedUserList">
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="position:relative; flex-shrink:0;">
                      <div class="avatar avatar-sm" [ngClass]="u.email | avatarColor : u.avatar">{{ u.name | initials }}</div>
                      <div *ngIf="presence.isUserOnline(u.id)" style="position:absolute; bottom:0; right:0; width:8px; height:8px; background:var(--color-green); border:1.5px solid white; border-radius:50%;"></div>
                    </div>
                    <div>
                      <div style="font-weight:600;">{{ u.name }}</div>
                      <div class="muted" style="font-size:12px;">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="chip" [class]="u.role === 'MANAGER' ? 'chip-purple' : 'chip-blue'">
                    {{ u.role }}
                  </span>
                </td>
                <td>
                  <span style="display:flex;align-items:center;gap:6px;font-size:13px;" [style.color]="presence.isUserOnline(u.id) ? 'var(--color-green)' : 'var(--text-muted)'">
                    <i-lucide [name]="presence.isUserOnline(u.id) ? CheckCircle : XCircle" [size]="14"></i-lucide>
                    {{ presence.isUserOnline(u.id) ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td style="text-align:right;">
                  <button class="action-btn action-btn-gray" style="margin-right:8px; cursor:pointer;" (click)="openEditModal(u)" title="Modifier le rôle"><i-lucide [name]="Edit2" [size]="16"></i-lucide></button>
                  <button class="action-btn action-btn-red" style="cursor:pointer;" (click)="confirmDelete(u)" title="Supprimer"><i-lucide [name]="Trash2" [size]="16"></i-lucide></button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Controls -->
          <div *ngIf="totalPages > 1" style="display:flex; justify-content:center; align-items:center; gap:20px; padding:16px; background:rgba(0,0,0,0.02); border-top:1px solid var(--border-light);">
            <button class="btn btn-secondary" [disabled]="currentPage === 1" (click)="prevPage()" style="padding: 6px 16px; font-size:13px;">Précédent</button>
            <span style="font-size:13px; font-weight:600; color:var(--text-muted);">Page {{ currentPage }} sur {{ totalPages }}</span>
            <button class="btn btn-secondary" [disabled]="currentPage === totalPages" (click)="nextPage()" style="padding: 6px 16px; font-size:13px;">Suivant</button>
          </div>
        </div>
      </section>

      <!-- Section 2: Gestion des Rôles & Permissions -->
      <section>
        <div class="section-header" style="margin-bottom:16px;">
          <h3 style="display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;color:var(--text-main);">
            <i-lucide [name]="Key" [size]="20" color="var(--color-orange)"></i-lucide>
            Gestion des Rôles & Permissions
          </h3>
          <p class="muted" style="font-size:13px;margin-top:4px;">Configurez les accès granulaires pour chaque type d'utilisateur.</p>
        </div>

        <div class="grid-2">
          <div class="card" *ngFor="let r of roleSettings" style="display:flex; flex-direction:column; gap:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="font-weight:700;font-size:16px;">Rôle: {{ r.name }}</h4>
              <i-lucide [name]="r.icon" [size]="18" [color]="r.color"></i-lucide>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:16px;">
              <div *ngFor="let t of r.tasks" style="display:flex; align-items:flex-start; gap:12px; padding:12px; border-radius:12px; background:var(--bg-app); border:1px solid var(--border-color); transition: transform 0.2s ease;">
                <div style="padding:10px; border-radius:10px; background:white; display:grid; place-items:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <i-lucide [name]="t.icon" [size]="18" [color]="r.color"></i-lucide>
                </div>
                <div style="flex:1;">
                  <div style="font-size:14px; font-weight:700; color:var(--text-main);">{{ t.label }}</div>
                  <div class="muted" style="font-size:12px; margin-top:2px; line-height:1.4;">{{ t.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>

    <!-- Modal Ajouter Utilisateur -->
    <div class="modal-overlay" *ngIf="showModal">
      <div class="modal-card" style="max-width:600px;">
        <h2>Ajouter un nouvel utilisateur</h2>
        <p class="muted">Attribuez un rôle (Manager ou Employé) et un email professionnel.</p>
        
        <form (ngSubmit)="saveEmployee()" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
          <div style="display:flex; gap:16px;">
            <div style="flex:1;">
              <label>Prénom</label>
              <input type="text" name="prenom" [(ngModel)]="newEmp.prenom" (input)="validateForm()" required placeholder="Marie">
              <div *ngIf="errors.prenom" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.prenom }}</div>
            </div>
            <div style="flex:1;">
              <label>Nom</label>
              <input type="text" name="nom" [(ngModel)]="newEmp.nom" (input)="validateForm()" required placeholder="Dubois">
              <div *ngIf="errors.nom" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.nom }}</div>
            </div>
          </div>
          
          <div>
            <label>Email Professionnel</label>
            <input type="email" name="email" [(ngModel)]="newEmp.email" (input)="validateForm()" required placeholder="m.dubois@hrplatform.com">
            <div *ngIf="errors.email" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.email }}</div>
          </div>
          
          <div style="display:flex; gap:16px;">
            <div style="flex:1;">
              <label>Téléphone</label>
              <input type="text" name="telephone" [(ngModel)]="newEmp.telephone" placeholder="+33 6 00 00 00 00">
            </div>
            <div style="flex:1;">
              <label>Poste / Intitulé</label>
              <input type="text" name="poste" [(ngModel)]="newEmp.poste" (input)="validateForm()" required placeholder="Designer, Développeur...">
              <div *ngIf="errors.poste" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.poste }}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label>Matricule</label>
              <input type="text" name="matricule" [(ngModel)]="newEmp.matricule" placeholder="Ex: EMP-001">
            </div>
            <div>
              <label>Bureau</label>
              <input type="text" name="bureau" [(ngModel)]="newEmp.bureau" placeholder="Ex: Bureau 102">
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label>Date d'embauche</label>
              <input type="date" name="dateEmbauche" [(ngModel)]="newEmp.dateEmbauche">
            </div>
            <div>
              <label>Manager direct</label>
              <select name="manager" [(ngModel)]="newEmp.manager" style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main);">
                <option value="">Sélectionner un manager</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.nom }}</option>
              </select>
            </div>
          </div>
          
          <div style="margin-top: 16px;">
            <label>Compétences & Formations (Séparées par des virgules)</label>
            <textarea name="competences" [(ngModel)]="newEmp.competences" placeholder="Ex: Java, Angular, SQL..." style="width:100%; padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-family:inherit; font-size:14px; min-height:80px; outline:none; transition:all 0.2s;"></textarea>
          </div>

          <div>
            <label>Rôle Système</label>
            <select name="role" [(ngModel)]="newEmp.role" style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main);">
              <option value="EMPLOYEE">Employé (Accès Portail Employé)</option>
              <option value="MANAGER">Manager (Accès Gestion RH)</option>
            </select>
          </div>
          
          <div style="display:flex; gap:12px; margin-top:10px;">
            <button type="button" class="btn btn-secondary" style="flex:1; justify-content:center;" (click)="closeModal()">Annuler</button>
            <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;" [disabled]="!isFormValid()">Créer le profil</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Modifier Utilisateur -->
    <div class="modal-overlay" *ngIf="showEditModal && editForm" (click)="closeEditModal()">
      <form class="modal-card" style="max-width:650px;" (ngSubmit)="saveEdit()" (click)="$event.stopPropagation()">
        <h2>Modifier le profil professionnel</h2>
        <p class="muted">Mise à jour complète des informations de {{ editForm.prenom }} {{ editForm.nom }}.</p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
          <!-- Section Identité -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Identité & Contact</h3>
            <div>
              <label>Prénom</label>
              <input type="text" name="editPrenom" [(ngModel)]="editForm.prenom" required>
            </div>
            <div>
              <label>Nom</label>
              <input type="text" name="editNom" [(ngModel)]="editForm.nom" required>
            </div>
            <div>
              <label>Téléphone</label>
              <input type="text" name="editTelephone" [(ngModel)]="editForm.telephone">
            </div>
            <div>
              <label>Bureau / Localisation</label>
              <input type="text" name="editBureau" [(ngModel)]="editForm.bureau" placeholder="Ex: Bureau 204, Paris">
            </div>
          </div>

          <!-- Section Professionnelle -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Contrat & Poste</h3>
            <div>
              <label>Intitulé du poste</label>
              <input type="text" name="editPoste" [(ngModel)]="editForm.poste" required>
            </div>
            <div>
              <label>Matricule</label>
              <input type="text" name="editMatricule" [(ngModel)]="editForm.matricule">
            </div>
            <div>
              <label>Date d'embauche</label>
              <input type="date" name="editDateEmbauche" [(ngModel)]="editForm.dateEmbauche">
            </div>
            <div>
              <label>Manager direct</label>
              <select name="editManager" [(ngModel)]="editForm.manager" style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main);">
                <option value="">Sélectionner un manager</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.nom }}</option>
              </select>
            </div>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <label>Compétences (Séparées par des virgules)</label>
          <textarea name="editCompetences" [(ngModel)]="editForm.competences" placeholder="Ex: Java, Angular, SQL..." style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-family:inherit; font-size:14px; min-height:80px; outline:none; transition:all 0.2s;"></textarea>
        </div>

        <div class="btn-row" style="margin-top: 32px; display:flex; gap:12px; border-top: 1px solid var(--border-light); padding-top: 24px;">
          <button type="button" class="btn btn-secondary" style="flex:1; justify-content:center;" (click)="closeEditModal()">Annuler</button>
          <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;" [disabled]="!editForm.nom || !editForm.prenom">Enregistrer les modifications</button>
        </div>
      </form>
    </div>

    <!-- Modal Confirmer Suppression -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
      <div class="modal-card" style="max-width:420px;" (click)="$event.stopPropagation()">
        <div style="display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center;">
          <div style="width:56px; height:56px; border-radius:50%; background:rgba(239,68,68,0.1); display:grid; place-items:center;">
            <i-lucide [name]="AlertTriangle" [size]="28" color="#ef4444"></i-lucide>
          </div>
          <h2 style="margin:0; font-size:18px; color:var(--text-main);">Confirmer la suppression</h2>
          <p class="muted" style="font-size:14px; margin:0; line-height:1.5;">
            Êtes-vous sûr de vouloir supprimer <strong>{{ deletingUser?.name }}</strong> ?<br>
            Cette action est irréversible.
          </p>
          <div style="display:flex; gap:12px; width:100%; margin-top:8px;">
            <button class="btn btn-secondary" style="flex:1; justify-content:center;" (click)="closeDeleteModal()">Annuler</button>
            <button class="btn btn-primary" style="flex:1; justify-content:center; background:#ef4444; border-color:#ef4444;" (click)="executeDelete()">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminPageComponent implements OnInit, OnDestroy {
  // Lucide Icons
  protected readonly Shield = Shield;
  protected readonly Users = Users;
  protected readonly UserCog = UserCog;
  protected readonly User = User;
  protected readonly UserPlus = UserPlus;
  protected readonly Key = Key;
  protected readonly Edit2 = Edit2;
  protected readonly Trash2 = Trash2;
  protected readonly CheckCircle = CheckCircle;
  protected readonly XCircle = XCircle;
  protected readonly AlertTriangle = AlertTriangle;

  // Component State
  userList: UserData[] = [];
  managers: any[] = [];
  errors: any = {};

  // Pagination
  currentPage = 1;
  readonly pageSize = 6;

  // Polling
  private pollingTimer: any;

  // Create Modal
  showModal = false;
  newEmp = this.createEmptyForm();

  // Edit Modal
  showEditModal = false;
  editingUser: UserData | null = null;
  editForm: any = null;

  // Delete Modal
  showDeleteModal = false;
  deletingUser: UserData | null = null;

  // Roles & permissions configuration (static)
  readonly roleSettings = [
    {
      name: 'Manager',
      color: 'var(--color-purple)',
      icon: UserCog,
      tasks: [
        { label: 'Approbation des congés', icon: CheckCircle, desc: 'Valider ou refuser les demandes de son équipe' },
        { label: 'Gestion du support', icon: ShieldCheck, desc: 'Suivre et clôturer les tickets d\'assistance' },
        { label: 'Audit des heures', icon: Clock, desc: 'Vérifier les travaux supplémentaires déclarés' },
        { label: 'Analyses d\'équipe', icon: Activity, desc: 'Consulter les KPI et rapports de performance' }
      ]
    },
    {
      name: 'Employé',
      color: 'var(--color-blue)',
      icon: User,
      tasks: [
        { label: 'Demandes personnelles', icon: Key, desc: 'Soumettre des demandes de congés ou tickets' },
        { label: 'Auto-déclaration', icon: UserPlus, desc: 'Déclarer ses heures de travail supplémentaire' },
        { label: 'Consulter annonces', icon: Clock, desc: 'Lire et commenter les actualités internes' },
        { label: 'Mon Espace RH', icon: User, desc: 'Gérer ses informations et documents personnels' }
      ]
    }
  ];

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    protected readonly presence: PresenceService
  ) {}

  // --- Computed Getters ---

  get paginatedUserList(): UserData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.userList.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.userList.length / this.pageSize);
  }

  // --- Lifecycle & Polling ---

  ngOnInit(): void {
    this.loadUsers();
    this.api.getManagers().subscribe({
      next: (m) => { this.managers = m; this.cdr.detectChanges(); }
    });
    this.pollingTimer = setInterval(() => this.loadUsers(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  // --- Data Loading ---

  loadUsers(): void {
    this.api.getAllUsers().subscribe({
      next: (res) => {
        this.userList = (res || []).map(u => ({
          id: u.id, name: u.nom, email: u.email,
          role: u.role, avatar: u.avatar
        }));
        this.cdr.detectChanges();
      }
    });
  }

  // --- Pagination ---

  prevPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.cdr.detectChanges(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.cdr.detectChanges(); }
  }

  // --- Create Modal ---

  openModal(): void { this.showModal = true; }

  closeModal(): void {
    this.showModal = false;
    this.newEmp = this.createEmptyForm();
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};
    if (!this.newEmp.prenom.trim()) this.errors.prenom = "Le prénom est requis";
    if (!this.newEmp.nom.trim()) this.errors.nom = "Le nom est requis";
    if (!this.newEmp.email.trim()) this.errors.email = "L'email est requis";
    else if (!this.newEmp.email.includes('@')) this.errors.email = "Email invalide";
    if (!this.newEmp.poste.trim()) this.errors.poste = "Le poste est requis";
    return Object.keys(this.errors).length === 0;
  }

  isFormValid(): boolean {
    return !!(this.newEmp.prenom.trim() && this.newEmp.nom.trim() && this.newEmp.email.trim() && this.newEmp.poste.trim());
  }

  saveEmployee(): void {
    if (!this.validateForm()) return;
    this.api.createUser(this.newEmp).subscribe({
      next: () => {
        alert(`L'utilisateur ${this.newEmp.prenom} a été ajouté avec succès.\nMot de passe par défaut : HRPlatform@2026`);
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => alert("Erreur lors de la création : " + (err.error?.message || "Erreur serveur"))
    });
  }

  // --- Edit Modal ---

  openEditModal(user: UserData): void {
    this.editingUser = user;
    this.api.getEmployee(user.id).subscribe({
      next: (data: any) => {
        this.editForm = {
          nom: data.nom,
          prenom: data.prenom,
          poste: data.poste,
          telephone: data.telephone,
          matricule: data.matricule,
          dateEmbauche: data.dateEmbauche,
          bureau: data.bureau,
          manager: data.manager,
          competences: data.competences ? data.competences.join(', ') : ''
        };
        this.showEditModal = true;
        this.cdr.detectChanges();
      },
      error: () => alert("Impossible de charger les données de l'utilisateur.")
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.editForm = null;
  }

  saveEdit(): void {
    if (!this.editingUser || !this.editForm) return;
    this.api.updateEmployee(this.editingUser.id, this.editForm).subscribe({
      next: () => {
        this.loadUsers();
        this.closeEditModal();
      },
      error: (err: any) => alert('Erreur lors de la mise à jour : ' + (err.error?.message || 'Erreur inconnue'))
    });
  }

  // --- Delete Modal ---

  confirmDelete(user: UserData): void {
    this.deletingUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingUser = null;
  }

  executeDelete(): void {
    if (!this.deletingUser) return;
    this.api.deleteUser(this.deletingUser.id).subscribe({
      next: () => {
        this.loadUsers();
        this.closeDeleteModal();
      },
      error: () => alert("Erreur lors de la suppression de l'utilisateur.")
    });
  }

  // --- Helpers ---

  private createEmptyForm() {
    return {
      prenom: '', nom: '', email: '', telephone: '', poste: '',
      role: 'EMPLOYEE' as 'MANAGER' | 'EMPLOYEE',
      matricule: '', bureau: '', dateEmbauche: '', manager: '', competences: ''
    };
  }
}
