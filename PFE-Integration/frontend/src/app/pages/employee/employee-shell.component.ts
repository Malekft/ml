import { Component, HostListener, ChangeDetectorRef, OnInit, OnDestroy, computed } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import {
  LucideAngularModule,
  Calendar,
  Ticket,
  Briefcase,
  User,
  MessageSquare,
  Menu,
  X,
  Search,
  Bell,
  Home,
  Moon,
  Sun,
  CheckCircle,
  FileText,
  LogOut,
  Megaphone,
  Info,
  Phone,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-angular';


import { filter } from 'rxjs/operators';
import { PresenceService } from '../../core/presence.service';
import { ApiService } from '../../core/api.service';
import { Subscription } from 'rxjs';
import { AvatarColorPipe } from '../../core/avatar-color.pipe';
import { InitialsPipe } from '../../core/initials.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, NgFor, NgIf, LucideAngularModule, AvatarColorPipe, InitialsPipe, FormsModule],
  template: `
    <div class="shell">
      <aside class="sidebar emp-sidebar" [ngClass]="{ collapsed: collapsed }">
        <div class="logo-row">
          <div class="logo" *ngIf="!collapsed">
            <img src="/Brycto.jpg" alt="Brycto" style="height: 32px; width: auto; border-radius: 8px;">
            <span>Brycto</span>
          </div>
          <div class="logo" *ngIf="collapsed" style="justify-content: center; width: 100%;">
            <img src="/Brycto.jpg" alt="B" style="height: 28px;">
          </div>
          <button class="icon-btn" (click)="toggleSidebar()" aria-label="Toggle sidebar" *ngIf="!collapsed">
            <i-lucide [name]="collapsed ? Menu : X" [size]="20"></i-lucide>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a
            *ngFor="let item of menu"
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path === '/employee' }"
            class="menu-item"
            [title]="collapsed ? item.label : ''"
          >
            <span class="menu-icon" [style.color]="item.color">
              <i-lucide [name]="item.icon" [size]="20"></i-lucide>
            </span>
            <span *ngIf="!collapsed">{{ item.label }}</span>
            
            <span *ngIf="item.label === 'Messages' && totalUnreadCount() > 0" 
                  style="margin-left: auto; background: var(--color-primary); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: bold;">
              {{ totalUnreadCount() }}
            </span>
          </a>
        </nav>

        <button class="logout" (click)="logout()" [title]="collapsed ? 'Déconnexion' : ''">
          <span class="menu-icon"><i-lucide [name]="LogOut" [size]="20"></i-lucide></span>
          <span *ngIf="!collapsed">Déconnexion</span>
        </button>
      </aside>

      <div class="content" [ngClass]="{ shifted: !collapsed }">
        <header class="topbar emp-topbar">
          <div style="display:flex; align-items:center; gap: 20px;">
            <h1>{{ title }}</h1>
          </div>

          <div style="display:flex; align-items:center; gap:16px;">
            <div class="notification-wrapper" style="position: relative;">
              <button class="notification-btn" (click)="toggleNotifications()">
                <i-lucide [name]="Bell" [size]="20"></i-lucide>
                <span class="notification-dot" *ngIf="unreadNotifs > 0"></span>
              </button>
              
              <div class="notification-dropdown" *ngIf="showNotifications">
                <div class="notification-header">
                  <h3>Notifications ({{ unreadNotifs }})</h3>
                  <button class="notif-mark-read" (click)="markAllRead()">Tout marquer comme lu</button>
                </div>
                <div class="notif-list">
                  <div *ngFor="let n of notifications" 
                       class="notif-item" 
                       [class.unread]="n.unread"
                       (click)="onNotifClick(n)"
                       style="cursor: pointer;">
                    <div class="notif-icon" [style.background]="n.iconBg" [style.color]="n.iconColor">
                      <i-lucide [name]="n.icon" [size]="16"></i-lucide>
                    </div>
                    <div class="notif-content">
                      <div class="notif-title">{{ n.title }}</div>
                      <div class="notif-desc">{{ n.desc }}</div>
                      <div class="notif-time">{{ n.time }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="user-profile-wrapper" style="position: relative;">
              <div class="user-profile" (click)="toggleDropdown()">
                <div class="avatar" [ngClass]="userEmail | avatarColor : userAvatar" style="width: 36px; height: 36px;">{{ userName | initials }}</div>
                <div class="user-info" *ngIf="!isMobile">
                  <span class="user-name">{{ userName }}</span>
                  <span class="user-email">{{ userEmail }}</span>
                </div>
              </div>
              
              <div *ngIf="showDropdown" class="profile-dropdown" style="position: absolute; right: 0; top: 100%; margin-top: 8px; width: 220px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-card); z-index: 100;">
                <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
                  Paramètres
                </div>
                <div style="padding: 8px;">
                  <button class="dropdown-item" (click)="setTheme('light')" [style.background]="!isDarkTheme ? 'var(--bg-hover)' : 'transparent'" [style.color]="!isDarkTheme ? 'var(--color-primary)' : 'var(--text-main)'">
                    <i-lucide [name]="Sun" [size]="16"></i-lucide> Mode Clair
                  </button>
                  <button class="dropdown-item" (click)="setTheme('dark')" [style.background]="isDarkTheme ? 'var(--bg-hover)' : 'transparent'" [style.color]="isDarkTheme ? 'var(--color-primary)' : 'var(--text-main)'">
                    <i-lucide [name]="Moon" [size]="16"></i-lucide> Mode Sombre
                  </button>
                  <div style="border-top:1px solid var(--border-light); margin:4px 0;"></div>
                  <button class="dropdown-item" (click)="openPasswordModal()" style="color:var(--text-main);">
                    <i-lucide [name]="Lock" [size]="16"></i-lucide> Changer mot de passe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main class="page">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Incoming Call Notification (Compact) -->
      <div *ngIf="isIncomingCall()" class="call-notification" style="position:fixed; top:24px; right:24px; width:320px; background:rgba(255, 255, 255, 0.9); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.4); border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.15); z-index:9999; padding:16px; display:flex; flex-direction:column; gap:16px; animation: slideIn 0.3s ease-out;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="avatar" [ngClass]="(callerInfo()?.email || callerInfo()?.name) | avatarColor : callerInfo()?.avatar" style="width:56px; height:56px; font-size:20px; border-radius:50%; display:grid; place-items:center; background:var(--color-primary); color:white; box-shadow:0 4px 10px rgba(0,0,0,0.1);">{{ (callerInfo()?.name || 'U')[0] }}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:16px; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ callerInfo()?.name }}</div>
            <div style="font-size:13px; color:#64748b;">Appel {{ incomingCallType() === 'video' ? 'Vidéo' : 'Audio' }} entrant...</div>
          </div>
        </div>
        
        <div style="display:flex; gap:10px;">
           <button (click)="acceptCall()" style="flex:1; background:#22c55e; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:8px; border:none; color:white; cursor:pointer; font-weight:600; font-size:13px; transition:all 0.2s;">
              <i-lucide [name]="Phone" [size]="16"></i-lucide> Accepter
           </button>
           <button (click)="rejectCall()" style="flex:1; background:#ef4444; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:8px; border:none; color:white; cursor:pointer; font-weight:600; font-size:13px; transition:all 0.2s;">
              <i-lucide [name]="Phone" [size]="16" style="transform: rotate(135deg);"></i-lucide> Refuser
           </button>
        </div>
      </div>

      <!-- Global Active Call Widget (Minimized) -->
      <div *ngIf="isCalling() && !isIncomingCall() && !isCallExpanded()" (click)="expandCallWidget()" style="position:fixed; bottom:24px; right:24px; width:auto; background:var(--bg-card); border:1px solid var(--border-color); border-radius:100px; box-shadow:0 10px 25px rgba(0,0,0,0.1); z-index:9999; padding:8px 16px 8px 8px; display:flex; align-items:center; gap:12px; cursor:pointer; animation: slideUp 0.3s ease-out; transition:transform 0.2s;">
        <div class="avatar" [ngClass]="(callerInfo()?.email || callerInfo()?.name) | avatarColor : callerInfo()?.avatar" style="width:40px; height:40px; font-size:16px; border-radius:50%; display:grid; place-items:center; background:var(--color-primary); color:white;">{{ (callerInfo()?.name || 'U')[0] }}</div>
        <div style="display:flex; flex-direction:column; min-width:100px;">
          <div style="font-weight:600; font-size:14px; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ callerInfo()?.name }}</div>
          <div style="font-size:12px; color:var(--text-muted); font-family:monospace; font-weight:600;">{{ formatDuration(callDuration()) }}</div>
        </div>
        <div style="width:1px; height:24px; background:var(--border-color); margin:0 4px;"></div>
        <button (click)="endCall(); $event.stopPropagation()" style="background:#ef4444; width:40px; height:40px; border-radius:50%; display:grid; place-items:center; border:none; color:white; cursor:pointer; transition:all 0.2s;">
           <i-lucide [name]="Phone" [size]="18" style="transform: rotate(135deg);"></i-lucide>
        </button>
      </div>

      <!-- Global Active Call Widget (Expanded) -->
      <div *ngIf="isCalling() && !isIncomingCall() && isCallExpanded()" style="position:fixed; bottom:24px; right:24px; width:340px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.2); z-index:9999; display:flex; flex-direction:column; overflow:hidden; animation: slideUp 0.3s ease-out;">
        <div style="padding:16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
          <div style="display:flex; align-items:center; gap:12px;">
             <div class="avatar" [ngClass]="(callerInfo()?.email || callerInfo()?.name) | avatarColor : callerInfo()?.avatar" style="width:40px; height:40px; font-size:16px; border-radius:50%; display:grid; place-items:center; background:var(--color-primary); color:white;">{{ (callerInfo()?.name || 'U')[0] }}</div>
             <div>
               <div style="font-weight:600; font-size:14px; color:var(--text-main);">{{ callerInfo()?.name }}</div>
               <div style="font-size:12px; color:var(--text-muted); font-family:monospace;">{{ formatDuration(callDuration()) }}</div>
             </div>
          </div>
          <button (click)="minimizeCallWidget()" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">

             <i-lucide [name]="Minimize2" [size]="20"></i-lucide>
          </button>
        </div>
        
        <!-- Video Area if applicable -->
        <div *ngIf="callType() === 'video'" style="background:#1e293b; height:200px; position:relative; display:flex; justify-content:center; align-items:center;">
           <video id="globalRemoteVideo" autoplay playsinline [muted]="isSpeakerMuted()" style="width:100%; height:100%; object-fit:cover;"></video>
           <video id="globalLocalVideo" autoplay playsinline muted style="position:absolute; bottom:12px; right:12px; width:80px; height:120px; object-fit:cover; border-radius:8px; border:2px solid rgba(255,255,255,0.2); box-shadow:0 4px 10px rgba(0,0,0,0.3);"></video>
        </div>

        <div style="padding:16px; display:flex; justify-content:center; gap:16px; background:var(--bg-app);">
           <button (click)="toggleMicrophone()" [style.background]="isMicMuted() ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'" [style.color]="isMicMuted() ? '#ef4444' : 'var(--text-main)'" style="width:48px; height:48px; border-radius:50%; border:1px solid var(--border-color); display:grid; place-items:center; cursor:pointer; transition:all 0.2s;">
              <i-lucide [name]="isMicMuted() ? MicOff : Mic" [size]="20"></i-lucide>
           </button>
           <button (click)="toggleSpeaker()" [style.background]="isSpeakerMuted() ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'" [style.color]="isSpeakerMuted() ? '#ef4444' : 'var(--text-main)'" style="width:48px; height:48px; border-radius:50%; border:1px solid var(--border-color); display:grid; place-items:center; cursor:pointer; transition:all 0.2s;">
              <i-lucide [name]="isSpeakerMuted() ? VolumeX : Volume2" [size]="20"></i-lucide>
           </button>
           <button *ngIf="callType() === 'video'" (click)="toggleVideo()" [style.background]="isVideoMuted() ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'" [style.color]="isVideoMuted() ? '#ef4444' : 'var(--text-main)'" style="width:48px; height:48px; border-radius:50%; border:1px solid var(--border-color); display:grid; place-items:center; cursor:pointer; transition:all 0.2s;">
              <i-lucide [name]="isVideoMuted() ? VideoOff : Video" [size]="20"></i-lucide>
           </button>
           <button (click)="endCall()" style="background:#ef4444; width:48px; height:48px; border-radius:50%; display:grid; place-items:center; border:none; color:white; cursor:pointer; transition:all 0.2s;">
              <i-lucide [name]="Phone" [size]="20" style="transform: rotate(135deg);"></i-lucide>
           </button>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div *ngIf="showPasswordModal" style="position:fixed; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:10000; display:grid; place-items:center;" (click)="closePasswordModal()">
      <div (click)="$event.stopPropagation()" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:20px; width:420px; max-width:90vw; box-shadow:0 24px 48px rgba(0,0,0,0.2); overflow:hidden; animation:slideUp 0.3s ease-out;">
        <div style="padding:24px 28px 0; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:12px; background:rgba(99,102,241,0.1); color:#6366f1; display:grid; place-items:center;"><i-lucide [name]="Lock" [size]="20"></i-lucide></div>
            <h3 style="margin:0; font-size:18px; font-weight:700; color:var(--text-main);">Changer le mot de passe</h3>
          </div>
          <button (click)="closePasswordModal()" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:4px;"><i-lucide [name]="X" [size]="20"></i-lucide></button>
        </div>
        <div style="padding:24px 28px; display:flex; flex-direction:column; gap:16px;">
          <div *ngIf="pwdSuccess" style="padding:10px 14px; border-radius:10px; background:rgba(34,197,94,0.1); color:#16a34a; font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px;">
            <i-lucide [name]="CheckCircle" [size]="16"></i-lucide> {{ pwdSuccess }}
          </div>
          <div *ngIf="pwdError" style="padding:10px 14px; border-radius:10px; background:rgba(239,68,68,0.1); color:#ef4444; font-size:13px; font-weight:600;">{{ pwdError }}</div>
          <div>
            <label style="font-size:12px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:6px;">Mot de passe actuel</label>
            <div style="position:relative;">
              <input [type]="showCurrentPwd ? 'text' : 'password'" [(ngModel)]="currentPassword" placeholder="Entrez votre mot de passe actuel" style="width:100%; padding:10px 40px 10px 14px; border-radius:10px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-size:14px; outline:none; box-sizing:border-box;">
              <button (click)="showCurrentPwd = !showCurrentPwd" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:var(--text-muted); cursor:pointer;"><i-lucide [name]="showCurrentPwd ? EyeOff : Eye" [size]="16"></i-lucide></button>
            </div>
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:6px;">Nouveau mot de passe</label>
            <div style="position:relative;">
              <input [type]="showNewPwd ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="Minimum 6 caractères" style="width:100%; padding:10px 40px 10px 14px; border-radius:10px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-size:14px; outline:none; box-sizing:border-box;">
              <button (click)="showNewPwd = !showNewPwd" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:var(--text-muted); cursor:pointer;"><i-lucide [name]="showNewPwd ? EyeOff : Eye" [size]="16"></i-lucide></button>
            </div>
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:6px;">Confirmer le nouveau mot de passe</label>
            <div style="position:relative;">
              <input [type]="showConfirmPwd ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="Répétez le nouveau mot de passe" style="width:100%; padding:10px 40px 10px 14px; border-radius:10px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); font-size:14px; outline:none; box-sizing:border-box;">
              <button (click)="showConfirmPwd = !showConfirmPwd" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:var(--text-muted); cursor:pointer;"><i-lucide [name]="showConfirmPwd ? EyeOff : Eye" [size]="16"></i-lucide></button>
            </div>
          </div>
        </div>
        <div style="padding:0 28px 24px; display:flex; gap:12px; justify-content:flex-end;">
          <button (click)="closePasswordModal()" style="padding:10px 20px; border-radius:10px; border:1px solid var(--border-color); background:var(--bg-app); color:var(--text-main); cursor:pointer; font-size:13px; font-weight:600;">Annuler</button>
          <button (click)="submitPasswordChange()" [disabled]="pwdLoading" style="padding:10px 24px; border-radius:10px; border:none; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; cursor:pointer; font-size:13px; font-weight:600; opacity:1; transition:opacity 0.2s;" [style.opacity]="pwdLoading ? '0.6' : '1'">{{ pwdLoading ? 'Modification...' : 'Confirmer' }}</button>
        </div>
      </div>
    </div>

  `
})
export class EmployeeShellComponent implements OnInit {
  collapsed = false;
  isMobile = false;
  title = 'Tableau de Bord';
  totalUnreadCount = computed(() => this.presence.totalUnreadCount());
  private currentUserId: number = 0;
  private msgSub?: Subscription;

