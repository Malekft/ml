import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, AlertTriangle, Calendar, Ticket, Briefcase, MessageSquare, ArrowRight, Clock, Megaphone } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { PresenceService } from '../../core/presence.service';
import { AnnouncementDto } from '../../core/api.types';
import { Subscription } from 'rxjs';
import { AvatarColorPipe } from '../../core/avatar-color.pipe';
import { InitialsPipe } from '../../core/initials.pipe';

@Component({
  selector: 'app-emp-dashboard-page',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, LucideAngularModule, CommonModule, AvatarColorPipe, InitialsPipe],
  template: `
    <!-- Urgent Alert for Absences -->
    <div *ngIf="urgentAbsencesCount > 0" class="card" style="margin-bottom:24px; background:#fff7ed; border:1px solid #ffedd5; display:flex; align-items:center; gap:20px; padding:20px; animation: slideIn 0.5s ease-out;">
      <div style="background:#f97316; width:48px; height:48px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; color:white;">
        <i-lucide [name]="AlertTriangle" [size]="24"></i-lucide>
      </div>
      <div style="flex:1;">
        <h3 style="margin:0; color:#9a3412; font-size:16px; font-weight:700;">Action Requise : Justification d'absence</h3>
        <p style="margin:4px 0 0; color:#b45309; font-size:14px;" *ngIf="urgentAbsencesCount === 1">
          Vous avez <strong>1 absence</strong> qui nécessite un justificatif sous 48h.
        </p>
        <p style="margin:4px 0 0; color:#b45309; font-size:14px;" *ngIf="urgentAbsencesCount > 1">
          Vous avez <strong>{{ urgentAbsencesCount }} absences</strong> qui nécessitent un justificatif sous 48h.
        </p>
      </div>
      <button [routerLink]="['/employee/leaves']" [queryParams]="{tab: 'absences'}" class="btn btn-primary" style="background:#f97316; border-color:#f97316;">
        Justifier maintenant
      </button>
    </div>

    <!-- Autorisations (Early Departures) Alert -->
    <div *ngIf="heuresSortie > 0" class="card" style="margin-bottom:24px; background:#eff6ff; border:1px solid #bfdbfe; display:flex; align-items:center; gap:20px; padding:20px; animation: slideIn 0.5s ease-out;">
      <div style="background:#3b82f6; width:48px; height:48px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; color:white;">
        <i-lucide name="Clock" [size]="24"></i-lucide>
      </div>
      <div style="flex:1;">
        <h3 style="margin:0; color:#1e40af; font-size:16px; font-weight:700;">Autorisations de sortie</h3>
        <p style="margin:4px 0 0; color:#1e3a8a; font-size:14px;">
          Vous avez accumulé <strong>{{ heuresSortie }} heures</strong> d'autorisations de sortie (8 heures = 1 jour déduit financièrement).
        </p>
      </div>
      <button [routerLink]="['/employee/leaves']" [queryParams]="{tab: 'autorisations'}" class="btn btn-primary" style="background:#3b82f6; border-color:#3b82f6;">
        Voir le détail
      </button>
    </div>

    <!-- Welcome Banner -->
    <div class="emp-welcome-banner">
      <div class="emp-welcome-content">
        <div>
          <h2 style="margin:0; font-size:28px; font-weight:800;">Bonjour, {{ prenom }}! 👋</h2>
          <p style="margin:8px 0 0; opacity:0.9; font-size:15px;">Bienvenue dans votre espace personnel. Voici un résumé de votre journée.</p>
        </div>
        <div class="emp-welcome-date">
          <i-lucide [name]="Calendar" [size]="20"></i-lucide>
          <span>{{ today }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <section class="stats-grid" style="margin-bottom:24px;">
      <article class="card emp-stat-card" *ngFor="let stat of statItems">
        <div class="emp-stat-icon" [style.background]="stat.iconBg">
          <i-lucide [name]="stat.iconObj" [size]="22" [color]="stat.iconColor"></i-lucide>
        </div>
        <div>
          <p class="value" [style.color]="stat.iconColor">{{ stat.value }}</p>
          <div class="muted" style="margin-top:4px; font-size:13px;">{{ stat.label }}</div>
        </div>
      </article>
    </section>

    <!-- Latest Announcement -->
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
      <div style="background:rgba(139, 92, 246, 0.1); width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:#8b5cf6;">
        <i-lucide [name]="Megaphone" [size]="18"></i-lucide>
      </div>
      <h3 style="font-size:18px; font-weight:700; margin:0; color:var(--text-main);">Dernière Annonce Management</h3>
    </div>
    <article *ngIf="latestAnnouncement" class="card" style="margin-bottom:24px; border-left:4px solid var(--color-primary); padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="avatar" [ngClass]="(latestAnnouncement.email || latestAnnouncement.author) | avatarColor : latestAnnouncement.avatar" style="width:32px; height:32px; font-size:12px; display: flex; align-items:center; justify-content: center; font-weight: 700;">
            {{ latestAnnouncement.author | initials }}
          </div>
          <span style="font-weight:700; font-size:15px;">{{ latestAnnouncement.title }}</span>
        </div>
        <span class="chip chip-blue" style="font-size:10px; text-transform: uppercase;">{{ latestAnnouncement.status === 'PUBLISHED' ? 'PUBLIÉ' : latestAnnouncement.status }}</span>
      </div>
      <p style="font-size:13px; line-height:1.6; color:var(--text-muted); margin-bottom:16px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
        {{ latestAnnouncement.content }}
      </p>
      <a routerLink="/employee/announcements" style="font-size:13px; font-weight:600; color:var(--color-primary); text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
        Lire la suite <i-lucide [name]="ArrowRight" [size]="14"></i-lucide>
      </a>
    </article>

    <div *ngIf="!latestAnnouncement" class="card" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">
       Aucune annonce récente disponible.
    </div>
  `,
})
export class EmpDashboardPageComponent implements OnInit, OnDestroy {
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  urgentAbsencesCount = 0;
  prenom = 'vous';
  latestAnnouncement: AnnouncementDto | null = null;
  private msgSub?: Subscription;
  private refreshInterval: any;

  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Calendar = Calendar;
  protected readonly ArrowRight = ArrowRight;
  protected readonly Clock = Clock;
  protected readonly Megaphone = Megaphone;

