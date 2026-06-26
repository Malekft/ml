import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, CommonModule],
  template: `
    <div class="login-page-premium">
      <div class="login-container">

        <!-- LOGIN FORM -->
        <form *ngIf="mode === 'login'" class="login-card" (ngSubmit)="login()">
          <div style="text-align:center; margin-bottom: 32px;">
            <div class="login-logo-container">
              <img src="/Brycto.jpg" alt="Brycto Logo" class="login-logo">
            </div>
            <h1 class="login-title">Brycto</h1>
            <p class="login-subtitle">Solutions de Gestion Intelligentes</p>
          </div>

          <div class="form-group">
            <label>Email Professionnel</label>
            <div class="input-wrapper">
              <input name="email" [(ngModel)]="email" type="email" required placeholder="nom@brycto.com" />
            </div>
          </div>

          <div class="form-group">
            <label>Mot de passe</label>
            <div class="input-wrapper">
              <input name="password" [(ngModel)]="password" type="password" required placeholder="••••••••" />
            </div>
          </div>

          <div style="margin-top: 12px; text-align: center;">
            <a (click)="showForgotPassword()" class="forgot-password" style="cursor:pointer;">Mot de passe oublié ?</a>
          </div>

          <button type="submit" class="btn-login-premium">
            Se connecter
          </button>

          <div class="login-footer">
            Vous n'avez pas de compte ? contacter le manager
          </div>
        </form>

        <!-- FORGOT PASSWORD: Step 1 - Enter Email -->
        <div *ngIf="mode === 'forgot-email'" class="login-card">
          <div style="text-align:center; margin-bottom: 28px;">
            <div class="step-icon" style="background:rgba(99,102,241,0.1); color:#6366f1;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <h2 class="login-title" style="font-size:22px;">Mot de passe oublié</h2>
            <p class="login-subtitle">Entrez votre email pour recevoir un code de réinitialisation</p>
          </div>

          <div *ngIf="resetError" class="msg-error">{{ resetError }}</div>

          <div class="form-group">
            <label>Email Professionnel</label>
            <div class="input-wrapper">
              <input [(ngModel)]="resetEmail" type="email" placeholder="nom&#64;brycto.com" (keydown.enter)="sendResetCode()" />
            </div>
          </div>

          <button (click)="sendResetCode()" class="btn-login-premium" [disabled]="resetLoading" [style.opacity]="resetLoading ? '0.6' : '1'">
            {{ resetLoading ? 'Envoi en cours...' : 'Envoyer le code' }}
          </button>

          <div style="margin-top:20px; text-align:center;">
            <a (click)="backToLogin()" class="forgot-password" style="cursor:pointer;">← Retour à la connexion</a>
          </div>
        </div>

        <!-- FORGOT PASSWORD: Step 2 - Enter Code -->
        <div *ngIf="mode === 'forgot-code'" class="login-card">
          <div style="text-align:center; margin-bottom: 28px;">
            <div class="step-icon" style="background:rgba(245,158,11,0.1); color:#f59e0b;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 class="login-title" style="font-size:22px;">Vérification</h2>
            <p class="login-subtitle">Un code à 6 chiffres a été envoyé à <strong>{{ resetEmail }}</strong></p>
          </div>

          <div *ngIf="resetError" class="msg-error">{{ resetError }}</div>
          <div *ngIf="resetSuccess" class="msg-success">{{ resetSuccess }}</div>

          <div class="form-group">
            <label>Code de vérification</label>
            <div class="input-wrapper">
              <input [(ngModel)]="resetCode" type="text" maxlength="6" placeholder="000000"
                     style="text-align:center; font-size:24px; letter-spacing:8px; font-weight:700; font-family:monospace;"
                     (keydown.enter)="goToNewPassword()" />
            </div>
          </div>

          <button (click)="goToNewPassword()" class="btn-login-premium" [disabled]="resetLoading" [style.opacity]="resetLoading ? '0.6' : '1'">
            {{ resetLoading ? 'Vérification...' : 'Vérifier le code' }}
          </button>

          <div style="margin-top:16px; text-align:center; display:flex; justify-content:center; gap:20px;">
            <a (click)="sendResetCode()" class="forgot-password" style="cursor:pointer; font-size:13px;">Renvoyer le code</a>
            <a (click)="backToLogin()" class="forgot-password" style="cursor:pointer; font-size:13px;">← Retour</a>
          </div>
        </div>

        <!-- FORGOT PASSWORD: Step 3 - New Password -->
        <div *ngIf="mode === 'forgot-newpwd'" class="login-card">
          <div style="text-align:center; margin-bottom: 28px;">
            <div class="step-icon" style="background:rgba(34,197,94,0.1); color:#22c55e;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h2 class="login-title" style="font-size:22px;">Nouveau mot de passe</h2>
            <p class="login-subtitle">Créez un nouveau mot de passe pour votre compte</p>
          </div>

          <div *ngIf="resetError" class="msg-error">{{ resetError }}</div>
          <div *ngIf="resetSuccess" class="msg-success">{{ resetSuccess }}</div>

          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <div class="input-wrapper">
              <input [(ngModel)]="newPassword" type="password" placeholder="Minimum 6 caractères" (keydown.enter)="submitNewPassword()" />
            </div>
          </div>

          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <div class="input-wrapper">
              <input [(ngModel)]="confirmNewPassword" type="password" placeholder="Répétez le mot de passe" (keydown.enter)="submitNewPassword()" />
            </div>
          </div>

          <button (click)="submitNewPassword()" class="btn-login-premium" [disabled]="resetLoading" [style.opacity]="resetLoading ? '0.6' : '1'">
            {{ resetLoading ? 'Modification...' : 'Réinitialiser le mot de passe' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .login-page-premium {
      height: 100vh;
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--bg-app);
    }

    .login-container {
      width: 100%;
      max-width: 480px;
      padding: 20px;
    }

    .login-card {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }

    .login-logo-container {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px auto;
      background: white;
      padding: 8px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      display: grid;
      place-items: center;
    }

    .login-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }

    .login-title {
      font-size: 26px;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .login-subtitle {
      color: #64748b;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.2s;
      outline: none;
      background: #f8fafc;
      color: #1e293b;
      box-sizing: border-box;
    }

    .input-wrapper input:focus {
      border-color: #0061FF;
      background: white;
      box-shadow: 0 0 0 4px rgba(0, 97, 255, 0.1);
    }

    .forgot-password {
      font-size: 14px;
      font-weight: 600;
      color: #0061FF;
      text-decoration: none;
    }

    .btn-login-premium {
      width: 100%;
      margin-top: 32px;
      padding: 14px;
      background: #1e293b;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-login-premium:hover {
      background: #0f172a;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .login-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
    }

    .step-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      margin: 0 auto 16px;
    }

    .msg-error {
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(239,68,68,0.1);
      color: #ef4444;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      text-align: center;
    }

    .msg-success {
      padding: 10px 14px;
      border-radius: 10px;
      background: rgba(34,197,94,0.1);
      color: #16a34a;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      text-align: center;
    }
  `]
})
export class LoginPageComponent implements OnInit {
  email = '';
  password = '';

