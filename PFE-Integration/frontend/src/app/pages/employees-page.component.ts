import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PresenceService } from '../core/presence.service';
import { EmployeeDto, AbsenceDto, AutorisationSortieDto } from '../core/api.types';
import { LucideAngularModule, Search, Mail, Phone, Eye, Pencil, Download, Trash2, CalendarOff, Clock, AlertTriangle, AlertCircle, FilePlus } from 'lucide-angular';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';

interface EmployeeView {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  soldeConges: number;
  avatar?: string;
}

@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <h2>Gestion des Employés</h2>
        <div class="subtitle">Gérez les profils et informations des employés</div>
      </div>
      <button class="btn btn-primary" (click)="openAddModal()">
        <i-lucide name="UserPlus" [size]="18" style="margin-right:8px;"></i-lucide>
        Ajouter un employé
      </button>
    </div>

    <!-- KPI section or Search Row -->
    <section class="card" style="margin-bottom: 20px;">
      <div class="search-row" style="display:flex; align-items:center; gap:16px;">
        <div class="search-input-wrapper" style="flex:1;">
          <i-lucide name="Search" [size]="18" class="search-icon-inner"></i-lucide>
          <input
            class="with-icon"
            placeholder="Rechercher par nom ou poste..."
            [(ngModel)]="query"
            style="width:100%;"
          />
        </div>

        <div style="display:flex; align-items:center; gap:10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 2px 10px; min-width: 250px;">
          <i-lucide name="Users" [size]="18" color="var(--text-light)"></i-lucide>
          <select [(ngModel)]="selectedEmployeId" style="border:none; background:transparent; width:100%; outline:none; color:var(--text-main); font-family:inherit; font-size:14px; cursor:pointer; padding: 8px 0;">
            <option value="all">Sélectionner un employé</option>
            <option *ngFor="let emp of employees" [value]="emp.id">
              {{ emp.prenom }} {{ emp.nom }}
            </option>
          </select>
        </div>

        <select [(ngModel)]="statusFilter" style="min-width: 140px;">
          <option value="all">Tous les statuts</option>
          <option value="online">En ligne</option>
          <option value="offline">Hors ligne</option>
        </select>
      </div>
    </section>

    <!-- Table Section -->
    <section class="card">
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Contact</th>
              <th>Poste</th>
              <th>Statut</th>
              <th>Solde Congés</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of filteredEmployees()">
              <td>
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="position:relative; flex-shrink:0;">
                    <div class="avatar avatar-sm" [ngClass]="e.email | avatarColor : e.avatar">
                      {{ e.prenom + ' ' + e.nom | initials }}
                    </div>
                    <div *ngIf="presence.isUserOnline(e.id)" style="position:absolute; bottom:0; right:0; width:8px; height:8px; background:var(--color-green); border:1.5px solid white; border-radius:50%;"></div>
                  </div>
                  <div>
                    <div style="font-weight:600;">{{ e.prenom }} {{ e.nom }}</div>
                    <div class="muted" style="font-size:12px;">ID: {{ e.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style="display:flex;flex-direction:column;gap:2px;">
                  <span style="display:flex;align-items:center;gap:6px;font-size:13px;">
                    <i-lucide name="Mail" [size]="14" color="var(--text-light)"></i-lucide>
                    {{ e.email }}
                  </span>
                  <span style="display:flex;align-items:center;gap:6px;font-size:13px;" class="muted">
                    <i-lucide name="Phone" [size]="14" color="var(--text-light)"></i-lucide>
                    {{ e.telephone }}
                  </span>
                </div>
              </td>
              <td>{{ e.poste }}</td>
              <td>
                <span class="chip" [ngClass]="presence.isUserOnline(e.id) ? 'chip-green' : 'chip-gray'" style="display:inline-flex; align-items:center; gap:6px;">
                  <span [style.background]="presence.isUserOnline(e.id) ? 'currentColor' : '#94a3b8'" style="width:6px; height:6px; border-radius:50%;"></span>
                  {{ presence.isUserOnline(e.id) ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <span style="font-weight:600; color: var(--color-primary);">{{ e.soldeConges }} jours</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn action-btn-blue" title="Voir" (click)="openViewModal(e)">
                    <i-lucide name="Eye" [size]="18"></i-lucide>
                  </button>
                  <button class="action-btn action-btn-purple" title="Ajouter Document" (click)="openDocumentModal(e)">
                    <i-lucide name="FilePlus" [size]="18"></i-lucide>
                  </button>
                  <button class="action-btn action-btn-orange" title="Ajouter Absence" (click)="openAbsenceModal(e)">
                    <i-lucide name="CalendarOff" [size]="18"></i-lucide>
                  </button>
                  <button class="action-btn action-btn-blue" title="Enregistrer Autorisation (Sortie)" (click)="openAutorisationModal(e)">
                    <i-lucide name="Clock" [size]="18"></i-lucide>
                  </button>
                  <button class="action-btn action-btn-gray" title="Modifier" (click)="openEditModal(e)">
                    <i-lucide name="Pencil" [size]="18"></i-lucide>
                  </button>
                  <button class="action-btn action-btn-red" title="Supprimer" (click)="deleteEmployee(e)">
                    <i-lucide name="Trash2" [size]="18"></i-lucide>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Absence Modal -->
    <div class="modal-overlay" *ngIf="showAbsenceModal">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="icon-circle icon-orange">
              <i-lucide name="CalendarOff" [size]="20"></i-lucide>
            </div>
            <div>
              <h3 style="margin:0; font-size:18px;">Ajouter une absence irrégulière</h3>
              <p class="muted" style="font-size:13px; margin:2px 0 0;">Employé: {{ selectedEmployee?.prenom }} {{ selectedEmployee?.nom }}</p>
            </div>
          </div>
          <button class="close-btn" (click)="closeAbsenceModal()">&times;</button>
        </div>

        <div class="modal-body" style="padding:24px;">
          <div class="alert alert-warning" style="margin-bottom:20px; display:flex; gap:12px; padding:12px; background:#fff7ed; border:1px solid #ffedd5; border-radius:8px; color:#9a3412; font-size:13px;">
            <i-lucide name="AlertTriangle" [size]="18"></i-lucide>
            <div>
              <strong>Règle de justification:</strong> L'employé disposera de <strong>48 heures</strong> pour justifier cette absence. Passé ce délai, elle sera marquée comme définitive.
            </div>
          </div>

          <div style="display:grid; gap:16px;">
            <div class="form-group">
              <label>Date de l'absence</label>
              <input type="datetime-local" [(ngModel)]="absenceForm.dateDebut" class="form-control" />
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding:16px 24px; background:var(--bg-app); display:flex; justify-content:flex-end; gap:12px; border-bottom-left-radius:12px; border-bottom-right-radius:12px;">
          <button class="btn btn-secondary" (click)="closeAbsenceModal()">Annuler</button>
          <button class="btn btn-primary" style="background:var(--color-orange); border-color:var(--color-orange);" (click)="submitAbsence()" [disabled]="!isAbsenceFormValid()">
            Confirmer l'absence
          </button>
        </div>
      </div>
    </div>



    <!-- Document Modal -->
    <div class="modal-overlay" *ngIf="showDocumentModal">
      <div class="modal-content" style="max-width: 500px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <div class="modal-header" style="border-bottom: 1px solid var(--border-light);">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="icon-circle" style="background: rgba(139, 92, 246, 0.1); color:#8b5cf6; width:40px; height:40px; border-radius:10px; display:grid; place-items:center;">
              <i-lucide name="FilePlus" [size]="20"></i-lucide>
            </div>
            <div>
              <h3 style="margin:0; font-size:18px; color: var(--text-main);">Ajouter un document</h3>
              <p class="muted" style="font-size:13px; margin:2px 0 0; color: var(--text-muted);">Employé: {{ selectedEmployee?.prenom }} {{ selectedEmployee?.nom }}</p>
            </div>
          </div>
          <button class="close-btn" (click)="showDocumentModal = false" style="color: var(--text-muted);">&times;</button>
        </div>

        <div class="modal-body" style="padding:24px;">
          <div style="display:grid; gap:16px;">
            <div class="form-group">
              <label style="display:block; margin-bottom:8px; font-weight:500; color: var(--text-main);">Type de document</label>
              <select [(ngModel)]="docForm.type" class="form-control" style="width:100%; background: var(--bg-input); color: var(--text-main); border-color: var(--border-color);">
                <option value="FICHE_PAIE">Fiche de paie</option>
                <option value="CONTRAT_TRAVAIL">Contrat de travail initial</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label style="display:block; margin-bottom:8px; font-weight:500; color: var(--text-main);">Fichier (PDF, Image...)</label>
              <div style="border: 2px dashed var(--border-color); border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-input);" (click)="fileInput.click()" [style.border-color]="docForm.file ? 'var(--color-primary)' : ''">
                <input type="file" #fileInput hidden (change)="handleFileSelect($event)">
                <i-lucide name="Upload" [size]="32" [color]="docForm.file ? 'var(--color-primary)' : 'var(--text-muted)'" style="margin-bottom:12px;"></i-lucide>
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">
                  {{ docForm.file ? docForm.file.name : 'Cliquez pour sélectionner un fichier' }}
                </div>
                <div class="muted" style="font-size:12px; margin-top:4px; color: var(--text-muted);" *ngIf="!docForm.file">PDF, JPG, PNG (Max 10MB)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding:16px 24px; background:var(--bg-input); display:flex; justify-content:flex-end; gap:12px; border-bottom-left-radius:12px; border-bottom-right-radius:12px; border-top: 1px solid var(--border-light);">
          <button class="btn btn-secondary" (click)="showDocumentModal = false" style="background: var(--bg-app); color: var(--text-main); border: 1px solid var(--border-color);">Annuler</button>
          <button class="btn btn-primary" (click)="submitDocument()" [disabled]="!isDocFormValid() || uploading">
            <span *ngIf="!uploading">Ajouter le document</span>
            <span *ngIf="uploading">Envoi en cours...</span>
          </button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showAutorisationModal">
      <form class="modal-card" (ngSubmit)="submitAutorisation()">
        <h2>Enregistrer autorisation (sortie)</h2>
        <p class="muted">Déclarez les heures de sortie anticipée validées oralement.</p>

        <div style="background: var(--bg-app); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 16px;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Employé sélectionné</div>
          <div style="font-weight: 600; color: var(--text-main);">{{ selectedEmployeeName }}</div>
        </div>

        <div style="display:flex; gap:12px; margin-top:16px;">
          <div style="flex:1;">
            <label>Date de sortie</label>
            <input type="date" name="dateSortie" [(ngModel)]="autoForm.dateAutorisation" required>
          </div>
          <div style="flex:1;">
            <label>Heures manquées</label>
            <input type="number" name="heures" [(ngModel)]="autoForm.heures" min="1" max="2" required #hoursInput="ngModel">
            <div *ngIf="autoForm.heures > 2" style="color:var(--color-red); font-size:12px; margin-top:4px;">
              Maximum 2 heures autorisées par jour.
            </div>
          </div>
        </div>

        <div class="btn-row" style="margin-top:20px;">
          <button type="button" class="btn btn-secondary" (click)="showAutorisationModal = false">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="!autoForm.employeId || !autoForm.dateAutorisation || !autoForm.heures || autoForm.heures > 2">Enregistrer</button>
        </div>
      </form>
    </div>

    <!-- Modal Voir Employé -->
    <div class="modal-overlay" *ngIf="showViewModal && fullEmployee">
      <div class="modal-card" style="max-width: 650px; padding: 0; overflow: hidden;">
        <!-- Header Image/Banner -->
        <div style="height: 100px; background: linear-gradient(135deg, var(--color-primary), var(--color-purple)); position: relative;">
          <button (click)="showViewModal = false" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: grid; place-items: center; font-size: 18px;">&times;</button>
        </div>

        <div style="padding: 0 32px 32px;">
          <!-- Profile Header -->
          <div style="display: flex; align-items: flex-end; gap: 20px; margin-top: -40px; margin-bottom: 24px;">
            <div class="avatar" style="width: 100px; height: 100px; font-size: 40px; border: 4px solid white; box-shadow: var(--shadow-md);" [ngClass]="fullEmployee.email | avatarColor : fullEmployee.avatar">
              {{ fullEmployee.prenom + ' ' + fullEmployee.nom | initials }}
            </div>
            <div style="padding-bottom: 8px;">
              <h2 style="margin: 0; font-size: 24px;">{{ fullEmployee.prenom }} {{ fullEmployee.nom }}</h2>
              <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                <span class="muted" style="font-size: 15px;">{{ fullEmployee.poste }}</span>
                <span class="chip" [ngClass]="presence.isUserOnline(fullEmployee.id) ? 'chip-green' : 'chip-gray'" style="display:inline-flex; align-items:center; gap:6px;">
                  <span [style.background]="presence.isUserOnline(fullEmployee.id) ? 'currentColor' : '#94a3b8'" style="width:6px; height:6px; border-radius:50%;"></span>
                  {{ presence.isUserOnline(fullEmployee.id) ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid-2" style="gap: 32px;">
            <!-- Column 1: Coordonnées -->
            <div>
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 16px;">Coordonnées</h3>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; display: grid; place-items: center;">
                    <i-lucide name="Mail" [size]="18"></i-lucide>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: var(--text-muted);">Email</div>
                    <div style="font-weight: 600; font-size: 14px;">{{ fullEmployee.email }}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(34, 197, 94, 0.1); color: #22c55e; display: grid; place-items: center;">
                    <i-lucide name="Phone" [size]="18"></i-lucide>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: var(--text-muted);">Téléphone</div>
                    <div style="font-weight: 600; font-size: 14px;">{{ fullEmployee.telephone || 'N/A' }}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(249, 115, 22, 0.1); color: #f97316; display: grid; place-items: center;">
                    <i-lucide name="MapPin" [size]="18"></i-lucide>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: var(--text-muted);">Bureau</div>
                    <div style="font-weight: 600; font-size: 14px;">{{ fullEmployee.bureau || 'Non assigné' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Column 2: Contrat -->
            <div>
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 16px;">Contrat & RH</h3>
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; display: grid; place-items: center;">
                    <i-lucide name="Hash" [size]="18"></i-lucide>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: var(--text-muted);">Matricule</div>
                    <div style="font-weight: 600; font-size: 14px;">{{ fullEmployee.matricule || 'N/A' }}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(20, 184, 166, 0.1); color: #14b8a6; display: grid; place-items: center;">
                    <i-lucide name="Calendar" [size]="18"></i-lucide>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: var(--text-muted);">Date d'embauche</div>
                    <div style="font-weight: 600; font-size: 14px;">{{ fullEmployee.dateEmbauche || 'Inconnue' }}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: grid; place-items: center;">
                    <i-lucide name="User" [size]="18"></i-lucide>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: var(--text-muted);">Manager</div>
                    <div style="font-weight: 600; font-size: 14px;">{{ fullEmployee.manager || 'Non assigné' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Skills & Documents Row -->
          <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px; margin-top: 32px;">
            <div *ngIf="fullEmployee.competences?.length">
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 12px;">Compétences</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <span *ngFor="let s of fullEmployee.competences" style="padding: 6px 12px; background: var(--bg-app); border-radius: 6px; font-size: 13px; font-weight: 500; border: 1px solid var(--border-light);">
                  {{ s }}
                </span>
              </div>
            </div>

          </div>

          <div style="margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn btn-secondary" (click)="showViewModal = false">Fermer</button>
            <button class="btn btn-primary" (click)="showViewModal = false; openEditModal(selectedEmployee!)">Modifier le profil</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Modifier Employé -->
    <div class="modal-overlay" *ngIf="showEditModal && editForm">
      <form class="modal-card" (ngSubmit)="saveEdit()" style="max-width: 650px;">
        <h2>Modifier le profil professionnel</h2>
        <p class="muted">Mise à jour complète des informations de {{ editForm.prenom }} {{ editForm.nom }}.</p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
          <!-- Section Identité -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Identité & Contact</h3>
            <div>
              <label>Prénom</label>
              <input type="text" name="prenom" [(ngModel)]="editForm.prenom" required>
            </div>
            <div>
              <label>Nom</label>
              <input type="text" name="nom" [(ngModel)]="editForm.nom" required>
            </div>
            <div>
              <label>Téléphone</label>
              <input type="text" name="telephone" [(ngModel)]="editForm.telephone">
            </div>
            <div>
              <label>Bureau / Localisation</label>
              <input type="text" name="bureau" [(ngModel)]="editForm.bureau" placeholder="Ex: Bureau 204, Paris">
            </div>
          </div>

          <!-- Section Professionnelle -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h3 style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Contrat & Poste</h3>
            <div>
              <label>Intitulé du poste</label>
              <input type="text" name="poste" [(ngModel)]="editForm.poste" required>
            </div>
            <div>
              <label>Matricule</label>
              <input type="text" name="matricule" [(ngModel)]="editForm.matricule">
            </div>
            <div>
              <label>Date d'embauche</label>
              <input type="date" name="dateEmbauche" [(ngModel)]="editForm.dateEmbauche">
            </div>
            <div>
              <label>Manager direct</label>
              <select name="manager" [(ngModel)]="editForm.manager" style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main);">
                <option value="">Sélectionner un manager</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.nom }}</option>
              </select>
            </div>
            <div style="grid-column: span 2;">
              <label>Compétences (Séparées par des virgules)</label>
              <textarea name="competences" [(ngModel)]="editForm.competences" placeholder="Ex: Java, Angular, SQL..." style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-family:inherit; font-size:14px; min-height:80px; outline:none; transition:all 0.2s;"></textarea>
            </div>
          </div>
        </div>

        <div class="btn-row" style="margin-top: 32px; border-top: 1px solid var(--border-light); padding-top: 24px;">
          <button type="button" class="btn btn-secondary" (click)="showEditModal = false">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="!editForm.nom || !editForm.prenom">Enregistrer les modifications</button>
        </div>
      </form>
    </div>

    <!-- Modal Ajouter Employé -->
    <div class="modal-overlay" *ngIf="showAddModal">
      <form class="modal-card" (ngSubmit)="saveEmployee()" style="max-width: 600px;">
        <h2>Ajouter un nouvel employé</h2>
        <p class="muted">Saisissez les informations de base pour créer le profil.</p>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
          <div>
            <label>Prénom</label>
            <input type="text" name="prenom" [(ngModel)]="newEmp.prenom" (input)="validateForm()" required>
            <div *ngIf="errors.prenom" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.prenom }}</div>
          </div>
          <div>
            <label>Nom</label>
            <input type="text" name="nom" [(ngModel)]="newEmp.nom" (input)="validateForm()" required>
            <div *ngIf="errors.nom" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.nom }}</div>
          </div>
        </div>
        
        <div style="margin-top: 16px;">
          <label>Email Professionnel</label>
          <input type="email" name="email" [(ngModel)]="newEmp.email" (input)="validateForm()" required>
          <div *ngIf="errors.email" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.email }}</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
          <div>
            <label>Poste</label>
            <input type="text" name="poste" [(ngModel)]="newEmp.poste" (input)="validateForm()" required>
            <div *ngIf="errors.poste" style="color:var(--color-red); font-size:11px; margin-top:4px;">{{ errors.poste }}</div>
          </div>
          <div>
            <label>Téléphone</label>
            <input type="text" name="telephone" [(ngModel)]="newEmp.telephone">
          </div>
        </div>

        <!-- NEW FIELDS -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
          <div>
            <label>Matricule</label>
            <input type="text" name="matricule" [(ngModel)]="newEmp.matricule" placeholder="Ex: EMP-001">
          </div>
          <div>
            <label>Bureau</label>
            <input type="text" name="bureau" [(ngModel)]="newEmp.bureau" placeholder="Ex: Bureau 102">
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
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
          <label>Compétences (Séparées par des virgules)</label>
          <textarea name="competences" [(ngModel)]="newEmp.competences" placeholder="Ex: Java, Angular, SQL..." style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-family:inherit; font-size:14px; min-height:80px; outline:none; transition:all 0.2s;"></textarea>
        </div>

        <div class="btn-row" style="margin-top: 32px;">
          <button type="button" class="btn btn-secondary" (click)="showAddModal = false">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="!isFormValid()">Créer l'employé</button>
        </div>
      </form>
    </div>

  `,
  styles: [`
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .action-btn {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .action-btn-blue {
      color: #2563eb;
    }
    .action-btn-blue:hover {
      background: #eff6ff;
    }

    .action-btn-gray {
      color: #6b7280;
    }
    .action-btn-gray:hover {
      background: #f3f4f6;
    }
    .action-btn-purple {
      color: #8b5cf6;
    }
    .action-btn-purple:hover {
      background: #f5f3ff;
    }

    .action-btn-orange {
      color: #f97316;
    }
    .action-btn-orange:hover {
      background: #fff7ed;
    }

    .action-btn-red {
      color: #ef4444;
    }
    .action-btn-red:hover {
      background: #fef2f2;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-content {
      background: white;
      border-radius: 16px;
      box-shadow: var(--shadow-xl);
      width: 90%;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .icon-circle {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: grid;
      place-items: center;
    }
    .icon-orange { background: #fff7ed; color: #f97316; }
    
    .close-btn {
      background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer;
    }
    
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text-main); }
    .form-control {
      width: 100%; padding: 10px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-size: 14px;
      transition: all 0.2s;
    }
    .form-control:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class EmployeesPageComponent implements OnInit {
  query = '';
  statusFilter = 'all';
  selectedEmployeId: any = 'all';

  employees: EmployeeView[] = [];
  managers: any[] = [];

  showAddModal = false;
  newEmp = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    role: 'EMPLOYEE',
    matricule: '',
    bureau: '',
    dateEmbauche: '',
    manager: '',
    competences: ''
  };

  showAbsenceModal = false;
  showViewModal = false;
  showEditModal = false;
  selectedEmployee: EmployeeView | null = null;
  fullEmployee: EmployeeDto | null = null;
  absenceForm = {
    dateDebut: ''
  };
  editForm: any = null;
  errors: any = {};
  formSubmitted = false;
  showDocumentModal = false;
  uploading = false;
  docForm: { type: string, file: File | null } = { type: 'FICHE_PAIE', file: null };


  showAutorisationModal = false;
  selectedEmployeeName = '';
  autoForm: { employeId: number | null, dateAutorisation: string, heures: number } = { employeId: null, dateAutorisation: '', heures: 1 };

  openAutorisationModal(emp: EmployeeView): void {
    this.autoForm.employeId = emp.id;
    this.selectedEmployeeName = emp.prenom + ' ' + emp.nom;
    this.autoForm.dateAutorisation = new Date().toISOString().slice(0, 10);
    this.showAutorisationModal = true;
  }



  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    public readonly presence: PresenceService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.api.getManagers().subscribe({
      next: (m) => {
        this.managers = m;
        this.cdr.detectChanges();
      }
    });
  }


  filteredEmployees(): EmployeeView[] {
    const q = this.query.toLowerCase().trim();
    return this.employees.filter((e) => {
      const matchesText =
        !q ||
        `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
        (e.poste || '').toLowerCase().includes(q);
      let matchesStatus = true;
      if (this.statusFilter === 'online') {
        matchesStatus = this.presence.isUserOnline(e.id);
      } else if (this.statusFilter === 'offline') {
        matchesStatus = !this.presence.isUserOnline(e.id);
      }
      const matchesEmployee = this.selectedEmployeId === 'all' || Number(e.id) === Number(this.selectedEmployeId);
      return matchesText && matchesStatus && matchesEmployee;
    });
  }

  initials(firstName: string, lastName: string): string {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  }

  openAbsenceModal(emp: EmployeeView): void {
    this.selectedEmployee = emp;
    this.showAbsenceModal = true;
    const now = new Date();
    const today = now.toISOString().slice(0, 16);
    this.absenceForm.dateDebut = today;
  }

  closeAbsenceModal(): void {
    this.showAbsenceModal = false;
    this.selectedEmployee = null;
    this.absenceForm = { dateDebut: '' };
  }

  isAbsenceFormValid(): boolean {
    return !!this.absenceForm.dateDebut;
  }

  submitAbsence(): void {
    if (!this.selectedEmployee || !this.isAbsenceFormValid()) return;

    this.api.createAbsence({
      employeId: this.selectedEmployee.id,
      dateDebut: this.absenceForm.dateDebut,
      dateFin: this.absenceForm.dateDebut, // Automatic: same as start for irregular single-point record
      type: 'ABSENCE_IRREGULIERE'
    }).subscribe({
      next: () => {
        alert('Absence enregistrée avec succès. L\'employé a 48h pour la justifier.');
        this.closeAbsenceModal();
        // Optionnellement recharger les données si le statut change
      },
      error: (err) => alert('Erreur lors de l’ajout de l’absence : ' + (err.error?.message || 'Erreur inconnue'))
    });
  }

  submitAutorisation(): void {
    if (!this.autoForm.employeId || !this.autoForm.dateAutorisation || !this.autoForm.heures) return;

    const body: Partial<AutorisationSortieDto> = {
      employeId: this.autoForm.employeId,
      dateAutorisation: this.autoForm.dateAutorisation,
      heures: this.autoForm.heures
    };

    this.api.createAutorisation(body).subscribe({
      next: () => {
        this.showAutorisationModal = false;
        this.autoForm = { employeId: null, dateAutorisation: '', heures: 1 };
        alert('Autorisation enregistrée avec succès.');
      },
      error: (err) => alert(err.error?.message || "Erreur lors de la création de l'autorisation")
    });
  }

  openViewModal(emp: EmployeeView): void {
    this.selectedEmployee = emp;
    this.api.getEmployee(emp.id).subscribe({
      next: (data) => {
        this.fullEmployee = data;
        this.showViewModal = true;
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(emp: EmployeeView): void {
    this.selectedEmployee = emp;
    this.api.getEmployee(emp.id).subscribe({
      next: (data) => {
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
      }
    });
  }

  saveEdit(): void {
    if (!this.selectedEmployee || !this.editForm) return;
    this.api.updateEmployee(this.selectedEmployee.id, this.editForm).subscribe({
      next: () => {
        alert('Profil mis à jour avec succès');
        this.showEditModal = false;
        this.loadEmployees();
      },
      error: (err) => alert('Erreur lors de la mise à jour : ' + (err.error?.message || 'Erreur inconnue'))
    });
  }

  deleteEmployee(emp: EmployeeView): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${emp.prenom} ${emp.nom} ? Cette action est irréversible.`)) {
      this.api.deleteEmployee(emp.id).subscribe({
        next: () => {
          alert('Employé supprimé avec succès');
          this.loadEmployees();
        },
        error: (err) => alert('Erreur lors de la suppression : ' + (err.error?.message || 'Erreur inconnue'))
      });
    }
  }

  openAddModal(): void {
    this.newEmp = { 
      prenom: '', nom: '', email: '', telephone: '', poste: '', role: 'EMPLOYEE',
      matricule: '', bureau: '', dateEmbauche: '', manager: '', competences: ''
    };
    this.errors = {};
    this.formSubmitted = false;
    this.showAddModal = true;
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
    return !!(this.newEmp.prenom.trim() && this.newEmp.nom.trim() && this.newEmp.email.trim() && this.newEmp.poste.trim() && this.newEmp.email.includes('@'));
  }

  saveEmployee(): void {
    this.formSubmitted = true;
    if (!this.validateForm()) return;
    this.api.createUser(this.newEmp).subscribe({
      next: () => {
        alert(`Employé créé avec succès.\nMot de passe par défaut : HRPlatform@2026`);
        this.showAddModal = false;
        this.loadEmployees();
      },
      error: (err) => alert("Erreur lors de la création : " + (err.error?.message || "Erreur serveur"))
    });
  }

  private loadEmployees(): void {
    this.api.getEmployees().subscribe({
      next: (res) => {
        this.employees = (res || []).map((e, i) => ({
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          email: e.email,
          telephone: e.telephone || '-',
          poste: e.poste || '-',
          soldeConges: e.joursRestants || 0,
          avatar: e.avatar
        }));
        this.cdr.detectChanges();
      }
    });
  }

  openDocumentModal(emp: EmployeeView): void {
    this.selectedEmployee = emp;
    this.docForm = { type: 'FICHE_PAIE', file: null };
    this.showDocumentModal = true;
  }

  handleFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.docForm.file = file;
    }
  }

  isDocFormValid(): boolean {
    return !!(this.docForm.type && this.docForm.file);
  }

  submitDocument(): void {
    if (!this.selectedEmployee || !this.isDocFormValid()) return;
    this.uploading = true;
    
    this.api.uploadFile(this.docForm.file!).subscribe({
      next: (res: any) => {
        const body = {
          employeId: this.selectedEmployee!.id,
          type: this.docForm.type,
          fileName: res.name,
          fileUrl: res.url
        };
        
        this.api.addDocument(body).subscribe({
          next: () => {
            alert('Document ajouté avec succès');
            this.showDocumentModal = false;
            this.uploading = false;
            this.loadEmployees();
          },
          error: (err) => {
            alert('Erreur lors de l’ajout du document : ' + (err.error?.message || 'Erreur inconnue'));
            this.uploading = false;
          }
        });
      },
      error: () => {
        alert('Erreur lors du téléchargement du fichier');
        this.uploading = false;
      }
    });
  }
}