  statItems = [
    { iconObj: Calendar, label: 'Jours de congés restants', value: '--', iconBg: 'var(--color-blue-bg)', iconColor: 'var(--color-blue)' },
    { iconObj: Ticket, label: 'Tickets ouverts', value: '--', iconBg: 'var(--color-orange-bg)', iconColor: 'var(--color-orange)' },
    { iconObj: Briefcase, label: 'Heures sup. ce mois', value: '0h', iconBg: 'var(--color-purple-bg)', iconColor: 'var(--color-purple)' },
    { iconObj: MessageSquare, label: 'Messages non lus', value: '0', iconBg: 'var(--color-green-bg)', iconColor: 'var(--color-green)' }
  ];

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly presence: PresenceService
  ) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('hr_userId')) || 0;
    if (userId > 0) {
      this.presence.connect(userId);
    }
    this.refreshData();
    this.refreshInterval = setInterval(() => this.refreshData(), 1000);
  }

  ngOnDestroy(): void {
    if (this.msgSub) {
      this.msgSub.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshData(): void {
    const email = localStorage.getItem('hr_email') || '';
    if (email) {
      const parts = email.split('@')[0].split('.');
      this.prenom = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    this.api.getEmployees().subscribe({
      next: (employees) => {
        if (employees && employees.length > 0) {
          const emp = employees.find(e => e.email === email) || employees[0];
          this.statItems[0].value = String(emp.joursRestants ?? 0);
          
            if (emp.id) {
              localStorage.setItem('hr_employeId', String(emp.id));
              this.loadAbsences(emp.id);
              this.loadSolde(emp.id);
              this.loadTickets(emp.id);
              this.loadExtraWork(emp.id);
              
              const realUserId = Number(localStorage.getItem('hr_userId')) || 0;
              if (realUserId > 0) {
                this.loadMessages(realUserId);
              }
              this.loadLatestAnnouncement();
            }
          this.cdr.detectChanges();
        }
      }
    });
  }
  heuresSortie = 0;

  private loadSolde(id: number): void {
    this.api.getEmployeeSolde(id).subscribe(res => {
      if (res && res.heuresSortie) {
        this.heuresSortie = res.heuresSortie;
        this.cdr.detectChanges();
      }
    });
  }

  private loadAbsences(id: number): void {
    this.api.getEmployeeAbsences(id).subscribe({
      next: (absences) => {
        this.urgentAbsencesCount = (absences || []).filter((a: any) => !a.justifiee && a.statut === 'TEMPORAIRE').length;
        this.cdr.detectChanges();
      }
    });
  }

  private loadTickets(id: number): void {
    this.api.getEmployeeTickets(id).subscribe({
      next: (tickets) => {
        const openCount = (tickets || []).filter(t => t.statut === 'EN_ATTENTE' || t.statut === 'IN_PROGRESS').length;
        this.statItems[1].value = String(openCount);
        this.cdr.detectChanges();
      }
    });
  }

  private loadExtraWork(id: number): void {
    this.api.getEmployeeExtraWork(id).subscribe({
      next: (works) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let totalHours = 0;
        (works || []).forEach((w: any) => {
          let workDate: Date | null = null;
          if (w.dateTravail) {
            workDate = Array.isArray(w.dateTravail) 
              ? new Date(w.dateTravail[0], w.dateTravail[1]-1, w.dateTravail[2]) 
              : new Date(w.dateTravail);
          }
          if (w.statut === 'APPROUVEE' && workDate && workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear) {
            totalHours += (w.nbHeures || 0);
          }
        });
        this.statItems[2].value = totalHours + 'h';
        this.cdr.detectChanges();
      }
    });
  }

  private loadMessages(userId: number): void {
    this.api.getUnreadCount(userId).subscribe({
      next: (dbUnreadCount) => {
        this.statItems[3].value = String(dbUnreadCount);
        this.cdr.detectChanges();
      }
    });

    this.msgSub = this.presence.messages$.subscribe(data => {
      if (Number(data.receiverId) === userId) {
        const currentTotal = parseInt(this.statItems[3].value, 10) || 0;
        this.statItems[3].value = String(currentTotal + 1);
        this.cdr.detectChanges();
      }
    });
  }

  private loadLatestAnnouncement(): void {
    const userId = Number(localStorage.getItem('hr_userId')) || 0;
    this.api.getAnnouncements(userId).subscribe({
      next: (announcements) => {
        if (announcements && announcements.length > 0) {
          this.latestAnnouncement = announcements[0];
          this.cdr.detectChanges();
        }
      }
    });
  }

}
