import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PresenceService } from '../../core/presence.service';
import { AnnouncementDto } from '../../core/api.types';
import { AvatarColorPipe } from '../../core/avatar-color.pipe';
import { InitialsPipe } from '../../core/initials.pipe';
import { 
  LucideAngularModule, 
  Shield, 
  Clock, 
  Heart,
  MessageCircle, 
  BellOff, 
  Send, 
  Paperclip, 
  Search,
  Calendar as CalendarIcon,
  Filter,
  X,
  Reply,
  ThumbsUp,
  Trash2,
  Edit2,
  Check,
  FileText,
  Download,
  MoreVertical
} from 'lucide-angular';

@Component({
  selector: 'app-emp-announcements-page',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, LucideAngularModule, CommonModule, AvatarColorPipe, InitialsPipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Communications</h2>
        <div class="subtitle">Toute l'actualité et les communications officielles de l'entreprise</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div style="max-width: 800px; margin: 0 auto 24px; display: flex; flex-direction: column; gap: 16px;">
      <div class="card" style="padding: 16px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; border-radius: 16px;">
        <div style="flex: 1; min-width: 250px; position: relative;">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher par titre..." 
                 style="width: 100%; padding: 10px 12px 10px 40px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-main); outline: none;" />
          <i-lucide [name]="Search" [size]="18" style="position: absolute; left: 14px; top: 11px; color: var(--text-muted);"></i-lucide>
        </div>
        
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="position: relative; display: flex; align-items: center;">
            <input type="date" [(ngModel)]="dateFilter" style="padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-main); outline: none; cursor: pointer; min-width: 160px;" />
          </div>

          <button *ngIf="dateFilter" (click)="resetFilters()" 
                  style="padding: 10px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Réinitialiser">
            <i-lucide [name]="XIcon" [size]="18"></i-lucide>
          </button>
        </div>
      </div>
    </div>

    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
      <article *ngFor="let a of filteredList; trackBy: trackById" class="card" style="padding: 32px; border-left: 4px solid var(--color-primary); animation: slideUp 0.4s ease;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="position:relative; flex-shrink:0;">
              <div class="avatar" [ngClass]="(a.email || a.author) | avatarColor : a.avatar" style="width: 48px; height: 48px;">
                {{ a.author | initials }}
              </div>
              <div *ngIf="presence.isUserOnline(a.authorId || 0)" style="position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:var(--color-green); border:2.5px solid white; border-radius:50%;"></div>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 20px; font-weight: 800; color: var(--text-main);">{{ a.title }}</h3>
              <div class="muted" style="font-size: 13px; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                <i-lucide [name]="Clock" [size]="14"></i-lucide>
                Posté le {{ a.date }} • RH & Management
              </div>
            </div>
          </div>
          <span class="chip chip-blue">Annonce Officielle</span>
        </div>

        <div style="font-size: 15px; color: var(--text-main); line-height: 1.8; margin-bottom: 24px; white-space: pre-wrap;">
          {{ a.content }}
        </div>

        <div style="display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid var(--border-light);">
          <!-- Announcement Reaction -->
          <div style="position: relative;" (mouseenter)="a.showReactionPicker = true" (mouseleave)="a.showReactionPicker = false">
            <div *ngIf="a.showReactionPicker" class="reaction-picker">
              <span *ngFor="let r of reactionsList" class="reaction-emoji" (click)="toggleLike($event, a, r.type)" [title]="r.label">{{ r.icon }}</span>
            </div>
            <button class="interaction-btn" [class.liked]="a.liked" (click)="toggleLike($event, a)" 
                    [title]="getReactionTooltip(a)"
                    style="font-size: 13px; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); background: transparent; cursor: pointer; color: var(--text-muted); transition: all 0.2s;"
                    [style.color]="a.liked ? getReactionInfo(a.userReaction).color : 'var(--text-muted)'">
              <div style="display: flex; align-items: center;">
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
                  (focus)="textareaFocused = true"
                  (blur)="textareaFocused = false"
                  [style.borderColor]="textareaFocused ? 'var(--color-primary)' : 'var(--border-color)'"
                ></textarea>
                          <!-- Action Buttons for Textarea -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <div style="display: flex; gap: 8px;">
                    <input type="file" #fileInput (change)="onFileSelected($event, a)" style="display: none;" />
                    <button (click)="fileInput.click()" style="padding: 8px; border-radius: 8px; background: var(--bg-app); border: 1px solid var(--border-color); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px;" title="Ajouter une pièce jointe">
                      <i-lucide [name]="Paperclip" [size]="16"></i-lucide>
                      <span *ngIf="a.tempFile">{{ a.tempFile.name }}</span>
                    </button>
                    <button *ngIf="a.tempFile" (click)="a.tempFile = null" style="color: #ef4444; background: none; border: none; cursor: pointer;">
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
                        <a [href]="getFullUrl(c.fileUrl)" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; text-decoration: none; color: var(--text-main); font-size: 11px;" title="Visualiser">
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
                      <div *ngIf="c.tempFile" style="margin-top: 4px; font-size: 10px; color: var(--color-primary); display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: rgba(0,97,255,0.05); border-radius: 4px;">
                        <span><i-lucide [name]="FileText" [size]="10"></i-lucide> {{ c.tempFile.name }}</span>
                        <button (click)="c.tempFile = null" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i-lucide [name]="XIcon" [size]="10"></i-lucide></button>
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
      </article>

      <div *ngIf="internalAnnouncements.length === 0" style="text-align: center; padding: 80px; color: var(--text-muted);">
        <i-lucide [name]="BellOff" [size]="64" style="opacity: 0.2; margin-bottom: 20px;"></i-lucide>
        <p style="font-size: 18px; font-weight: 600;">Aucune annonce pour le moment</p>
        <p>Revenez plus tard pour les nouvelles de l'entreprise.</p>
      </div>
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
    .page-header { margin-bottom: 32px; }
    h2 { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0; }
    .subtitle { color: var(--text-muted); font-size: 15px; margin-top: 4px; }
    
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-card);
      transition: all 0.3s ease;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    
    .avatar {
      background: var(--color-primary-bg);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      border-radius: 12px;
    }
    
    .chip {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .chip-blue { background: rgba(0, 97, 255, 0.1); color: #0061ff; }
    
    .interaction-btn:hover { background: var(--bg-app) !important; color: var(--text-main) !important; }
    .interaction-btn.liked { border-color: #fecaca !important; background: #fef2f2 !important; }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

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
    
    /* Add a bridge to prevent flickering when moving mouse */
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
  `]
})
export class EmpAnnouncementsPageComponent implements OnInit, OnDestroy {
  protected readonly Shield = Shield;
  protected readonly Clock = Clock;
  protected readonly Heart = Heart;
  protected readonly MessageCircle = MessageCircle;
  protected readonly BellOff = BellOff;
  protected readonly Send = Send;
  protected readonly Paperclip = Paperclip;
  protected readonly Search = Search;
  protected readonly XIcon = X;
  protected readonly X = X;
  protected readonly CalendarIcon = CalendarIcon;
  protected readonly Reply = Reply;
  protected readonly ThumbsUp = ThumbsUp;
  protected readonly MoreVertical = MoreVertical;

  reactionsList = [
    { type: 'LIKE', label: 'J\'aime', icon: '👍', color: '#0061ff' },
    { type: 'LOVE', label: 'J\'adore', icon: '❤️', color: '#ef4444' },
    { type: 'HAHA', label: 'Haha', icon: '😂', color: '#facc15' },
    { type: 'WOW', label: 'Wouah', icon: '😮', color: '#facc15' },
    { type: 'SAD', label: 'Triste', icon: '😢', color: '#facc15' }
  ];
  protected readonly FileText = FileText;
  protected readonly Trash2 = Trash2;
  protected readonly Edit2 = Edit2;
  protected readonly Check = Check;
  protected readonly Download = Download;

  textareaFocused = false;
  private refreshInterval: any;
  pollingActive = true;
  
  searchQuery = '';
  categoryFilter = 'all';
  dateFilter = '';

  internalAnnouncements: AnnouncementDto[] = [];
  filteredList: AnnouncementDto[] = [];
  userId: number = 0;
  userEmail: string = '';
  userAvatar: string = '';
  userName: string = '';
  selectedReplyFile: File | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
    public readonly presence: PresenceService
  ) {}

  getFullUrl(path?: string | null): string {
    return this.api.getFullUrl(path);
  }

  getDownloadUrl(path?: string | null): string {
    return this.api.getDownloadUrl(path);
  }

  activeReactionTab: string = 'ALL';
  showReactionsModal: boolean = false;
  reactionsModalData: any = null;

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

  ngOnInit(): void {
    const localEmail = localStorage.getItem('hr_email') || '';
    const localNom = localStorage.getItem('hr_nom') || '';
    const localPrenom = localStorage.getItem('hr_prenom') || '';
    this.userEmail = localEmail;
    this.userAvatar = localStorage.getItem('hr_avatar') || '';
    this.userName = `${localPrenom} ${localNom}`.trim();
    const storedUserId = localStorage.getItem('hr_userId');
    
    if (storedUserId && storedUserId !== '0' && storedUserId !== 'null') {
      this.userId = Number(storedUserId);
      this.loadAnnouncements();
    } else if (localEmail) {
      this.api.getEmployees().subscribe({
        next: (employees) => {
          const emp = employees.find(e => e.email === localEmail);
          if (emp && emp.id) {
            this.userId = emp.id;
            localStorage.setItem('hr_userId', String(emp.id));
            this.loadAnnouncements();
          } else {
            this.loadAnnouncements();
          }
        },
        error: () => this.loadAnnouncements()
      });
    } else {
      this.loadAnnouncements();
    }
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling() {
    this.refreshInterval = setInterval(() => {
      if (this.pollingActive) {
        this.loadAnnouncements(true);
      }
    }, 1000);
  }

  stopPolling() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getUserInitials(): string {
    const eNom = localStorage.getItem('hr_nom') || '';
    const ePrenom = localStorage.getItem('hr_prenom') || '';
    if (!eNom && !ePrenom) return 'AD';
    return `${ePrenom.charAt(0)}${eNom.charAt(0)}`.toUpperCase();
  }


  loadAnnouncements(silent = false): void {
    this.api.getAnnouncements(this.userId).subscribe({
      next: (res: any[]) => {
        const mapped = res.map(a => ({
          ...a,
          date: a.date || new Date().toISOString().split('T')[0],
          liked: !!a.reactions?.userReaction,
          likes: a.reactions?.total || 0,
          userReaction: a.reactions?.userReaction,
          comments: this.mapComments(a.comments || []),
          showComments: false,
          showReactionPicker: false
        }));

        if (silent) {
          this.mergeAnnouncements(mapped);
        } else {
          this.internalAnnouncements = mapped;
        }

        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load announcements', err)
    });
  }

  private mergeAnnouncements(newList: any[]) {
    newList.forEach(newA => {
      const oldA = this.internalAnnouncements.find(x => x.id === newA.id);
      if (oldA) {
        oldA.likes = newA.likes;
        oldA.liked = newA.liked;
        oldA.userReaction = newA.userReaction;
        oldA.reactions = newA.reactions;
        
        // Use deep merge for comments to preserve local UI states
        if (!oldA.comments) oldA.comments = [];
        this.recursiveMergeComments(oldA.comments, newA.comments);
      }
    });
    // Add new announcements if any
    if (newList.length > this.internalAnnouncements.length) {
      this.internalAnnouncements = newList;
    }
  }

  private recursiveMergeComments(oldList: any[], newList: any[]) {
    if (!newList) return;

    // 1. Remove comments that no longer exist
    const newIds = new Set(newList.map(c => c.id));
    for (let i = oldList.length - 1; i >= 0; i--) {
      if (!newIds.has(oldList[i].id)) {
        oldList.splice(i, 1);
      }
    }

    // 2. Update existing or add new
    newList.forEach(newC => {
      const oldC = oldList.find(x => x.id === newC.id);
      if (oldC) {
        // Update data fields
        oldC.text = newC.text;
        oldC.likes = newC.likes;
        oldC.liked = newC.liked;
        oldC.userReaction = newC.userReaction;
        oldC.reactions = newC.reactions;
        oldC.fileName = newC.fileName;
        oldC.fileUrl = newC.fileUrl;
        
        // Recursive merge for replies
        if (!oldC.replies) oldC.replies = [];
        this.recursiveMergeComments(oldC.replies, newC.replies);
      } else {
        // New comment, add it
        oldList.push(newC);
      }
    });
    
    // Sort to keep order consistent if needed (assuming server returns ordered)
    // oldList.sort((a,b) => b.id - a.id); 
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



  onFileSelected(event: any, a: any): void {
    const file = event.target.files[0];
    if (file) {
      a.tempFile = file;
    }
  }

  submitComment(a: any): void {
    const content = (a.commentText || '').trim();
    if (!content && !a.tempFile) return;

    if (a.tempFile) {
      this.api.uploadFile(a.tempFile).subscribe({
        next: (res) => {
          this.performCommentSubmission(a, content, res.name, res.url);
          a.tempFile = null;
          a.commentText = '';
        },
        error: () => this.performCommentSubmission(a, content) 
      });
    } else {
      this.performCommentSubmission(a, content);
      a.commentText = '';
    }
  }

  private performCommentSubmission(a: any, content: string, fileName?: string, fileUrl?: string): void {
    this.api.addAnnouncementComment(a.id, this.userId, content, fileName, fileUrl).subscribe({
      next: (serverComment) => {
        // We rely on 1s polling to show the comment, preventing duplicates
        a.commentText = '';
        a.tempFile = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to add comment', err);
        alert("Erreur lors de l'ajout du commentaire : " + (err.error?.error || "Erreur serveur"));
      }
    });
  }

  toggleLike(event: MouseEvent, a: any, type: string = 'LIKE') {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.userId || this.userId === 0) {
      alert("Erreur : Votre session est incomplète. Veuillez vous reconnecter.");
      return;
    }

    const previousLiked = a.liked;
    const previousLikes = a.likes;
    const previousUserReaction = a.userReaction;

    // If clicking main button while already reacted, toggle OFF by using current reaction type
    if (type === 'LIKE' && a.liked && a.userReaction) {
      type = a.userReaction;
    }

    // Optimistic
    if (a.userReaction === type) {
        a.liked = false;
        a.userReaction = null;
        a.likes = Math.max(0, a.likes - 1);
        if (a.reactions?.breakdown) {
          a.reactions.breakdown[type] = Math.max(0, (a.reactions.breakdown[type] || 0) - 1);
        }
    } else {
        if (!a.liked) a.likes++;
        a.liked = true;
        if (a.reactions?.breakdown) {
          if (a.userReaction) a.reactions.breakdown[a.userReaction] = Math.max(0, a.reactions.breakdown[a.userReaction] - 1);
          a.reactions.breakdown[type] = (a.reactions.breakdown[type] || 0) + 1;
        }
        a.userReaction = type;
    }
    a.showReactionPicker = false;
    this.cdr.detectChanges();

    this.api.likeAnnouncement(a.id, this.userId, type).subscribe({
      next: (stats) => {
        a.likes = stats.total;
        a.userReaction = stats.userReaction;
        a.liked = !!stats.userReaction;
        a.reactions = stats;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Like failed, rolling back', err);
        a.liked = previousLiked;
        a.likes = previousLikes;
        a.userReaction = previousUserReaction;
        this.cdr.detectChanges();
        alert("Erreur : " + (err.error?.error || "Impossible d'enregistrer la réaction"));
      }
    });
  }

  applyFilters() {
    if (!this.internalAnnouncements) {
      this.filteredList = [];
      return;
    }
    
    this.filteredList = this.internalAnnouncements.filter(a => {
      const query = (this.searchQuery || '').toLowerCase();
      const matchesSearch = !query || a.title.toLowerCase().includes(query);
      
      const filterDate = this.dateFilter || '';
      const matchesDate = !filterDate || a.date === filterDate;
      
      return matchesSearch && matchesDate;
    });
  }

  resetFilters() {
    this.searchQuery = '';
    this.dateFilter = '';
    this.applyFilters();
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

  toggleCommentLike(event: MouseEvent, c: any, type: string = 'LIKE') {
    event.preventDefault();
    event.stopPropagation();
    
    if (!c.id || !this.userId || this.userId === 0) return;

    const previousLiked = c.liked;
    const previousLikes = c.likes;
    const previousUserReaction = c.userReaction;

    // If clicking main button while already reacted, toggle OFF by using current reaction type
    if (type === 'LIKE' && c.liked && c.userReaction) {
      type = c.userReaction;
    }

    // Optimistic
    if (c.userReaction === type) {
        c.liked = false;
        c.userReaction = null;
        c.likes = Math.max(0, c.likes - 1);
        if (c.reactions?.breakdown) {
          c.reactions.breakdown[type] = Math.max(0, (c.reactions.breakdown[type] || 0) - 1);
        }
    } else {
        if (!c.liked) c.likes++;
        c.liked = true;
        if (c.reactions?.breakdown) {
          if (c.userReaction) c.reactions.breakdown[c.userReaction] = Math.max(0, c.reactions.breakdown[c.userReaction] - 1);
          c.reactions.breakdown[type] = (c.reactions.breakdown[type] || 0) + 1;
        }
        c.userReaction = type;
    }
    c.showReactionPicker = false;
    this.cdr.detectChanges();

    this.api.toggleCommentLike(c.id, this.userId, type).subscribe({
      next: (stats) => {
        c.likes = stats.total;
        c.userReaction = stats.userReaction;
        c.liked = !!stats.userReaction;
        c.reactions = stats;
        this.cdr.detectChanges();
      },
      error: (err) => {
        c.liked = previousLiked;
        c.likes = previousLikes;
        c.userReaction = previousUserReaction;
        this.cdr.detectChanges();
      }
    });
  }

  submitReply(parent: any, input: HTMLInputElement) {
    const text = input.value.trim();
    if (!text && !parent.tempFile) return;

    if (parent.tempFile) {
      this.api.uploadFile(parent.tempFile).subscribe({
        next: (fileRes) => {
          this.doSubmitReply(parent, text, fileRes.name, fileRes.url, input);
        },
        error: (err) => {
          console.error('File upload failed', err);
          alert("Erreur lors de l'envoi du fichier.");
        }
      });
    } else {
      this.doSubmitReply(parent, text, undefined, undefined, input);
    }
  }

  private doSubmitReply(parent: any, text: string, fileName: string | undefined, fileUrl: string | undefined, input: HTMLInputElement) {
    this.api.addCommentReply(parent.id, this.userId, text, fileName, fileUrl).subscribe({
      next: (newReply) => {
        if (!parent.replies) parent.replies = [];
        const mapped = {
          ...newReply,
          liked: false,
          likes: 0,
          replies: [],
          showReactionPicker: false,
          showReplyInput: false
        };
        parent.replies.push(mapped);
        input.value = '';
        parent.showReplyInput = false;
        parent.tempFile = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert("Erreur lors de l'envoi de la réponse.");
      }
    });
  }

  deleteComment(comment: any, list: any[]) {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    this.api.deleteComment(comment.id, this.userId).subscribe({
      next: () => {
        const index = list.indexOf(comment);
        if (index > -1) list.splice(index, 1);
        this.cdr.detectChanges();
      },
      error: (err) => alert("Erreur lors de la suppression.")
    });
  }

  editComment(c: any) {
    c.isEditing = true;
    c.editText = c.text;
  }

  saveCommentEdit(c: any) {
    if (!c.editText.trim() && !c.tempFile) return;
    
    if (c.tempFile) {
      this.api.uploadFile(c.tempFile).subscribe({
        next: (res) => {
          this.doSaveEdit(c, c.editText, res.name, res.url);
        },
        error: () => alert("Erreur lors de l'envoi du fichier.")
      });
    } else {
      this.doSaveEdit(c, c.editText);
    }
  }

  private doSaveEdit(c: any, text: string, fileName?: string, fileUrl?: string) {
    this.api.updateComment(c.id, this.userId, text, fileName, fileUrl).subscribe({
      next: (updated) => {
        c.text = updated.text;
        if (updated.fileName) {
          c.fileName = updated.fileName;
          c.fileUrl = updated.fileUrl;
        }
        c.isEditing = false;
        c.tempFile = null;
        this.cdr.detectChanges();
      },
      error: (err) => alert("Erreur lors de la modification.")
    });
  }



  trackById(index: number, item: any) {
    return item.id;
  }
}