  userName = 'Utilisateur';
  userEmail = '';
  userAvatar = '';

  protected readonly Menu = Menu;
  protected readonly X = X;
  protected readonly LogOut = LogOut;
  protected readonly Search = Search;
  protected readonly Bell = Bell;
  protected readonly Moon = Moon;
  protected readonly Sun = Sun;
  protected readonly Calendar = Calendar;
  protected readonly CheckCircle = CheckCircle;
  protected readonly FileText = FileText;
  protected readonly MessageSquare = MessageSquare;
  protected readonly Ticket = Ticket;
  protected readonly Briefcase = Briefcase;
  protected readonly Megaphone = Megaphone;
  protected readonly Info = Info;
  protected readonly Mic = Mic;
  protected readonly MicOff = MicOff;
  protected readonly Volume2 = Volume2;
  protected readonly VolumeX = VolumeX;
  protected readonly Video = Video;
  protected readonly VideoOff = VideoOff;
  protected readonly Minimize2 = Minimize2;
  protected readonly Maximize2 = Maximize2;
  protected readonly Lock = Lock;
  protected readonly Eye = Eye;
  protected readonly EyeOff = EyeOff;


  showDropdown = false;
  showNotifications = false;
  isDarkTheme = false;
  unreadNotifs = 0;
  notifications: any[] = [];
  private notifInterval: any;