  // Forgot password state
  mode: 'login' | 'forgot-email' | 'forgot-code' | 'forgot-newpwd' = 'login';
  resetEmail = '';
  resetCode = '';
  newPassword = '';
  confirmNewPassword = '';
  resetError = '';
  resetSuccess = '';
  resetLoading = false;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const lastEmail = localStorage.getItem('hr_last_email');
    if (lastEmail) {
      this.email = lastEmail;
    }
  }

  login(): void {
    this.api.login(this.email, this.password).subscribe({
      next: (res: any) => {
        const finalRole = res.role === 'ADMIN' || res.role === 'MANAGER' ? 'manager' : 'employee';
        localStorage.setItem('hr_token', res.token);
        localStorage.setItem('hr_role', finalRole);
        localStorage.setItem('hr_email', this.email);
        localStorage.setItem('hr_nom', res.nom || '');
        localStorage.setItem('hr_prenom', res.prenom || '');
        localStorage.setItem('hr_userId', String(res.userId || ''));
        localStorage.setItem('hr_employeId', String(res.employeId || ''));
        localStorage.setItem('hr_avatar', res.avatar || '');
        localStorage.removeItem('hr_last_email');

        const savedTheme = localStorage.getItem('hr_theme_' + this.email) || 'light';
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        this.router.navigateByUrl(finalRole === 'manager' ? '/' : '/employee');
      },
      error: () => {
        alert('Échec de la connexion : Email ou mot de passe incorrect.');
      }
    });
  }

  // --- Forgot Password Flow ---

  showForgotPassword(): void {
    this.mode = 'forgot-email';
    this.resetEmail = this.email || '';
    this.resetError = '';
    this.resetSuccess = '';
  }

  backToLogin(): void {
    this.mode = 'login';
    this.resetError = '';
    this.resetSuccess = '';
  }

  sendResetCode(): void {
    this.resetError = '';
    this.resetSuccess = '';

    if (!this.resetEmail || !this.resetEmail.includes('@')) {
      this.resetError = 'Veuillez entrer un email valide';
      return;
    }

    // Switch to code entry page IMMEDIATELY
    this.mode = 'forgot-code';
    this.resetSuccess = 'Un code a été envoyé à votre email. Vérifiez votre boîte de réception.';
    this.resetCode = '';
    this.cdr.detectChanges();

    // Fire API call in background
    this.api.forgotPassword(this.resetEmail).subscribe({
      next: () => {},
      error: () => {
        this.resetError = 'Erreur lors de l\'envoi. Cliquez sur "Renvoyer le code".';
        this.cdr.detectChanges();
      }
    });
  }

  goToNewPassword(): void {
    this.resetError = '';
    this.resetSuccess = '';
    if (!this.resetCode || this.resetCode.length !== 6) {
      this.resetError = 'Veuillez entrer le code à 6 chiffres';
      return;
    }

    this.resetLoading = true;
    this.api.verifyCode(this.resetEmail, this.resetCode).subscribe({
      next: () => {
        this.resetLoading = false;
        this.mode = 'forgot-newpwd';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.resetLoading = false;
        this.resetError = err.error?.error || 'Code invalide ou expiré';
        this.cdr.detectChanges();
      }
    });
  }

  submitNewPassword(): void {
    this.resetError = '';
    this.resetSuccess = '';

    if (this.newPassword.length < 6) {
      this.resetError = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.resetError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.resetLoading = true;
    this.api.resetPassword(this.resetEmail, this.resetCode, this.newPassword).subscribe({
      next: () => {
        this.resetLoading = false;
        this.resetSuccess = 'Mot de passe réinitialisé avec succès !';
        this.email = this.resetEmail;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.mode = 'login';
          this.password = '';
          this.resetSuccess = '';
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err: any) => {
        this.resetLoading = false;
        this.resetError = err.error?.error || 'Erreur lors de la réinitialisation';
        if (this.resetError.includes('Code')) {
          this.mode = 'forgot-code';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
