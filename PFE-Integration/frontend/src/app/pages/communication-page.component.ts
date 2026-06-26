import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PresenceService } from '../core/presence.service';
import { AnnouncementDto } from '../core/api.types';
import { AvatarColorPipe } from '../core/avatar-color.pipe';
import { InitialsPipe } from '../core/initials.pipe';
import {
  LucideAngularModule,
  PlusCircle, Users, Globe, Linkedin, Facebook, Search,
  Clock, Heart, MessageCircle, Send, Paperclip,
  Calendar as CalendarIcon, X, ThumbsUp, Trash2, Edit2,
  Check, FileText, Download, MoreVertical
} from 'lucide-angular';


@Component({
  selector: 'app-communication-page',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, LucideAngularModule, CommonModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Annonces</h2>
        <div class="subtitle">Informez vos équipes et communiquez sur les réseaux</div>
      </div>
      <button class="btn btn-primary" (click)="openModal()">
        <i-lucide [name]="PlusCircle" [size]="18" color="#ffffff"></i-lucide>
        Publier une annonce
      </button>
    </div>

    <div style="display:grid; grid-template-columns: 280px 1fr; gap:24px; align-items: flex-start;">
      <!-- Left Sidebar: Filters & Stats -->
      <aside style="display:flex; flex-direction:column; gap:20px;">
        <article class="card">
          <h3 style="font-size:14px; font-weight:700; margin-bottom:16px; color:var(--text-main);">Filtres</h3>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="tab-btn" [class.active]="categoryFilter === 'all'" (click)="categoryFilter = 'all'" style="width:100%; text-align:left; justify-content:flex-start;">
              Toutes les annonces
            </button>
            <button class="tab-btn" [class.active]="categoryFilter === 'INTERNE'" (click)="categoryFilter = 'INTERNE'" style="width:100%; text-align:left; justify-content:flex-start;">
              <i-lucide [name]="Users" [size]="14" style="margin-right:8px;"></i-lucide>
              Annonces internes
            </button>
            <button class="tab-btn" [class.active]="categoryFilter === 'EXTERNE'" (click)="categoryFilter = 'EXTERNE'" style="width:100%; text-align:left; justify-content:flex-start;">
              <i-lucide [name]="Globe" [size]="14" style="margin-right:8px;"></i-lucide>
              Annonces externes
            </button>
          </div>
        </article>

        <article class="card">
          <h3 style="font-size:14px; font-weight:700; margin-bottom:16px; color:var(--text-main);">Canaux Connectés</h3>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i-lucide [name]="Linkedin" [size]="16" color="#0077B5"></i-lucide>
                <span style="font-size:13px; font-weight:500;">LinkedIn</span>
              </div>
              <span class="chip chip-green" style="font-size:10px; padding:2px 8px;">OK</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:8px;">
                <i-lucide [name]="Facebook" [size]="16" color="#1877F2"></i-lucide>
                <span style="font-size:13px; font-weight:500;">Facebook</span>
              </div>
              <span class="chip chip-green" style="font-size:10px; padding:2px 8px;">OK</span>
            </div>
          </div>
        </article>
      </aside>

      <!-- Center: Feed -->
      <main style="display:flex; flex-direction:column; gap:20px;">
        <div class="search-input-wrapper" style="width:100%;">
          <i-lucide [name]="Search" [size]="18" class="search-icon-inner"></i-lucide>
          <input class="with-icon" [(ngModel)]="searchQuery" placeholder="Rechercher une annonce par titre..." style="width:100%; border-radius:24px; background:var(--bg-input); color:var(--text-main); border:1px solid var(--border-color);" />
        </div>

        <div *ngFor="let a of filteredAnnouncements(); trackBy: trackById" class="card" style="padding: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
            <div style="display:flex; gap:12px; align-items:center;">
              <div style="position:relative; flex-shrink:0;">
                <div class="avatar" [ngClass]="(a.email || a.author) | avatarColor : a.avatar" style="width:40px; height:40px;">
                  {{ a.author | initials }}
                </div>
                <div *ngIf="presence.isUserOnline(a.authorId || 0)" style="position:absolute; bottom:0; right:0; width:10px; height:10px; background:var(--color-green); border:2px solid white; border-radius:50%;"></div>
                <!-- Status dot for author presence -->
              </div>
              <div>
                <h4 style="margin:0; font-size:16px; font-weight:700;">{{ a.title }}</h4>
                <div class="muted" style="font-size:12px; display:flex; align-items:center; gap:4px;">
                  <i-lucide [name]="Clock" [size]="12"></i-lucide> Posté le {{ a.date }} • {{ a.category === 'INTERNE' ? 'Interne' : 'Externe' }}
                </div>
              </div>
            </div>
            <span class="chip" [ngClass]="a.status === 'PUBLISHED' ? 'chip-green' : 'chip-orange'">
              {{ a.status === 'PUBLISHED' ? 'Publié' : 'Planifié' }}
            </span>
          </div>
          
          <p style="font-size:14px; color:var(--text-main); line-height:1.6; margin-bottom:20px; white-space: pre-wrap;">
            {{ a.content }}
          </p>

          <div style="display:flex; gap:12px; padding-top:16px; border-top:1px solid var(--border-light);">
            <!-- Announcement Reaction -->
            <div style="position: relative;" (mouseenter)="a.showReactionPicker = true" (mouseleave)="a.showReactionPicker = false">
              <div *ngIf="a.showReactionPicker" class="reaction-picker">
                <span *ngFor="let r of reactionsList" class="reaction-emoji" (click)="toggleLike($event, a, r.type)" [title]="r.label">{{ r.icon }}</span>
              </div>
              <button class="interaction-btn" [class.liked]="a.liked" 
                      [title]="getReactionTooltip(a)"
                      style="font-size: 13px; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); background: transparent; cursor: pointer; color: var(--text-muted); transition: all 0.2s;"
                      [style.color]="a.liked ? getReactionInfo(a.userReaction).color : 'var(--text-muted)'">
                <div style="display: flex; align-items: center;" (click)="toggleLike($event, a)">
                  <span *ngFor="let icon of getTopIcons(a); let i = index" 
                        [style.margin-left]="i > 0 ? '-8px' : '0'"
                        [style.z-index]="10 - i"
                        style="font-size: 18px; border: 2px solid transparent; border-radius: 50%;">{{ icon }}</span>
                </div>
                <span style="font-weight: 600; margin-left: 4px; cursor: pointer; text-decoration: underline;" (click)="openReactionsModal($event, a)">{{ a.likes || 0 }}</span>
                <span (click)="toggleLike($event, a)">{{ a.liked ? getReactionInfo(a.userReaction).label : "J'aime" }}</span>
              </button>
            </div>
            <button class="interaction-btn" style="font-size: 13px; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); background: transparent; cursor: pointer; color: var(--text-muted);" (click)="a.showComments = !a.showComments">
              <i-lucide [name]="MessageCircle" [size]="16"></i-lucide> {{ (a.comments?.length || 0) }} Commenter
            </button>
          </div>
          
          <!-- Comment Section -->
          <div *ngIf="a.showComments" 
               style="margin-top: 20px; padding: 24px; background: var(--bg-app); border-radius: 20px; border: 1px solid var(--border-light); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div class="avatar" [ngClass]="userEmail | avatarColor : userAvatar" style="width: 36px; height: 36px; font-size: 12px;">{{ getUserInitials() }}</div>
                <div style="flex: 1; position: relative;">
                  <textarea 
                    [(ngModel)]="a.commentText"
                    placeholder="Écrire un commentaire..."
                    style="width: 100%; min-height: 80px; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; background: var(--bg-input); color: var(--text-main); outline:none; transition: border-color 0.2s; resize: vertical;"
                  ></textarea>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <div style="display: flex; gap: 8px;">
                      <input type="file" #fileInput (change)="onFileSelected($event, a)" style="display: none;" />
                      <button (click)="fileInput.click()" style="padding: 8px; border-radius: 8px; background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px;" title="Ajouter une pièce jointe">
                        <i-lucide [name]="Paperclip" [size]="16"></i-lucide>
                        <span *ngIf="a.tempFileObject">{{ a.tempFileObject.name }}</span>
                      </button>
                      <button *ngIf="a.tempFileObject" (click)="a.tempFileObject = null" style="color: #ef4444; background: none; border: none; cursor: pointer;">
                        <i-lucide [name]="XIcon" [size]="16"></i-lucide>
                      </button>
                    </div>
                    <button (click)="submitComment(a)" class="btn btn-primary" style="padding: 8px 24px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                      <i-lucide [name]="Send" [size]="16"></i-lucide> Envoyer
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Recursive Comment List -->
              <div *ngIf="a.comments && a.comments.length > 0" style="margin-top: 20px; display: flex; flex-direction: column; gap: 20px; border-top: 1px solid var(--border-light); padding-top: 20px;">
                <ng-container *ngTemplateOutlet="commentListTemplate; context: { $implicit: a.comments, isRoot: true }"></ng-container>
              </div>

              <!-- Definition of Recursive Comment Template -->
              <ng-template #commentListTemplate let-comments let-isRoot="isRoot">
                <div *ngFor="let c of comments" style="display: flex; gap: 12px; flex-direction: column;">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="position:relative; flex-shrink:0;">
                      <div class="avatar" [ngClass]="(c.email || c.author) | avatarColor : c.avatar" style="width: 32px; height: 32px; font-size: 11px;">
                        {{ c.author | initials }}
                      </div>
                      <div *ngIf="presence.isUserOnline(c.authorId || 0)" style="position:absolute; bottom:0; right:0; width:8px; height:8px; background:var(--color-green); border:1.5px solid white; border-radius:50%;"></div>
                    </div>
                    <div style="flex: 1;">
                      <!-- Comment Bubble -->
                      <div style="background: var(--bg-hover); padding: 12px 16px; border-radius: 18px; border: none; position: relative;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                          <span style="font-weight: 700; font-size: 13px; color: var(--text-main);">{{ c.author }}</span>
                          <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 10px; color: var(--text-muted); font-weight: 500;">{{ c.date }}</span>
                          <!-- More Options Menu (Facebook style) -->
                          <div *ngIf="c.authorId === userId" style="position: relative;" (mouseenter)="c.showMoreMenu = true" (mouseleave)="c.showMoreMenu = false">
                            <button style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='none'">
                              <i-lucide [name]="MoreVertical" [size]="14"></i-lucide>
                            </button>
                            <div *ngIf="c.showMoreMenu" style="position: absolute; top: 100%; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: var(--shadow-hover); z-index: 20; min-width: 120px; overflow: hidden; animation: fadeIn 0.2s ease;">
                              <button (click)="editComment(c); c.showMoreMenu = false" style="width: 100%; padding: 8px 12px; display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; color: var(--text-main); font-size: 12px; font-weight: 600; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='none'">
                                <i-lucide [name]="Edit2" [size]="14"></i-lucide> Modifier
                              </button>
                              <button (click)="deleteComment(c, comments); c.showMoreMenu = false" style="width: 100%; padding: 8px 12px; display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; color: #ef4444; font-size: 12px; font-weight: 600; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='none'">
                                <i-lucide [name]="Trash2" [size]="14"></i-lucide> Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                        <!-- Comment Text / Edit Input -->
                        <div *ngIf="!c.isEditing" style="font-size: 13.5px; color: var(--text-main); line-height: 1.4;">{{ c.text }}</div>
                        
                        <!-- Reactions Badge overlay (Facebook style) -->
                        <div *ngIf="c.likes > 0" (click)="openReactionsModal($event, c)" 
                             style="position: absolute; bottom: -10px; right: 12px; background: var(--bg-card); padding: 2px 6px; border-radius: 12px; display: flex; align-items: center; gap: 4px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); cursor: pointer; z-index: 5;">
                          <div style="display: flex; align-items: center;">
                            <span *ngFor="let icon of getTopIcons(c); let i = index" 
                                  [style.margin-left]="i > 0 ? '-4px' : '0'"
                                  style="font-size: 12px;">{{ icon }}</span>
                          </div>
                          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">{{ c.likes }}</span>
                        </div>

                        <div *ngIf="c.isEditing" style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
                          <div style="display: flex; gap: 8px;">
                            <input [(ngModel)]="c.editText" style="flex: 1; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--color-primary); font-size: 13px; outline: none; background: var(--bg-input); color: var(--text-main);" (keyup.enter)="saveCommentEdit(c)" />
                            <button (click)="saveCommentEdit(c)" style="background: var(--color-primary); color: white; border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer;"><i-lucide [name]="Check" [size]="14"></i-lucide></button>
                          </div>
                        </div>

                        <div *ngIf="c.fileName" style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
                          <a [href]="api.getFullUrl(c.fileUrl)" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; text-decoration: none; color: var(--text-main); font-size: 11px;" title="Visualiser">
                            <i-lucide [name]="Paperclip" [size]="12" style="color: var(--color-primary);"></i-lucide>
                            <span>{{ c.fileName }}</span>
                          </a>
                        </div>
                      </div>
                      <!-- Actions: Like & Reply -->
                      <div style="display: flex; gap: 16px; margin-top: 4px; padding-left: 8px;">
                        <div style="position: relative;" (mouseenter)="c.showReactionPicker = true" (mouseleave)="c.showReactionPicker = false">
                          <div *ngIf="c.showReactionPicker" class="reaction-picker" style="padding: 4px 8px; gap: 6px;">
                            <span *ngFor="let r of reactionsList" class="reaction-emoji" style="font-size: 18px;" (click)="toggleCommentLike($event, c, r.type)" [title]="r.label">{{ r.icon }}</span>
                          </div>
                          <button (click)="toggleCommentLike($event, c)" style="background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 4px; padding: 4px 0;" [style.color]="c.liked ? getReactionInfo(c.userReaction).color : 'var(--text-muted)'">
                            {{ c.liked ? getReactionInfo(c.userReaction).label : "J'aime" }}
                          </button>
                        </div>
                        <button (click)="c.showReplyInput = !c.showReplyInput" style="background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 4px; padding: 4px 0;">
                          Répondre
                        </button>
                      </div>

                      <!-- Recursive Reply Input -->
                      <div *ngIf="c.showReplyInput" style="margin-top: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                          <input #nestInput type="text" placeholder="Répondre..." style="flex: 1; padding: 8px 12px; border-radius: 20px; border: 1px solid var(--border-color); font-size: 12px; background: var(--bg-input); color: var(--text-main); outline: none;" (keyup.enter)="submitReply(c, nestInput)" />
                          <input type="file" #nestFile (change)="onFileSelected($event, c)" style="display: none;" />
                          <button (click)="nestFile.click()" style="background: none; border: none; color: var(--text-muted); cursor: pointer;"><i-lucide [name]="Paperclip" [size]="14"></i-lucide></button>
                          <button (click)="submitReply(c, nestInput)" style="background: var(--color-primary); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i-lucide [name]="Send" [size]="14"></i-lucide></button>
                        </div>
                        <div *ngIf="c.tempFileObject" style="margin-top: 4px; font-size: 10px; color: var(--color-primary); display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: rgba(0,97,255,0.05); border-radius: 4px;">
                          <span><i-lucide [name]="FileText" [size]="10"></i-lucide> {{ c.tempFileObject.name }}</span>
                          <button (click)="c.tempFileObject = null; c.tempFile = null" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i-lucide [name]="XIcon" [size]="10"></i-lucide></button>
                        </div>
                      </div>

                      <!-- Recursive Nested Replies -->
                      <div *ngIf="c.replies && c.replies.length > 0" style="margin-top: 4px;">
                        <!-- Show the "Show replies" toggle for any comment with replies that are hidden -->
                        <button *ngIf="!c.showReplies" (click)="c.showReplies = true" 
                                style="background: none; border: none; color: var(--color-primary); cursor: pointer; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; padding: 4px 12px; margin-left: 4px;">
                          <span style="width: 24px; height: 1.5px; background: var(--color-primary); opacity: 0.3;"></span>
                          Afficher les {{ c.replies.length }} {{ c.replies.length > 1 ? 'réponses' : 'réponse' }}
                        </button>
                        
                        <!-- Indentation is only applied at the first level. isRoot is true for parent comments. -->
                        <div *ngIf="c.showReplies" 
                             [style.padding-left]="isRoot ? '16px' : '0'" 
                             [style.border-left]="isRoot ? '2px solid var(--border-light)' : 'none'"
                             style="margin-top: 8px; display: flex; flex-direction: column; gap: 12px;">
                          <ng-container *ngTemplateOutlet="commentListTemplate; context: { $implicit: c.replies, isRoot: false }"></ng-container>
                          
                          <button *ngIf="c.showReplies" (click)="c.showReplies = false" 
                                  style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 11px; font-weight: 600; padding: 4px 8px; align-self: flex-start; margin-left: 32px;">
                            Masquer les réponses
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <div *ngIf="filteredAnnouncements().length === 0" class="muted" style="text-align:center; padding:40px;">
          Aucune annonce ne correspond à votre recherche.
        </div>
      </main>
    </div>

    <div class="modal-overlay" *ngIf="showModal" style="padding: 20px;">
      <form class="modal-card" (ngSubmit)="submitAnnouncement()" style="max-width:520px; padding: 24px; gap: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="margin:0; font-size: 1.25rem;">Nouvelle Publication</h2>
          <span class="ia-badge" style="background:rgba(0,97,255,0.1); color:var(--color-primary); border:1px solid rgba(0,97,255,0.2); font-size: 10px; padding: 4px 10px;">Diffusion Automatisée</span>
        </div>
        <p class="muted" style="font-size: 13px; margin: 0;">Diffusez votre contenu sur plusieurs canaux simultanément.</p>

        <!-- Error Message -->
        <div *ngIf="errorMessage" style="background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; animation: shake 0.4s ease-in-out;">
          <i-lucide [name]="X" [size]="14"></i-lucide>
          {{ errorMessage }}
        </div>

        <div style="margin-top: 4px;">
          <label style="font-size: 11px; margin-bottom: 4px;">TITRE DU CONTENU</label>
          <input name="title" [(ngModel)]="form.title" required placeholder="Ex: Annonce des résultats annuels..." style="padding: 10px 14px; font-size: 13px;" />
        </div>

        <div>
          <label style="font-size: 11px; margin-bottom: 4px;">CANAUX DE DIFFUSION</label>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:4px;">
            <label class="channel-card" [class.selected]="form.channels.internal">
              <input type="checkbox" name="internal" [(ngModel)]="form.channels.internal" style="display:none">
              <i-lucide [name]="Users" [size]="18"></i-lucide>
              <span style="font-size: 11px;">INTERNE</span>
            </label>
            <label class="channel-card" [class.selected]="form.channels.linkedin">
              <input type="checkbox" name="linkedin" [(ngModel)]="form.channels.linkedin" style="display:none">
              <i-lucide [name]="Linkedin" [size]="18"></i-lucide>
              <span style="font-size: 11px;">LINKEDIN</span>
            </label>
            <label class="channel-card" [class.selected]="form.channels.facebook">
              <input type="checkbox" name="facebook" [(ngModel)]="form.channels.facebook" style="display:none">
              <i-lucide [name]="Facebook" [size]="18"></i-lucide>
              <span style="font-size: 11px;">FACEBOOK</span>
            </label>
          </div>
        </div>

        <div>
          <label style="font-size: 11px; margin-bottom: 4px;">CORPS DU MESSAGE</label>
          <textarea name="content" rows="4" [(ngModel)]="form.content" placeholder="Rédigez votre message ici..." required style="padding: 12px; font-size: 13px;"></textarea>
        </div>

        <div style="padding: 14px; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 12px; margin-top: 4px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; margin:0; text-transform:none;">
              <input type="checkbox" name="isScheduled" [(ngModel)]="form.isScheduled" style="width:16px; height:16px;">
              <span style="font-size:13px; font-weight:600; color:var(--text-main);">Planifier la publication automatique</span>
            </label>
            <i-lucide [name]="Calendar" [size]="16" class="muted"></i-lucide>
          </div>
          
          <div *ngIf="form.isScheduled" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:16px; animation: fadeIn 0.3s ease;">
            <div>
              <label style="font-size:12px;">Date de publication</label>
              <input type="date" name="scheduleDate" [(ngModel)]="form.scheduleDate" style="width:100%">
            </div>
            <div>
              <label style="font-size:12px;">Heure</label>
              <input type="time" name="scheduleTime" [(ngModel)]="form.scheduleTime" style="width:100%">
            </div>
          </div>
        </div>

        <div class="btn-row" style="justify-content: space-between; margin-top:12px;">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" style="padding-left:32px; padding-right:32px;">
            {{ form.isScheduled ? 'Programmer' : 'Publier maintenant' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Reactions Modal (Facebook style) -->
    <div *ngIf="showReactionsModal" class="modal-overlay" (click)="showReactionsModal = false" style="display: flex; align-items: center; justify-content: center; z-index: 2000;">
      <div class="modal-content" (click)="$event.stopPropagation()" style="width: 100%; max-width: 500px; padding: 0; border-radius: 16px; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: var(--shadow-hover);">
        <div style="padding: 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; background: var(--bg-card);">
          <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main);">Réactions</h3>
          <button (click)="showReactionsModal = false" style="background: var(--bg-hover); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">
            <i-lucide [name]="X" [size]="18"></i-lucide>
          </button>
        </div>
        
        <!-- Tabs -->
        <div style="display: flex; border-bottom: 1px solid var(--border-light); padding: 0 12px; background: var(--bg-app);">
          <div (click)="activeReactionTab = 'ALL'" 
               [style.border-bottom]="activeReactionTab === 'ALL' ? '3px solid var(--color-primary)' : '3px solid transparent'"
               [style.color]="activeReactionTab === 'ALL' ? 'var(--color-primary)' : 'var(--text-muted)'"
               style="padding: 14px 16px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">
            Tout ({{ reactionsModalData?.likes || 0 }})
          </div>
          <div *ngFor="let type of getModalReactionTypes()" (click)="activeReactionTab = type"
               [style.border-bottom]="activeReactionTab === type ? '3px solid var(--color-primary)' : '3px solid transparent'"
               [style.color]="activeReactionTab === type ? 'var(--color-primary)' : 'var(--text-muted)'"
               style="padding: 14px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <span style="font-size: 20px;">{{ getReactionInfo(type).icon }}</span>
            <span style="font-size: 14px; font-weight: 600;">{{ reactionsModalData?.reactions?.breakdown[type] }}</span>
          </div>
        </div>

        <!-- Names List -->
        <div style="max-height: 400px; overflow-y: auto; padding: 8px 0; background: var(--bg-card);">
          <div *ngFor="let name of getFilteredModalNames()" style="padding: 12px 24px; display: flex; align-items: center; gap: 16px; transition: background 0.2s;">
            <div class="avatar" [ngClass]="name | avatarColor" style="width: 40px; height: 40px; font-size: 15px; font-weight: 700; box-shadow: var(--shadow-sm);">
              {{ name | initials }}
            </div>
            <span style="font-weight: 600; color: var(--text-main); font-size: 15px;">{{ name }}</span>
          </div>
          <div *ngIf="getFilteredModalNames().length === 0" style="padding: 60px 40px; text-align: center; color: var(--text-muted);">
            <i-lucide [name]="ThumbsUp" [size]="48" style="opacity: 0.1; margin-bottom: 16px;"></i-lucide>
            <p style="margin: 0;">Aucune réaction à afficher.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reaction-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      background: var(--bg-card);
      border-radius: 30px;
      padding: 8px 12px;
      box-shadow: var(--shadow-hover);
      display: flex;
      gap: 8px;
      border: 1px solid var(--border-color);
      z-index: 100;
      animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .reaction-picker::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      height: 15px;
      background: transparent;
    }
    
    @keyframes popIn {
      from { opacity: 0; transform: translateY(10px) scale(0.8); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .reaction-emoji {
      font-size: 24px;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      user-select: none;
    }
    .reaction-emoji:hover {
      transform: scale(1.4) translateY(-5px);
    }

    .interaction-btn:hover { background: var(--bg-app) !important; color: var(--text-main) !important; }
    .interaction-btn.liked { border-color: var(--color-primary) !important; background: var(--bg-app) !important; }

    .channel-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--text-muted);
    }
    
    .channel-card.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-bg);
      color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary);
    }
    
    .channel-card i-lucide {
      margin-bottom: 2px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

  `]
})
/**
 * Admin portal component for announcements with reactions, comments, and multi-channel publishing.
 */
export class CommunicationPageComponent implements OnInit, OnDestroy {
  // Lucide Icons
  protected readonly PlusCircle = PlusCircle;
  protected readonly Users = Users;
  protected readonly Globe = Globe;
  protected readonly Linkedin = Linkedin;
  protected readonly Facebook = Facebook;
  protected readonly Search = Search;
  protected readonly Clock = Clock;
  protected readonly Heart = Heart;
  protected readonly Calendar = CalendarIcon;
  protected readonly MessageCircle = MessageCircle;
  protected readonly ThumbsUp = ThumbsUp;
  protected readonly MoreVertical = MoreVertical;
  protected readonly Trash2 = Trash2;
  protected readonly Edit2 = Edit2;
  protected readonly X = X;
  protected readonly XIcon = X;
  protected readonly Check = Check;
  protected readonly FileText = FileText;
  protected readonly Download = Download;
  protected readonly Paperclip = Paperclip;
  protected readonly Send = Send;

  // Constant Data
  readonly reactionsList = [
    { type: 'LIKE', label: 'J\'aime', icon: '👍', color: '#0061ff' },
    { type: 'LOVE', label: 'J\'adore', icon: '❤️', color: '#ef4444' },
    { type: 'HAHA', label: 'Haha', icon: '😂', color: '#facc15' },
    { type: 'WOW', label: 'Wouah', icon: '😮', color: '#facc15' },
    { type: 'SAD', label: 'Triste', icon: '😢', color: '#facc15' }
  ];

  // Component State
  searchQuery = '';
  categoryFilter: 'all' | 'INTERNE' | 'EXTERNE' = 'all';
  showModal = false;
  announcements: AnnouncementDto[] = [];
  userId = 0;
  userEmail = '';
  userAvatar = '';
  userName = '';
  errorMessage = '';
  activeReactionTab = 'ALL';
  showReactionsModal = false;
  reactionsModalData: any = null;

  private pollingTimer: any;

  constructor(
    public readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    public readonly presence: PresenceService
  ) {}

  openReactionsModal(event: MouseEvent, item: any) {
    event.stopPropagation();
    if (!item.reactions || item.likes === 0) return;
    this.reactionsModalData = item;
    this.activeReactionTab = 'ALL';
    this.showReactionsModal = true;
  }

  getModalReactionTypes(): string[] {
    if (!this.reactionsModalData?.reactions?.breakdown) return [];
    return Object.keys(this.reactionsModalData.reactions.breakdown).filter(type => this.reactionsModalData.reactions.breakdown[type] > 0);
  }

  getFilteredModalNames(): string[] {
    if (!this.reactionsModalData?.reactions?.namesByType) return [];
    if (this.activeReactionTab === 'ALL') {
      let all: string[] = [];
      Object.values(this.reactionsModalData.reactions.namesByType).forEach((names: any) => {
        all = all.concat(names);
      });
      return all;
    }
    return this.reactionsModalData.reactions.namesByType[this.activeReactionTab] || [];
  }

  // --- Lifecycle & Polling ---

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('hr_userId')) || 0;
    this.userEmail = localStorage.getItem('hr_email') || '';
    this.userAvatar = localStorage.getItem('hr_avatar') || '';
    const nom = localStorage.getItem('hr_nom') || '';
    const prenom = localStorage.getItem('hr_prenom') || '';
    this.userName = `${prenom} ${nom}`.trim();

    if (this.userId === 0 && this.userEmail) {
      this.api.getEmployees().subscribe((employees: any[]) => {
        const emp = employees.find((e: any) => e.email === this.userEmail);
        if (emp?.id) {
          this.userId = emp.id;
          localStorage.setItem('hr_userId', String(emp.id));
        }
        this.loadAnnouncements();
      });
    } else {
      this.loadAnnouncements();
    }
    this.pollingTimer = setInterval(() => this.loadAnnouncements(true), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  getUserInitials(): string {
    if (!this.userName) return 'AD';
    const parts = this.userName.split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'AD';
  }


  // --- Data Loading ---

  loadAnnouncements(silent = false): void {
    this.api.getAnnouncements(this.userId).subscribe({
      next: (res: any[]) => {
        const mapped = res.map(a => {
          const oldA = this.announcements.find(x => x.id === a.id);
          return {
            ...a,
            liked: !!a.reactions?.userReaction,
            likes: a.reactions?.total || 0,
            userReaction: a.reactions?.userReaction,
            comments: this.mapComments(a.comments || []),
            showComments: oldA ? oldA.showComments : false,
            showReactionPicker: false,
            tempFileObject: oldA ? oldA.tempFileObject : null,
            commentText: oldA ? oldA.commentText : ''
          };
        });
        
        if (silent || this.announcements.length > 0) {
          this.mergeAnnouncements(mapped);
        } else {
          this.announcements = mapped;
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  private mergeAnnouncements(newList: any[]) {
    // 1. Remove deleted
    const newIds = new Set(newList.map(a => a.id));
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      if (!newIds.has(this.announcements[i].id)) {
        this.announcements.splice(i, 1);
      }
    }

    // 2. Update existing or add new
    newList.forEach(newA => {
      const oldA = this.announcements.find(x => x.id === newA.id);
      if (oldA) {
        oldA.likes = newA.likes;
        oldA.liked = newA.liked;
        oldA.userReaction = newA.userReaction;
        oldA.reactions = newA.reactions;
        oldA.title = newA.title;
        oldA.content = newA.content;
        oldA.date = newA.date;
        oldA.status = newA.status;
        
        if (!oldA.comments) oldA.comments = [];
        this.recursiveMergeComments(oldA.comments, newA.comments);
      } else {
        // Add new (insert at beginning or correct position)
        this.announcements.unshift(newA);
      }
    });
  }

  private recursiveMergeComments(oldList: any[], newList: any[]) {
    if (!newList) return;
    const newIds = new Set(newList.map(c => c.id));
    for (let i = oldList.length - 1; i >= 0; i--) {
      if (!newIds.has(oldList[i].id)) oldList.splice(i, 1);
    }

    newList.forEach(newC => {
      const oldC = oldList.find(x => x.id === newC.id);
      if (oldC) {
        oldC.text = newC.text;
        oldC.likes = newC.likes;
        oldC.liked = newC.liked;
        oldC.userReaction = newC.userReaction;
        oldC.reactions = newC.reactions;
        oldC.fileName = newC.fileName;
        oldC.fileUrl = newC.fileUrl;
        
        if (!oldC.replies) oldC.replies = [];
        this.recursiveMergeComments(oldC.replies, newC.replies);
      } else {
        oldList.push(newC);
      }
    });
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  private mapComments(comments: any[]): any[] {
    return (comments || []).map(c => ({
      ...c,
      liked: !!c.reactions?.userReaction,
      likes: c.reactions?.total || 0,
      userReaction: c.reactions?.userReaction,
      replies: this.mapComments(c.replies || []),
      showReactionPicker: false
    }));
  }

  form = {
    title: '',
    content: '',
    channels: {
      internal: true,
      linkedin: false,
      facebook: false
    },
    isScheduled: false,
    scheduleDate: '',
    scheduleTime: ''
  };

  // --- Filtering ---

  filteredAnnouncements(): AnnouncementDto[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.announcements.filter(a => {
      const textMatch = !query || a.title.toLowerCase().includes(query);
      const catMatch = this.categoryFilter === 'all' || a.category === this.categoryFilter;
      return textMatch && catMatch;
    });
  }

  // --- Modal Management ---

  openModal(): void { this.showModal = true; }
  closeModal(): void {
    this.showModal = false;
    this.errorMessage = '';
    this.form = {
      title: '', content: '',
      channels: { internal: true, linkedin: false, facebook: false },
      isScheduled: false, scheduleDate: '', scheduleTime: ''
    };
  }

  // --- Announcement Submission ---

  submitAnnouncement(): void {
    this.errorMessage = '';
    if (!this.form.title.trim()) { this.errorMessage = "Le titre de l'annonce est obligatoire."; return; }
    if (!this.form.content.trim()) { this.errorMessage = "Le corps du message ne peut pas être vide."; return; }
    if (!this.form.channels.internal && !this.form.channels.linkedin && !this.form.channels.facebook) {
      this.errorMessage = "Veuillez sélectionner au moins un canal de diffusion."; return;
    }
    if (this.form.isScheduled) {
      if (!this.form.scheduleDate || !this.form.scheduleTime) {
        this.errorMessage = "Veuillez sélectionner la date et l'heure de publication."; return;
      }
      if (new Date(`${this.form.scheduleDate}T${this.form.scheduleTime}`) <= new Date()) {
        this.errorMessage = "La date de planification doit être dans le futur."; return;
      }
    }

    const platforms: string[] = [];
    if (this.form.channels.internal) platforms.push('INTERNE');
    if (this.form.channels.linkedin) platforms.push('LINKEDIN');
    if (this.form.channels.facebook) platforms.push('FACEBOOK');

    const payload: any = {
      title: this.form.title.trim(),
      content: this.form.content.trim(),
      category: this.form.channels.internal ? 'INTERNE' : 'EXTERNE',
      status: this.form.isScheduled ? 'SCHEDULED' : 'PUBLISHED',
      platforms: platforms
    };
    if (this.form.isScheduled) {
      payload.scheduledDate = `${this.form.scheduleDate}T${this.form.scheduleTime}:00`;
    }

    this.api.createAnnouncement(payload, this.userId).subscribe({
      next: (newAnn: any) => {
        this.announcements.unshift({ ...newAnn, liked: false, showComments: false, tempFile: null });
        this.closeModal();
        this.cdr.detectChanges();
      }
    });
  }

  // --- Reaction Logic ---

  /** Shared optimistic reaction toggle for both announcements and comments. */
  private applyOptimisticReaction(item: any, type: string): { prevLiked: boolean; prevLikes: number; prevReaction: string | null } {
    const prev = { prevLiked: item.liked, prevLikes: item.likes, prevReaction: item.userReaction };
    if (type === 'LIKE' && item.liked && item.userReaction) type = item.userReaction;
    if (item.userReaction === type) {
      item.liked = false; item.userReaction = null; item.likes = Math.max(0, item.likes - 1);
      if (item.reactions?.breakdown) item.reactions.breakdown[type] = Math.max(0, (item.reactions.breakdown[type] || 0) - 1);
    } else {
      if (!item.liked) item.likes++;
      item.liked = true;
      if (item.reactions?.breakdown) {
        if (item.userReaction) item.reactions.breakdown[item.userReaction] = Math.max(0, item.reactions.breakdown[item.userReaction] - 1);
        item.reactions.breakdown[type] = (item.reactions.breakdown[type] || 0) + 1;
      }
      item.userReaction = type;
    }
    item.showReactionPicker = false;
    this.cdr.detectChanges();
    return prev;
  }

  private applyReactionResponse(item: any, stats: any): void {
    item.likes = stats.total; item.userReaction = stats.userReaction;
    item.liked = !!stats.userReaction; item.reactions = stats;
    this.cdr.detectChanges();
  }

  private revertReaction(item: any, prev: { prevLiked: boolean; prevLikes: number; prevReaction: string | null }): void {
    item.liked = prev.prevLiked; item.likes = prev.prevLikes; item.userReaction = prev.prevReaction;
    this.cdr.detectChanges();
  }

  toggleLike(event: MouseEvent, a: any, type: string = 'LIKE'): void {
    event.preventDefault(); event.stopPropagation();
    if (!this.userId) return;
    const prev = this.applyOptimisticReaction(a, type);
    this.api.likeAnnouncement(a.id, this.userId, type).subscribe({
      next: (stats: any) => this.applyReactionResponse(a, stats),
      error: () => this.revertReaction(a, prev)
    });
  }

  getReactionInfo(type: string | null | undefined) {
    if (!type) return { icon: '👍', label: "J'aime", color: 'var(--text-muted)' };
    return this.reactionsList.find(r => r.type === type) || this.reactionsList[0];
  }

  getDisplayIcon(a: any): string {
    if (a.userReaction) return this.getReactionInfo(a.userReaction).icon;
    if (a.reactions?.breakdown && Object.keys(a.reactions.breakdown).length > 0) {
      let topType = 'LIKE';
      let max = -1;
      for (const [type, count] of Object.entries(a.reactions.breakdown)) {
        if ((count as number) > max) {
          max = count as number;
          topType = type;
        }
      }
      return this.getReactionInfo(topType).icon;
    }
    return '👍';
  }

  getTopIcons(a: any): string[] {
    if (!a.reactions?.breakdown) return [this.getDisplayIcon(a)];
    const entries = Object.entries(a.reactions.breakdown)
      .filter(([type, count]) => (count as number) > 0)
      .sort((v1, v2) => (v2[1] as number) - (v1[1] as number))
      .slice(0, 3);
    
    if (entries.length === 0) return [this.getDisplayIcon(a)];
    return entries.map(([type]) => this.getReactionInfo(type).icon);
  }

  getReactionTooltip(a: any): string {
    if (!a.reactions?.namesByType || Object.keys(a.reactions.namesByType).length === 0) return "Aucune réaction";
    
    let tooltip = "";
    const entries = Object.entries(a.reactions.namesByType);
    
    for (const [type, names] of entries) {
      const icon = this.getReactionInfo(type).icon;
      const nameList = (names as string[]).join(', ');
      tooltip += `${icon} : ${nameList}\n`;
    }
    
    return tooltip.trim();
  }

  // --- Comments & Files ---

  onFileSelected(event: any, a: any): void {
    const file = event.target.files[0];
    if (file) { a.tempFile = file.name; a.tempFileObject = file; }
  }

  submitComment(a: any) {
    const content = (a.commentText || '').trim();
    if (!content && !a.tempFileObject) return;

    if (a.tempFileObject) {
      this.api.uploadFile(a.tempFileObject).subscribe({
        next: (res: any) => {
          this.performCommentSubmission(a, content, res.name, res.url);
        },
        error: () => this.performCommentSubmission(a, content) 
      });
    } else {
      this.performCommentSubmission(a, content);
    }
  }

  private performCommentSubmission(a: any, content: string, fileName?: string, fileUrl?: string): void {
    this.api.addAnnouncementComment(a.id, this.userId, content, fileName, fileUrl).subscribe({
      next: () => {
        a.commentText = '';
        a.tempFileObject = null;
        a.tempFile = null;
        this.loadAnnouncements();
      }
    });
  }

  toggleCommentLike(event: MouseEvent, c: any, type: string = 'LIKE'): void {
    event.preventDefault(); event.stopPropagation();
    if (!c.id || !this.userId) return;
    const prev = this.applyOptimisticReaction(c, type);
    this.api.toggleCommentLike(c.id, this.userId, type).subscribe({
      next: (stats: any) => this.applyReactionResponse(c, stats),
      error: () => this.revertReaction(c, prev)
    });
  }

  submitReply(parent: any, input: HTMLInputElement) {
    const text = input.value.trim();
    if (!text && !parent.tempFileObject) return;

    if (parent.tempFileObject) {
      this.api.uploadFile(parent.tempFileObject).subscribe({
        next: (fileRes: any) => {
          this.doSubmitReply(parent, text, fileRes.name, fileRes.url, input);
          parent.tempFileObject = null;
          parent.tempFile = null;
        },
        error: () => alert("Erreur lors de l'envoi du fichier.")
      });
    } else {
      this.doSubmitReply(parent, text, undefined, undefined, input);
    }
  }

  private doSubmitReply(parent: any, text: string, fileName: string | undefined, fileUrl: string | undefined, input: HTMLInputElement) {
    this.api.addCommentReply(parent.id, this.userId, text, fileName, fileUrl).subscribe({
      next: () => {
        input.value = '';
        parent.showReplyInput = false;
        this.loadAnnouncements();
      }
    });
  }

  deleteComment(comment: any, list: any[]) {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    this.api.deleteComment(comment.id, this.userId).subscribe({
      next: () => this.loadAnnouncements(),
      error: () => alert("Erreur lors de la suppression.")
    });
  }

  editComment(c: any) {
    c.isEditing = true;
    c.editText = c.text;
  }

  saveCommentEdit(c: any) {
    if (!c.editText.trim() && !c.tempFileObject) return;
    
    if (c.tempFileObject) {
      this.api.uploadFile(c.tempFileObject).subscribe({
        next: (res: any) => {
          this.doSaveEdit(c, c.editText, res.name, res.url);
          c.tempFileObject = null;
          c.tempFile = null;
        },
        error: () => alert("Erreur lors de l'envoi du fichier.")
      });
    } else {
      this.doSaveEdit(c, c.editText);
    }
  }

  private doSaveEdit(c: any, text: string, fileName?: string, fileUrl?: string) {
    this.api.updateComment(c.id, this.userId, text, fileName, fileUrl).subscribe({
      next: () => {
        c.isEditing = false;
        this.loadAnnouncements();
      },
      error: () => alert("Erreur lors de la modification.")
    });
  }

}
