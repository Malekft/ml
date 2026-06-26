import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { DemandeDto, TypeCongeDto, SousTypeCongeDto, AbsenceDto, AutorisationSortieDto } from '../../core/api.types';
import {
  LucideAngularModule, AlertTriangle, Clock, Calendar, CheckCircle,
  Info, Upload, Send, X, Plus, Filter, AlertCircle, FileText, Download
} from 'lucide-angular';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PresenceService } from '../../core/presence.service';

/**
 * Employee portal component for managing leave requests, absences, and exit authorizations.
 * Handles leave creation with business rule validation, absence justification, and pagination.
 */
@Component({
  selector: 'app-emp-leaves-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, LucideAngularModule, DatePipe],
  template: `
    <style>
      .date-filter-select { height:36px; padding:0 30px 0 12px; font-size:13px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); outline:none; cursor:pointer; }
      .emp-leave-card {
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease !important;
      }
      .emp-leave-card:hover {
        transform: translateY(-8px) !important;
        box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -5px rgba(0, 0, 0, 0.04) !important;
        border-color: var(--color-primary) !important;
      }
    </style>
    <div class="page-header">
      <div>
        <h2>Gestion du Temps</h2>
        <div class="subtitle">Gérez vos congés, absences et autorisations de sortie</div>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-secondary" style="border-color:var(--color-orange); color:var(--color-orange);" *ngIf="hasUrgentAbsences()" (click)="setTab('absences')">
          <i-lucide [name]="AlertTriangle" [size]="18" style="margin-right:8px;"></i-lucide>
          {{ getUrgentAbsencesCount() }} Absence(s) à justifier !
        </button>
        <button class="btn btn-primary" *ngIf="activeTab !== 'absences' && activeTab !== 'autorisations'" (click)="openModal()">
          <i-lucide [name]="Plus" [size]="18" color="#ffffff"></i-lucide>
          Nouvelle demande
        </button>
      </div>
    </div>

    <!-- Solde Congés -->
    <div class="blue-gradient-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h3>Mon Solde de Congés</h3>
          <p class="value" style="font-size:44px;">{{ solde.joursRestants }} jours</p>
          <div class="subtitle">Disponibles sur {{ solde.joursAccumules }} jours annuels</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="fill" [style.width]="(solde.joursRestants / (solde.joursAccumules || 1) * 100) + '%'" style="background:white;"></div>
      </div>
      <div style="display:flex; gap:24px; margin-top:16px; flex-wrap:wrap;">
        <div>
          <div style="font-size:20px; font-weight:700;">{{ solde.joursAccumules - solde.joursRestants }}</div>
          <div style="font-size:12px; opacity:0.8;">Jours pris</div>
        </div>
        <div>
          <div style="font-size:20px; font-weight:700;">{{ solde.joursRestants }}</div>
          <div style="font-size:12px; opacity:0.8;">Jours restants</div>
        </div>
        <div>
          <div style="font-size:20px; font-weight:700;">{{ solde.joursAccumules }}</div>
          <div style="font-size:12px; opacity:0.8;">Total annuel</div>
        </div>
        <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 20px;">
          <div style="font-size:20px; font-weight:700;">{{ solde.heuresSortie }} <span style="font-size:14px;font-weight:500;">heures cumulées</span></div>
          <div style="font-size:12px; opacity:0.8;">
            Soit <strong>{{ getJoursDeduits() }}</strong> jour(s) déduit(s) financièrement
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs & Filters -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div class="tab-bar" style="margin-bottom:0;">
        <button
          *ngFor="let tab of tabs"
          class="tab-btn"
          [class.active]="activeTab === tab.value"
          (click)="setTab(tab.value)"
        >
          <div style="display:flex; align-items:center; gap:8px;">
            {{ tab.label }}
            <span *ngIf="tab.value === 'absences' && getUrgentAbsencesCount() > 0" 
                  class="badge-dot" 
                  style="width:8px; height:8px; background:var(--color-orange); border-radius:50%;"></span>
          </div>
        </button>
      </div>

      <!-- Date Filter -->
      <div style="display:flex; align-items:center; gap:8px;" *ngIf="activeTab !== 'absences'">
        <i-lucide [name]="Filter" [size]="14" color="var(--text-muted)"></i-lucide>
        <span style="font-size:13px; color:var(--text-muted); font-weight:500;">Filtrer :</span>
        <select [(ngModel)]="selectedYear" (ngModelChange)="applyDateFilter()" class="date-filter-select">
          <option [ngValue]="null">Toutes les années</option>
          <option *ngFor="let y of getAvailableYears()" [ngValue]="y">{{ y }}</option>
        </select>
        
        <select [(ngModel)]="selectedMonth" (ngModelChange)="applyDateFilter()" [disabled]="!selectedYear" [style.opacity]="!selectedYear ? '0.5' : '1'" class="date-filter-select">
          <option [ngValue]="null">Tous les mois</option>
          <option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option>
        </select>
      </div>
    </div>

    <!-- Cards Grid -->
    <!-- Cards Grid (Congés) -->
    <div class="emp-leaves-grid" *ngIf="activeTab !== 'absences' && activeTab !== 'autorisations'">
      <div *ngFor="let d of paginatedDemands(); trackBy: trackById" class="card emp-leave-card">
        <!-- Existing leaf card content -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700; font-size:15px; color:var(--text-main);">
              {{ d.typeCongeNom }}
              <span *ngIf="d.sousTypeCongeNom" style="font-weight:400; color:var(--text-muted); font-size:13px; margin-left:4px;">
                ({{ d.sousTypeCongeNom }})
              </span>
            </div>
            <div *ngIf="d.sousTypeCongeNom === 'LONGUE_DUREE' && d.statut !== 'REFUSEE'" 
                 [style.background]="getSalaryStatusColor(d, 'bg')" 
                 [style.color]="getSalaryStatusColor(d, 'text')" 
                 style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; margin-top:6px; display:inline-block; border:1px solid currentColor;">
              <i-lucide [name]="Info" [size]="10" style="vertical-align:middle; margin-right:4px;"></i-lucide>
              {{ getSalaryStatusLabel(d) }}
            </div>
            <div class="muted" style="font-size:12px; margin-top:2px;">
              <i-lucide [name]="Calendar" [size]="12" style="vertical-align:middle;"></i-lucide>
              {{ formatDateRange(d.dateDebut, d.dateFin) }}
            </div>
          </div>
          <span class="chip" 
                [class.chip-orange]="d.statut === 'EN_ATTENTE'" 
                [class.chip-green]="d.statut === 'APPROUVEE'" 
                [class.chip-red]="d.statut === 'REFUSEE'"
                [style.background]="d.statut === 'ANNULEE' ? 'var(--bg-hover)' : null"
                [style.color]="d.statut === 'ANNULEE' ? 'var(--text-muted)' : null">
            {{ getStatutLabel(d.statut) }}
          </span>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-top:16px; padding-top:12px; border-top:1px solid var(--border-light);">
          <div class="muted" style="font-size:13px;">
            <i-lucide [name]="Clock" [size]="13" style="vertical-align:middle;"></i-lucide>
            Durée: <strong style="color:var(--text-main);">{{ d.dureeJours }} jours</strong>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
             <a *ngIf="d.justificatifUrl" [href]="getFullUrl(d.justificatifUrl)" target="_blank" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Visualiser">
               <i-lucide [name]="FileText" [size]="12"></i-lucide>
               Voir
             </a>
             <a *ngIf="d.justificatifUrl" [href]="getDownloadUrl(d.justificatifUrl)" class="link-blue" style="font-size:12px; display:flex; align-items:center; gap:4px;" title="Télécharger">
               <i-lucide [name]="Download" [size]="12"></i-lucide>
             </a>
             <div class="muted" style="font-size:12px;">Créé le {{ formatCreationDate(d.dateCreation) }}</div>
          </div>
        </div>

        <div *ngIf="d.statut === 'REFUSEE' && d.motifRefus" style="margin-top:12px; padding:10px; background:rgba(239,68,68,0.05); border-left:3px solid #ef4444; border-radius:4px;">
          <div style="font-size:12px; font-weight:600; color:var(--color-red); margin-bottom:4px;">Motif du refus :</div>
          <div style="font-size:13px; color:var(--text-main);">{{ d.motifRefus }}</div>
        </div>

        <div *ngIf="d.statut === 'EN_ATTENTE' && canCancel(d.dateCreation)" style="margin-top:12px;">
          <button class="btn btn-secondary" style="width:100%; padding:8px; font-size:13px; justify-content:center;" (click)="cancelDemand(d)">
            <i-lucide [name]="X" [size]="14" color="var(--color-red)"></i-lucide>
            Annuler ma demande
          </button>
        </div>
        <div *ngIf="d.statut === 'EN_ATTENTE' && !canCancel(d.dateCreation)" style="margin-top:12px; text-align:center;">
          <span class="muted" style="font-size:12px;">Délai d'annulation (60s) dépassé.</span>
        </div>
      </div>
    </div>

    <!-- Absences List -->
    <div class="emp-absences-list" *ngIf="activeTab === 'absences'">
      <div *ngFor="let a of paginatedAbsences(); trackBy: trackById" class="card" style="margin-bottom:16px; border-left:4px solid var(--color-orange);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h4 style="margin:0; font-size:16px;">Absence Irrégulière</h4>
              <span class="chip" [ngClass]="{
                'chip-green': a.justifiee,
                'chip-orange': a.statut === 'EN_ATTENTE' || (!a.justifiee && a.statut === 'TEMPORAIRE' && !isDefinitive(a)),
                'chip-red': isDefinitive(a)
              }">
                {{ a.justifiee ? 'Justifiée' : (a.statut === 'EN_ATTENTE' ? 'En attente de validation' : (isDefinitive(a) ? 'Absence Définitive' : 'À justifier')) }}
              </span>
            </div>
            <p class="muted" style="margin:4px 0 0; font-size:13px;">
              Période : {{ a.dateDebut | date:'dd/MM/yyyy HH:mm' }}
            </p>
          </div>
          
          <div *ngIf="a.statut === 'TEMPORAIRE' && !isDefinitive(a)" style="text-align:right;">
             <div style="display:flex; align-items:center; gap:6px; color:var(--color-red); font-weight:600; font-size:13px; margin-bottom:8px;">
                <i-lucide [name]="Clock" [size]="14"></i-lucide>
                Temps restant: {{ getTimeLeft(a.dateLimiteJustification) }}
             </div>
             <button class="btn btn-primary" style="background:var(--color-orange); border-color:var(--color-orange);" (click)="openJustifyModal(a)">
                Justifier maintenant
             </button>
          </div>

          <div *ngIf="isDefinitive(a)" style="text-align:right; color:var(--color-red);">
            <div style="font-size:12px; font-weight:700;">Délai de 48h dépassé</div>
            <div style="font-size:11px;">Pénalité : 5 jours déduits</div>
          </div>
        </div>
      </div>
      
      <div *ngIf="absences.length === 0" style="text-align:center; padding:40px; color:var(--text-muted);">
        <i-lucide [name]="CheckCircle" [size]="40" color="var(--color-green)" style="margin-bottom:12px;"></i-lucide>
        <p>Toutes vos absences sont en règle !</p>
      </div>
    </div>

    <!-- Autorisations List -->
    <div class="emp-autorisations-list" *ngIf="activeTab === 'autorisations'">
      <div *ngFor="let a of paginatedAutorisations(); trackBy: trackById" class="card" style="margin-bottom:16px; border-left:4px solid var(--color-primary);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h4 style="margin:0; font-size:16px;">Autorisation de sortie</h4>
              <span class="chip chip-green">Approuvée</span>
            </div>
            <p class="muted" style="margin:4px 0 0; font-size:13px;">
              Date : {{ a.dateAutorisation | date:'dd/MM/yyyy' }}
            </p>
          </div>
          <div style="text-align:right;">
             <div style="font-size:18px; font-weight:700; color:var(--text-main);">
               {{ a.heures }} h
             </div>
             <div class="muted" style="font-size:11px;">Heures déduites</div>
          </div>
        </div>
      </div>
      
      <div *ngIf="autorisations.length === 0" style="text-align:center; padding:40px; color:var(--text-muted);">
        <i-lucide [name]="CheckCircle" [size]="40" color="var(--color-green)" style="margin-bottom:12px;"></i-lucide>
        <p>Aucune autorisation de sortie enregistrée.</p>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div class="pagination-row" *ngIf="getTotalPages() > 1" style="display:flex; justify-content:center; align-items:center; gap:20px; margin: 30px 0; padding-bottom: 20px;">
      <button class="btn btn-secondary" [disabled]="currentPage === 1" (click)="prevPage()" style="padding: 8px 16px;">
        <i-lucide [name]="X" [size]="14" style="transform: rotate(180deg);"></i-lucide>
        Précédent
      </button>
      <span style="font-weight: 600; color: var(--text-muted); font-size: 14px;">
        Page <span style="color: var(--color-primary);">{{ currentPage }}</span> sur {{ getTotalPages() }}
      </span>
      <button class="btn btn-secondary" [disabled]="currentPage === getTotalPages()" (click)="nextPage()" style="padding: 8px 16px;">
        Suivant
        <i-lucide [name]="X" [size]="14"></i-lucide>
      </button>
    </div>

    <!-- Justification Modal -->
    <div class="modal-overlay" *ngIf="showJustifyModal">
      <div class="modal-card" style="max-width:450px;">
        <h2>Justifier mon absence</h2>
        <p class="muted">Veuillez fournir un justificatif (certificat médical, etc.) pour régulariser votre situation.</p>
        
        <div style="padding:16px; background:rgba(249,115,22,0.05); border-radius:8px; border:1px solid rgba(249,115,22,0.2); margin-bottom:20px;">
          <div style="font-size:13px; color:var(--text-main); font-weight:600; margin-bottom:4px;">Rappel important</div>
          <div style="font-size:12px; color:var(--text-muted);">Vous avez 48h après l'enregistrement de l'absence pour soumettre votre justificatif.</div>
        </div>

        <div class="form-group">
          <label>Document justificatif (PDF ou Image)</label>
          <div style="padding:24px; border:2px dashed var(--border-color); border-radius:12px; text-align:center; cursor:pointer;" (click)="fileInput.click()">
            <input type="file" #fileInput (change)="onFileSelected($event)" style="display:none" accept=".pdf,image/*">
            <i-lucide [name]="Upload" [size]="32" color="var(--color-primary)" style="margin-bottom:12px;"></i-lucide>
            <div style="font-weight:600; color:var(--text-main);">{{ selectedFile ? selectedFile.name : 'Cliquez pour uploader' }}</div>
            <div class="muted" style="font-size:12px; margin-top:4px;">Format supporté: PDF, JPG, PNG</div>
          </div>
        </div>

        <div class="btn-row" style="margin-top:12px;">
          <button class="btn btn-secondary" (click)="closeJustifyModal()">Annuler</button>
          <button class="btn btn-primary" [disabled]="!selectedFile" (click)="submitJustification()">
            Finaliser la justification
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="activeTab !== 'absences' && activeTab !== 'autorisations' && filteredDemands().length === 0" style="text-align:center; padding:60px 20px; color:var(--text-muted);">
      <i-lucide [name]="Calendar" [size]="48" color="var(--border-color)" style="margin-bottom:16px;"></i-lucide>
      <p style="font-size:16px; font-weight:600;">Aucune demande trouvée</p>
      <p class="muted">Vous n'avez pas encore de demande dans cette catégorie.</p>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal">
      <form class="modal-card" (ngSubmit)="submitDemand()">
        <h2>Nouvelle demande de congé</h2>
        <p class="muted">Sélectionnez le type, la période et le motif de votre congé</p>

        <div>
          <label>Type de congé</label>
          <select name="typeConge" [(ngModel)]="form.typeCongeId" (ngModelChange)="onTypeChange()" required>
            <option [ngValue]="null">Sélectionner le type...</option>
            <option *ngFor="let t of leaveTypes" [ngValue]="t.id">{{ t.nom }}</option>
          </select>
          <div *ngIf="typeError" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ typeError }}
          </div>
        </div>

        <div *ngIf="getRemainingDaysForCurrentType() <= 0 && form.sousTypeCongeId" 
             style="margin-top:12px; padding:12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:var(--color-red); font-size:13px; display:flex; align-items:center; gap:10px;">
          <i-lucide [name]="AlertCircle" [size]="18"></i-lucide>
          <div>
            <strong>Quota épuisé !</strong> Vous avez déjà utilisé l'intégralité de vos jours pour ce motif cette année.
          </div>
        </div>

        <div *ngIf="form.typeCongeId === 3" style="margin-top:8px; padding:10px; background:rgba(246,173,85,0.1); border-left:4px solid #f6ad55; border-radius:4px; font-size:13px; color:var(--text-main);">
          <i-lucide [name]="AlertCircle" [size]="14" style="vertical-align:middle; margin-right:6px; color:#f6ad55;"></i-lucide>
          <strong>Note importante :</strong> Le justificatif officiel doit être soumis dans un délai de 48 heures.
        </div>
        <div *ngIf="form.typeCongeId === 2" style="margin-top:8px; padding:10px; background:rgba(239,68,68,0.05); border-left:4px solid #ef4444; border-radius:4px; font-size:13px; color:var(--text-main);">
          <i-lucide [name]="AlertCircle" [size]="14" style="vertical-align:middle; margin-right:6px; color:#ef4444;"></i-lucide>
          <strong>Note importante :</strong> Le certificat médical doit être soumis dans un délai de 48 heures. Il est accepté uniquement s’il est délivré par un hôpital public.
        </div>

        <div *ngIf="sousTypes.length > 0">
          <label>Sous-type de congé</label>
          <select name="sousTypeConge" [(ngModel)]="form.sousTypeCongeId" required>
            <option [ngValue]="null">Sélectionner le motif...</option>
            <option *ngFor="let st of sousTypes" [ngValue]="st.id">{{ st.nom }} (Max: {{ st.maxJours }}j)</option>
          </select>
          <div *ngIf="sousTypeError" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ sousTypeError }}
          </div>
          
          <!-- Paternité Notice -->
          <div *ngIf="isSubtypeActive('PATERNITE')" style="margin-top:8px; padding:10px; background:rgba(0,123,255,0.1); border-left:4px solid var(--color-primary); border-radius:4px; font-size:13px; color:var(--text-main);">
            <i-lucide [name]="Info" [size]="14" style="vertical-align:middle; margin-right:6px;"></i-lucide>
            <strong>Note Paternité :</strong> À prendre impérativement dans les 10 jours suivant l'accouchement.
          </div>

          <!-- Maladie Longue Durée Notice -->
          <div *ngIf="isSubtypeActive('LONGUE_DUREE')" style="margin-top:8px; padding:10px; background:rgba(16,185,129,0.1); border-left:4px solid #10b981; border-radius:4px; font-size:13px; color:var(--text-main);">
            <i-lucide [name]="Info" [size]="14" style="vertical-align:middle; margin-right:6px; color:#10b981;"></i-lucide>
            <strong>Conditions Maladie Longue Durée :</strong>
            <ul style="margin:4px 0 0 20px; padding:0;">
              <li>1 mois avec salaire complet.</li>
              <li>5 mois avec moitié de salaire.</li>
              <li>7 jours au plus au minmum.</li>
              <li>Un retour au travail obligatoire d'au moins 1 semaine est requis après cette période.</li>
            </ul>
          </div>

        </div>

        <div style="display:flex;gap:16px;">
          <div style="flex:1;">
            <label>Date de début</label>
            <input type="date" name="dateDebut" [(ngModel)]="form.dateDebut" 
                   [min]="getMinStartDate()" required />
            <div *ngIf="dateDebutError" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
              {{ dateDebutError }}
            </div>
          </div>
          <div style="flex:1;">
            <label>Date de fin</label>
            <input type="date" name="dateFin" [(ngModel)]="form.dateFin" 
                   [min]="form.dateDebut || getMinStartDate()" 
                   [max]="getMaxEndDate()" required />
            <div *ngIf="dateFinError" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
              {{ dateFinError }}
            </div>
          </div>
        </div>

        <div>
          <label>Motif / Commentaire</label>
          <textarea name="motif" rows="3" [(ngModel)]="form.motif" placeholder="Expliquez la raison de votre demande..."></textarea>
          <div *ngIf="motifError" style="color:var(--color-red); font-size:11px; margin-top:4px; font-weight:500;">
            {{ motifError }}
          </div>
        </div>

        <div *ngIf="isJustificatifRequired()" style="padding:16px; background:var(--bg-app); border:1px dashed var(--border-color); border-radius:var(--radius-sm);">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
            <i-lucide [name]="Upload" [size]="20" color="var(--color-primary)"></i-lucide>
            <span style="font-weight:600;">Joindre un justificatif</span>
            <input type="file" (change)="onFileSelected($event)" style="display:none" accept=".pdf,image/*">
          </label>
          <p *ngIf="selectedFile" style="margin:8px 0 0 30px; color:var(--color-green); font-weight:500;">
            ✓ {{ selectedFile.name }}
          </p>
          <p class="muted" style="margin:4px 0 0 30px; font-size:12px;">Certificat médical ou justificatif officiel requis.</p>
          <div *ngIf="fileError" style="color:var(--color-red); font-size:11px; margin-top:8px; font-weight:500;">
            {{ fileError }}
          </div>
        </div>

        <div *ngIf="submitError" style="color:var(--color-red); font-size:12px; margin-top:12px; font-weight:600; text-align:center;">
          {{ submitError }}
        </div>

        <div class="btn-row" style="justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="submittingDemand">
            <i-lucide [name]="Send" [size]="16" color="#fff"></i-lucide>
            {{ submittingDemand ? 'Envoi...' : 'Soumettre' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class EmpLeavesPageComponent implements OnInit, OnDestroy {
  // Lucide Icons
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Clock = Clock;
  protected readonly Calendar = Calendar;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Info = Info;
  protected readonly Upload = Upload;
  protected readonly Send = Send;
  protected readonly X = X;
  protected readonly Plus = Plus;
  protected readonly Filter = Filter;
  protected readonly AlertCircle = AlertCircle;
  protected readonly FileText = FileText;
  protected readonly Download = Download;

  // Constant Data
  readonly months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  readonly tabs = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Approuvées', value: 'APPROUVEE' },
    { label: 'Refusées', value: 'REFUSEE' },
    { label: 'Annulées', value: 'ANNULEE' },
    { label: 'Absences', value: 'absences' },
    { label: 'Autorisations', value: 'autorisations' }
  ];
  readonly Math = Math;

  // Component State
  activeTab = 'all';
  showModal = false;
  showJustifyModal = false;
  submittingDemand = false;
  currentPage = 1;
  pageSize = 6;
  employeId: number = 0;

  // Data
  leaveTypes: TypeCongeDto[] = [];
  sousTypes: SousTypeCongeDto[] = [];
  myLeaves: DemandeDto[] = [];
  absences: AbsenceDto[] = [];
  autorisations: AutorisationSortieDto[] = [];
  solde = { joursAccumules: 0, joursRestants: 0, annee: 2026, heuresSortie: 0 };

  // Selection & Filters
  selectedFile: File | null = null;
  selectedAbsence: AbsenceDto | null = null;
  selectedYear: number | null = null;
  selectedMonth: number | null = null;

  // Validation Errors
  typeError: string | null = null;
  sousTypeError: string | null = null;
  dateDebutError: string | null = null;
  dateFinError: string | null = null;
  motifError: string | null = null;
  fileError: string | null = null;
  submitError: string | null = null;

  // Form Model
  form = { typeCongeId: null as number | null, sousTypeCongeId: null as number | null, dateDebut: '', dateFin: '', motif: '' };

  private pollingTimer: any;

  setTab(val: string): void {
    this.activeTab = val;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly presence: PresenceService
  ) { }

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('hr_userId')) || 0;
    if (userId > 0) {
      this.presence.connect(userId);
    }

    this.employeId = Number(localStorage.getItem('hr_employeId')) || 0;

    if (this.employeId) {
      this.loadLeaveTypes();
      this.refreshAllData();
      this.initPolling();
    }

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setTab(params['tab']);
      }
    });
  }

  ngOnDestroy(): void {
    this.terminatePolling();
  }

  // --- Data Loading & Polling ---

  private initPolling(): void {
    this.pollingTimer = setInterval(() => this.refreshAllData(), 5000);
  }

  private terminatePolling(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  private refreshAllData(): void {
    if (!this.employeId) return;
    this.loadAbsences();
    this.loadLeaves();
    this.loadSolde();
    this.loadAutorisations();
  }

  loadSolde(): void {
    this.api.getEmployeeSolde(this.employeId).subscribe({
      next: (s) => {
        this.solde = s;
        this.cdr.detectChanges();
      }
    });
  }

  loadAutorisations(): void {
    this.api.getAutorisations(this.employeId).subscribe({
      next: (res) => {
        this.autorisations = res || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadLeaves(): void {
    this.api.getEmployeeLeaves(this.employeId).subscribe({
      next: (leaves) => {
        // Sort leaves by creation date descending (newest first)
        this.myLeaves = leaves.sort((a, b) => {
          return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
        });
        this.cdr.detectChanges();
      }
    });
  }

  formatCreationDate(dateStr: any): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  }

  getFullUrl(path?: string | null): string { return this.api.getFullUrl(path); }
  getDownloadUrl(path?: string | null): string { return this.api.getDownloadUrl(path); }

  formatDateRange(startStr: any, endStr: any): string {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${start.toLocaleDateString('fr-FR', options)} → ${end.toLocaleDateString('fr-FR', options)} ${end.getFullYear()}`;
  }

  loadAbsences(): void {
    if (!this.employeId) return;
    this.api.getEmployeeAbsences(this.employeId).subscribe({
      next: (res) => {
        this.absences = res || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.absences = [];
        this.cdr.detectChanges();
      }
    });
  }

  hasUrgentAbsences(): boolean {
    return this.absences.some(a => a.statut === 'TEMPORAIRE');
  }

  getUrgentAbsencesCount(): number {
    return this.absences.filter(a => a.statut === 'TEMPORAIRE').length;
  }

  getJoursDeduits(): number {
    if (!this.solde) return 0;
    const hoursDeducted = Math.floor((this.solde.heuresSortie || 0) / 8);
    const definitiveAbsences = this.absences.filter(a => this.isDefinitive(a)).length;
    return hoursDeducted + (definitiveAbsences * 5);
  }

  isDefinitive(a: any): boolean {
    if (a.statut === 'DEFINITIVE') return true;
    if (a.statut === 'TEMPORAIRE') {
      const limit = new Date(a.dateLimiteJustification);
      return limit.getTime() <= Date.now();
    }
    return false;
  }

  getTimeLeft(limitStr: any): string {
    const limit = new Date(limitStr);
    const now = new Date();
    const diff = limit.getTime() - now.getTime();
    if (diff <= 0) return 'Délai expiré';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  }

  openJustifyModal(a: AbsenceDto): void {
    if (this.getTimeLeft(a.dateLimiteJustification) === 'Délai expiré') {
      alert("Désolé, le délai légal de 48 heures pour justifier cette absence est écoulé.");
      return;
    }
    this.selectedAbsence = a;
    this.showJustifyModal = true;
  }

  closeJustifyModal(): void {
    this.showJustifyModal = false;
    this.selectedAbsence = null;
    this.selectedFile = null;
  }

  submitJustification(): void {
    if (!this.selectedAbsence || !this.selectedFile) return;

    this.api.uploadFile(this.selectedFile).subscribe({
      next: (fileRes) => {
        if (this.selectedAbsence) {
          this.api.justifyAbsence(this.selectedAbsence.id, fileRes.url).subscribe({
            next: () => {
              alert('Justificatif envoyé avec succès ! Votre absence est maintenant en attente de validation par l\'administration.');
              this.closeJustifyModal();
              this.loadAbsences();
            },
            error: (err) => alert(err.error?.message || 'Erreur lors de l\'envoi du justificatif')
          });
        }
      },
      error: (err) => alert('Erreur lors de l\'upload du fichier')
    });
  }

  loadLeaveTypes(): void {
    this.api.getLeaveTypes().subscribe({
      next: (types) => {
        this.leaveTypes = types;
        this.cdr.detectChanges();
      },
      error: () => {
        this.leaveTypes = [
          { id: 1, nom: 'Congé annuel', categorie: 'Annuel', estPaye: true, maxDays: 24, justificatifObligatoire: false, delaiDemandeJours: 5 },
          { id: 2, nom: 'Congé maladie', categorie: 'Santé', estPaye: true, maxDays: 180, justificatifObligatoire: true, delaiDemandeJours: 0 },
          { id: 3, nom: 'Congé exceptionnel', categorie: 'Spécial', estPaye: true, maxDays: 30, justificatifObligatoire: true, delaiDemandeJours: 1 }
        ];
        this.cdr.detectChanges();
      }
    });
  }

  getMinStartDate(): string {
    const isAnnual = this.form.typeCongeId === 1;
    // Pour l'annuel c'est 5j à l'avance, sinon au minimum demain (1j)
    const minDays = isAnnual ? 5 : 1;
    const d = new Date();
    d.setDate(d.getDate() + minDays);
    return d.toISOString().split('T')[0];
  }

  getMaxEndDate(): string | undefined {
    if (!this.form.dateDebut) return undefined;

    let maxDays = 90; // Valeur par défaut

    if (this.form.typeCongeId === 1) {
      maxDays = 2; // Règle: Max 2 jours pour annuel
    } else if (this.form.sousTypeCongeId) {
      const st = this.sousTypes.find(s => s.id === this.form.sousTypeCongeId);
      if (st) {
        const currentYear = new Date().getFullYear();
        // On calcule combien il reste sur ce quota POUR L'ANNÉE EN COURS
        let usedDays = 0;
        this.myLeaves.forEach(d => {
          const leaveYear = new Date(d.dateDebut || d.dateCreation).getFullYear();
          if (d.sousTypeCongeId === st.id &&
            leaveYear === currentYear &&
            (d.statut === 'APPROUVEE' || d.statut === 'EN_ATTENTE')) {
            usedDays += (d.dureeJours || 0);
          }
        });
        maxDays = st.maxJours - usedDays;
        if (maxDays < 0) maxDays = 0;
      }
    }

    const d = new Date(this.form.dateDebut);
    // Si le quota est à 0, on bloque à la date de début elle-même pour éviter les bugs de calendrier
    const offset = maxDays > 0 ? (maxDays - 1) : 0;
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }

  onTypeChange(): void {
    this.sousTypes = [];
    this.form.sousTypeCongeId = null;
    this.selectedFile = null;
    if (this.form.typeCongeId) {
      this.api.getSousTypes(this.form.typeCongeId).subscribe({
        next: (res) => { this.sousTypes = res; this.cdr.detectChanges(); },
        error: () => {
          if (this.form.typeCongeId === 3) {
            this.sousTypes = [
              { id: 1, typeCongeId: 3, nom: 'DECES', maxJours: 6 },
              { id: 2, typeCongeId: 3, nom: 'MARIAGE', maxJours: 7 },
              { id: 8, typeCongeId: 3, nom: 'MATERNITE', maxJours: 112 },
              { id: 3, typeCongeId: 3, nom: 'PATERNITE', maxJours: 7 },
              { id: 4, typeCongeId: 3, nom: 'Visite d’une institution gouvernementale', maxJours: 1 },
              { id: 7, typeCongeId: 3, nom: 'Congé d\'accompagnement', maxJours: 1 }
            ];
          } else if (this.form.typeCongeId === 2) {
            this.sousTypes = [
              { id: 5, typeCongeId: 2, nom: 'MALADIE_ORDINAIRE', maxJours: 5 },
              { id: 6, typeCongeId: 2, nom: 'LONGUE_DUREE', maxJours: 180 }
            ];
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  isSubtypeActive(nom: string): boolean {
    if (!this.form.sousTypeCongeId) return false;
    const st = this.sousTypes.find(s => s.id === this.form.sousTypeCongeId);
    return st?.nom === nom;
  }

  isJustificatifRequired(): boolean {
    if (!this.form.typeCongeId) return false;
    const type = this.leaveTypes.find(t => t.id === this.form.typeCongeId);
    return type ? type.justificatifObligatoire : false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  // Note: getTypeIcon and getTypeClass were removed as they were unused in the template.

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'APPROUVEE': 'Approuvée',
      'REFUSEE': 'Refusée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getRemainingDaysForCurrentType(): number {
    if (!this.form.sousTypeCongeId) return 99;
    const st = this.sousTypes.find(s => s.id === this.form.sousTypeCongeId);
    if (!st) return 99;

    const currentYear = new Date().getFullYear();
    let usedDays = 0;
    this.myLeaves.forEach(d => {
      const leaveYear = new Date(d.dateDebut || d.dateCreation).getFullYear();
      if (d.sousTypeCongeId === st.id &&
        leaveYear === currentYear &&
        (d.statut === 'APPROUVEE' || d.statut === 'EN_ATTENTE')) {
        usedDays += (d.dureeJours || 0);
      }
    });
    return st.maxJours - usedDays;
  }

  countByStatus(status: string): number {
    if (status === 'all') return this.myLeaves.length;
    return this.myLeaves.filter(d => d.statut === status).length;
  }

  getSalaryStatusLabel(d: any): string {
    if (d.sousTypeCongeNom !== 'LONGUE_DUREE') return '';
    const currentYear = new Date(d.dateDebut || d.dateCreation).getFullYear();
    let daysBefore = 0;
    const mldLeaves = this.myLeaves
      .filter(l => (l.sousTypeCongeNom === 'LONGUE_DUREE' || l.sousTypeCongeId === 6) && l.statut === 'APPROUVEE')
      .sort((a, b) => new Date(a.dateDebut || '').getTime() - new Date(b.dateDebut || '').getTime());
    for (const l of mldLeaves) {
      if (l.id === d.id) break;
      const lYear = new Date(l.dateDebut || l.dateCreation).getFullYear();
      if (lYear === currentYear) daysBefore += (l.dureeJours || 0);
    }
    if (daysBefore >= 30) return 'Demi-Salaire (50%)';
    if (daysBefore + (d.dureeJours || 0) <= 30) return 'Salaire Complet (100%)';
    return 'Demi-Salaire (50%)';
  }

  getSalaryStatusColor(d: any, type: 'bg' | 'text'): string {
    const label = this.getSalaryStatusLabel(d);
    if (label.includes('Complet')) return type === 'bg' ? 'rgba(16,185,129,0.1)' : '#10b981';
    if (label.includes('Demi')) return type === 'bg' ? 'rgba(239,68,68,0.1)' : '#ef4444';
    return type === 'bg' ? 'rgba(245,158,11,0.1)' : '#f59e0b';
  }

  filteredDemands(): any[] {
    let filtered = this.myLeaves;
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(d => d.statut === this.activeTab);
    } else {
      // Si "Toutes" est sélectionné, on n'affiche pas les demandes annulées
      filtered = filtered.filter(d => d.statut !== 'ANNULEE');
    }

    if (this.selectedYear !== null) {
      filtered = filtered.filter(d => new Date(d.dateCreation).getFullYear() === this.selectedYear);
    }

    if (this.selectedYear !== null && this.selectedMonth !== null) {
      filtered = filtered.filter(d => (new Date(d.dateCreation).getMonth() + 1) === this.selectedMonth);
    }

    return filtered;
  }

  paginatedDemands(): any[] {
    const filtered = this.filteredDemands();
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  paginatedAbsences(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.absences.slice(start, start + this.pageSize);
  }

  paginatedAutorisations(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.autorisations.slice(start, start + this.pageSize);
  }

  getTotalPages(): number {
    let totalItems = 0;
    if (this.activeTab === 'absences') {
      totalItems = this.absences.length;
    } else if (this.activeTab === 'autorisations') {
      totalItems = this.autorisations.length;
    } else {
      totalItems = this.filteredDemands().length;
    }
    return Math.ceil(totalItems / this.pageSize) || 1;
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.cdr.detectChanges();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getAvailableYears(): number[] {
    const years = this.myLeaves.map(d => new Date(d.dateCreation).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }

  applyDateFilter(): void {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  clearErrors(): void {
    this.typeError = null;
    this.sousTypeError = null;
    this.dateDebutError = null;
    this.dateFinError = null;
    this.motifError = null;
    this.fileError = null;
    this.submitError = null;
  }

  openModal(): void {
    this.showModal = true;
    this.clearErrors();
  }
  closeModal(): void {
    this.showModal = false;
    this.form = { typeCongeId: null, sousTypeCongeId: null, dateDebut: '', dateFin: '', motif: '' };
    this.sousTypes = [];
    this.selectedFile = null;
    this.submittingDemand = false;
    this.clearErrors();
  }

  validateForm(): boolean {
    let isValid = true;
    this.clearErrors();

    if (!this.form.typeCongeId) {
      this.typeError = "Veuillez sélectionner un type de congé.";
      isValid = false;
    } else if (this.sousTypes.length > 0 && !this.form.sousTypeCongeId) {
      this.sousTypeError = "Veuillez préciser le sous-type / motif.";
      isValid = false;
    }

    if (!this.form.dateDebut) {
      this.dateDebutError = "La date de début est obligatoire.";
      isValid = false;
    } else if (this.form.typeCongeId === 4 || this.isSubtypeActive('MATERNITE')) {
      // Validation 15 jours à l'avance pour Maternité (soit en type direct, soit en sous-type)
      const start = new Date(this.form.dateDebut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 15) {
        this.dateDebutError = "Le congé de maternité doit être demandé au moins 15 jours à l'avance.";
        isValid = false;
      }
    }

    if (!this.form.dateFin) {
      this.dateFinError = "La date de fin est obligatoire.";
      isValid = false;
    }

    if (this.form.dateDebut && this.form.dateFin) {
      const d1 = new Date(this.form.dateDebut);
      const d2 = new Date(this.form.dateFin);
      if (d2 < d1) {
        this.dateFinError = "La date de fin ne peut pas être antérieure à la date de début.";
        isValid = false;
      }
    }

    if (!this.form.motif || !this.form.motif.trim()) {
      this.motifError = "Veuillez fournir un motif ou un commentaire expliquant votre demande.";
      isValid = false;
    }

    if (this.isJustificatifRequired() && !this.selectedFile) {
      this.fileError = "Un justificatif est strictement requis pour ce type de congé.";
      isValid = false;
    }

    return isValid;
  }

  submitDemand(): void {
    if (!this.validateForm()) return;

    // Validation spécifique Congé Annuel (Limité à 2 jours par mois calendaire)
    if (this.form.typeCongeId === 1) {
      const start = new Date(this.form.dateDebut);
      const end = new Date(this.form.dateFin);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const reqMonth = start.getMonth();
      const reqYear = start.getFullYear();

      let daysTakenThisMonth = 0;
      this.myLeaves.forEach(d => {
        if ((d.typeCongeId === 1 || (d.typeCongeNom && d.typeCongeNom.toLowerCase().includes('annuel')))
          && (d.statut === 'APPROUVEE' || d.statut === 'EN_ATTENTE')) {
          if (d.dateDebut) {
            const dStart = new Date(d.dateDebut);
            if (dStart.getMonth() === reqMonth && dStart.getFullYear() === reqYear) {
              let duree = d.dureeJours;
              if (!duree && d.dateFin) {
                const ds = new Date(d.dateDebut);
                const de = new Date(d.dateFin);
                duree = Math.ceil(Math.abs(de.getTime() - ds.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              }
              daysTakenThisMonth += (duree || 0);
            }
          }
        }
      });

      if (daysTakenThisMonth + diffDays > 2) {
        if (daysTakenThisMonth === 0) {
          this.submitError = 'Refus : Le congé annuel est strictement limité à 2 jours maximum par mois.';
        } else {
          const reste = 2 - daysTakenThisMonth;
          if (reste <= 0) {
            this.submitError = 'Refus : Vous avez déjà consommé l\'intégralité de vos 2 jours de congé annuel pour ce mois-ci.';
          } else {
            this.submitError = `Refus : Vous avez déjà consommé ${daysTakenThisMonth} jour(s) de congé annuel ce mois-ci. Il ne vous reste que ${reste} jour(s) disponible(s).`;
          }
        }
        return;
      }
    }

    // Validation spécifique Sous-types (ex: DECES 6j, MALADIE_ORDINAIRE 5j)
    if (this.form.sousTypeCongeId) {
      const st = this.sousTypes.find(s => s.id === this.form.sousTypeCongeId);
      if (st) {
        const start = new Date(this.form.dateDebut);
        const end = new Date(this.form.dateFin);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Validation 7 jours minimum pour Longue Durée
        if (st.nom === 'LONGUE_DUREE' && diffDays < 7) {
          this.submitError = "Refus : Le congé Maladie Longue Durée doit être d'au moins 7 jours.";
          return;
        }

        let usedDays = 0;
        const currentYear = new Date().getFullYear();
        this.myLeaves.forEach(d => {
          const leaveYear = new Date(d.dateDebut || d.dateCreation).getFullYear();
          if (d.sousTypeCongeId === st.id &&
            leaveYear === currentYear &&
            (d.statut === 'APPROUVEE' || d.statut === 'EN_ATTENTE')) {
            usedDays += (d.dureeJours || 0);
          }
        });

        const totalPlanned = usedDays + diffDays;
        if (totalPlanned > st.maxJours) {
          const rest = st.maxJours - usedDays;
          if (rest <= 0) {
            this.submitError = `Refus : Vous avez déjà utilisé l'intégralité de votre quota pour "${st.nom}" (${st.maxJours} jours).`;
          } else {
            this.submitError = `Refus : Le congé "${st.nom}" est limité à ${st.maxJours} jours au total. Il ne vous reste que ${rest} jour(s) disponible(s), mais vous en demandez ${diffDays}.`;
          }
          return;
        }
      }
    }

    // Validation spécifique Congé Maternité
    if (this.form.typeCongeId === 4 || this.isSubtypeActive('MATERNITE')) {
      const start = new Date(this.form.dateDebut);
      const end = new Date(this.form.dateFin);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 112) {
        this.submitError = 'Refus : Le congé maternité est limité à 112 jours maximum (16 semaines).';
        return;
      }
    }

    this.submittingDemand = true;

    if (this.selectedFile) {
      this.api.uploadFile(this.selectedFile).subscribe({
        next: (res) => this.performCreateDemand(res.url),
        error: () => {
          this.submittingDemand = false;
          this.submitError = "Une erreur est survenue lors de l'envoi du document.";
        }
      });
    } else {
      this.performCreateDemand();
    }
  }

  private performCreateDemand(fileUrl?: string): void {
    this.api.createDemand({
      employeId: this.employeId,
      typeCongeId: this.form.typeCongeId!,
      sousTypeCongeId: this.form.sousTypeCongeId || undefined,
      dateDebut: this.form.dateDebut,
      dateFin: this.form.dateFin,
      motif: this.form.motif,
      justificatifUrl: fileUrl
    }).subscribe({
      next: () => {
        this.closeModal();
        this.loadLeaves();
        this.loadSolde();
      },
      error: (err) => {
        this.submittingDemand = false;
        this.submitError = err.error?.message || 'Une erreur système est survenue lors de la soumission.';
      }
    });
  }

  canCancel(dateCreation: string): boolean {
    if (!dateCreation) return false;
    return (Date.now() - new Date(dateCreation).getTime()) <= 60000;
  }

  cancelDemand(d: any): void {
    if (!this.canCancel(d.dateCreation)) {
      alert("Le délai d'annulation de 60 secondes est dépassé.");
      this.loadLeaves();
      return;
    }

    if (confirm('Voulez-vous vraiment annuler cette demande ?')) {
      this.api.cancelDemand(d.id, this.employeId).subscribe({
        next: () => this.refreshAllData(),
        error: (err) => alert(err.error?.message || "Erreur lors de l'annulation")
      });
    }
  }

  trackById(_: number, item: any): any { return item.id; }
}