  // Global Call States
  isCalling = computed(() => this.presence.isCalling());
  isIncomingCall = computed(() => this.presence.isIncomingCall());
  callerInfo = computed(() => this.presence.callerInfo());
  incomingCallType = computed(() => this.presence.incomingCallType());
  callType = computed(() => this.presence.callType());
  isMicMuted = computed(() => this.presence.isMicMuted());
  isSpeakerMuted = computed(() => this.presence.isSpeakerMuted());
  isVideoMuted = computed(() => this.presence.isVideoMuted());
  callDuration = computed(() => this.presence.callDuration());
  
  isCallExpanded = computed(() => this.presence.isCallExpandedSignal());


  protected readonly Phone = Phone;




  menu = [
    { icon: Home, label: 'Accueil', path: '/employee', color: '#3b82f6' },
    { icon: Megaphone, label: 'Annonces', path: '/employee/announcements', color: '#8b5cf6' },
    { icon: Calendar, label: 'Gestion du Temps', path: '/employee/leaves', color: '#10b981' },
    { icon: Ticket, label: 'Mes Tickets', path: '/employee/tickets', color: '#f59e0b' },
    { icon: Briefcase, label: 'Travail Supp.', path: '/employee/extra-work', color: '#ef4444' },
    { icon: MessageSquare, label: 'Messages', path: '/employee/messages', color: '#ec4899' },
    { icon: User, label: 'Mon Profil', path: '/employee/profile', color: '#6366f1' }
  ];

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly presence: PresenceService,
    private readonly api: ApiService
  ) {
    this.checkMobile();

    // Get user info
    const currentNom = localStorage.getItem('hr_nom') || '';
    const currentPrenom = localStorage.getItem('hr_prenom') || '';
    this.userEmail = localStorage.getItem('hr_email') || '';
    
    if (currentNom || currentPrenom) {
      this.userName = `${currentPrenom} ${currentNom}`.trim();
    }
    this.userAvatar = localStorage.getItem('hr_avatar') || '';


    // Apply per-user saved theme
    const email = localStorage.getItem('hr_email') || 'default';
    const savedTheme = localStorage.getItem('hr_theme_' + email) || 'light';
    this.isDarkTheme = savedTheme === 'dark';
    if (this.isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) this.showNotifications = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.showDropdown = false;
  }

  markAllRead(): void {
    if (this.currentUserId > 0) {
      this.api.markAllNotificationsAsRead(this.currentUserId).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  onNotifClick(notif: any): void {
    if (!notif.isRead) {
      this.api.markNotificationAsRead(notif.id).subscribe(() => {
        this.loadNotifications();
      });
    }
    this.showNotifications = false;
    if (notif.path) {
      this.router.navigateByUrl(notif.path);
    }
  }

  private loadNotifications(): void {
    if (this.currentUserId <= 0) return;
    
    this.api.getNotifications(this.currentUserId).subscribe(res => {
      this.notifications = res.map(n => {
        const ui = this.getNotifUiMetadata(n);
        return {
          ...n,
          icon: ui.icon,
          iconBg: ui.bg,
          iconColor: ui.color,
          title: ui.title,
          desc: n.message,
          time: this.formatDate(n.createdAt),
          unread: !n.isRead,
          path: ui.path
        };
      });
      this.unreadNotifs = this.notifications.filter(n => n.unread).length;
      this.cdr.detectChanges();
    });
  }

  private getNotifUiMetadata(n: any): any {
    const msg = n.message.toLowerCase();
    
    // Congés (Approuvés/Refusés/Soumis)
    if (msg.includes('congé') || msg.includes('conge')) {
      if (msg.includes('approuvé') || msg.includes('accepté') || msg.includes('validé')) 
        return { icon: CheckCircle, bg: 'var(--color-green-bg)', color: 'var(--color-green)', title: 'Congé Approuvé', path: '/employee/leaves' };
      if (msg.includes('refusé') || msg.includes('rejeté')) 
        return { icon: X, bg: 'rgba(239,68,68,0.1)', color: '#ef4444', title: 'Congé Refusé', path: '/employee/leaves' };
      return { icon: Calendar, bg: 'var(--color-orange-bg)', color: 'var(--color-orange)', title: 'Demande de Congé', path: '/employee/leaves' };
    }

    // Absences Irrégulières
    if (msg.includes('absence') || msg.includes('rappel')) {
      return { icon: Calendar, bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', title: 'Absence Irrégulière', path: '/employee/leaves' };
    }

    // Messages
    if (msg.includes('message') || msg.includes('écrit') || msg.includes('envoyé')) 
      return { icon: MessageSquare, bg: 'rgba(147,51,234,0.1)', color: '#9333ea', title: 'Nouveau Message', path: '/employee/messages' };

    // Tickets
    if (msg.includes('ticket') || msg.includes('support') || msg.includes('assistance')) 
      return { icon: Ticket, bg: 'var(--color-blue-bg)', color: 'var(--color-blue)', title: 'Ticket Support', path: '/employee/tickets' };

    // Annonces
    if (msg.includes('annonce') || msg.includes('publication') || msg.includes('nouveauté')) 
      return { icon: Megaphone, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', title: 'Annonce', path: '/employee/announcements' };

    // Documents
    if (msg.includes('document') || msg.includes('dossier')) {
      return { icon: FileText, bg: 'rgba(34,197,94,0.1)', color: '#22c55e', title: 'Document', path: '/employee/profile' };
    }

    // Travail Supplémentaire
    if (msg.includes('travail') || msg.includes('heures sup') || msg.includes('extra')) 
      return { icon: Briefcase, bg: 'rgba(79,70,229,0.1)', color: '#4f46e5', title: 'Travail Supp.', path: '/employee/extra-work' };
    
    // Default
    return { icon: Info, bg: 'var(--bg-hover)', color: 'var(--color-primary)', title: 'Notification', path: '/employee' };
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    
    if (mins < 60) return `Il y a ${mins} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return d.toLocaleDateString();
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.isDarkTheme = theme === 'dark';
    if (this.isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save per user
    const email = localStorage.getItem('hr_email') || 'default';
    localStorage.setItem('hr_theme_' + email, theme);
    this.showDropdown = false;
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    const email = localStorage.getItem('hr_email') || '';
    const storedUserId = localStorage.getItem('hr_userId');
    
    if (!storedUserId && email) {
      this.api.getEmployees().subscribe(employees => {
        const emp = employees.find(e => e.email === email);
        if (emp && emp.id) {
          this.currentUserId = emp.id;
          localStorage.setItem('hr_userId', String(emp.id));
          this.presence.connect(emp.id);
        }
      });
    } else if (storedUserId) {
      this.currentUserId = Number(storedUserId);
      this.presence.connect(this.currentUserId);
    }
    
    if (this.currentUserId > 0) {
      this.presence.startPollingUnreadCount(this.currentUserId);
      this.loadNotifications();
      this.notifInterval = setInterval(() => this.loadNotifications(), 5000);
    }

    this.updateTitle();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.msgSub) this.msgSub.unsubscribe();
    if (this.notifInterval) clearInterval(this.notifInterval);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    const mobileValue = window.innerWidth <= 768;
    if (this.isMobile !== mobileValue) {
      this.isMobile = mobileValue;
      this.collapsed = this.isMobile;
      this.cdr.detectChanges();
    }
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.cdr.detectChanges();
  }

  logout(): void {
    this.presence.disconnect();
    const email = localStorage.getItem('hr_email') || '';
    localStorage.setItem('hr_last_email', email);
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_role');
    localStorage.removeItem('hr_email');
    localStorage.removeItem('hr_employeId');
    localStorage.removeItem('hr_userId');
    this.router.navigateByUrl('/login');
  }

  updateTitle(): void {
    const url = this.router.url || '/employee';
    const current = this.menu.find((m) => (m.path === '/employee' ? url === '/employee' : url.startsWith(m.path)));
    this.title = current?.label ?? 'Tableau de Bord';
  }

  acceptCall(): void {
    this.presence.acceptCall();
  }


  rejectCall(): void {
    this.presence.rejectCall();
  }

  expandCallWidget(): void {
    this.presence.setCallExpanded(true);
    // Wait for Angular to render the video elements, then attach streams
    this.presence.attachVideoElements();
  }

  minimizeCallWidget(): void {
    this.presence.setCallExpanded(false);
  }

  endCall(): void {
    this.presence.stopCall();
    this.presence.setCallExpanded(false);
  }



  toggleMicrophone() {
    this.presence.toggleMicrophone();
  }

  toggleSpeaker() {
    this.presence.toggleSpeaker();
  }

  toggleVideo() {
    this.presence.toggleVideo();
  }

  formatDuration(seconds: number): string {
    return this.presence.formatDuration(seconds);
  }

  // ── Change Password ──
  showPasswordModal = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  pwdError = '';
  pwdSuccess = '';
  pwdLoading = false;
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.showDropdown = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.pwdError = '';
    this.pwdSuccess = '';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  submitPasswordChange(): void {
    this.pwdError = '';
    this.pwdSuccess = '';

    if (!this.currentPassword) {
      this.pwdError = 'Veuillez entrer votre mot de passe actuel';
      return;
    }
    if (this.newPassword.length < 6) {
      this.pwdError = 'Le nouveau mot de passe doit contenir au moins 6 caractères';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.pwdError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.pwdLoading = true;
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.pwdSuccess = 'Mot de passe modifié avec succès !';
        this.pwdLoading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.logout(), 1500);
      },
      error: (err: any) => {
        this.pwdError = err.error?.error || 'Erreur lors de la modification du mot de passe';
        this.pwdLoading = false;
      }
    });
  }
}


