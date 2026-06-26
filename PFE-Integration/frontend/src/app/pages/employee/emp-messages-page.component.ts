import { Component, ChangeDetectorRef, signal, computed, OnInit, OnDestroy, NgZone, effect } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Phone, Video, X, Search, FileText, Download, Image, MessageSquare, Send, Paperclip, MoreVertical } from 'lucide-angular';
import { ApiService } from '../../core/api.service';
import { PresenceService } from '../../core/presence.service';
import { Subscription } from 'rxjs';
import { AvatarColorPipe } from '../../core/avatar-color.pipe';

@Component({
  selector: 'app-emp-messages-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, LucideAngularModule, AvatarColorPipe],
  template: `
    <div class="card emp-messages-container" style="padding:0; height:calc(100vh - 160px); display:flex; position:relative; overflow:hidden;">

      <!-- Conversations List -->
      <aside style="width:320px; border-right:1px solid var(--border-color); display:flex; flex-direction:column;">
        <div style="padding:20px; border-bottom:1px solid var(--border-color);">
          <h3 style="margin:0; font-size:18px;">Messages</h3>
          <div class="topbar-search" style="margin-top:16px; width:100%;">
            <i-lucide name="Search" [size]="14" class="search-icon"></i-lucide>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Rechercher..." style="width:100%; border-radius:8px; padding:8px 8px 8px 32px; background:var(--bg-input); color:var(--text-main); border:1px solid var(--border-color); outline:none;" />
          </div>
        </div>
        <div style="flex:1; overflow-y:auto;">
          <div *ngFor="let chat of filteredChats(); trackBy: trackByChatId" (click)="selectChat(chat)" [class.active-chat]="selectedChat()?.id === chat.id" style="padding:16px; border-bottom:1px solid var(--border-light); cursor:pointer; display:flex; gap:12px; transition:all 0.2s;" class="chat-item">
            <div style="position:relative; flex-shrink:0;">
              <div class="avatar" [ngClass]="(chat.email || chat.name) | avatarColor : chat.avatar" style="width:40px; height:40px;">{{ chat.initials }}</div>
              <div *ngIf="chat.online" style="position:absolute; bottom:0; right:0; width:10px; height:10px; background:var(--color-green); border:2px solid white; border-radius:50%;"></div>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                  <span style="font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ chat.name }}</span>
                  <div *ngIf="chat.unreadCount > 0" style="background:#0061FF; color:white; font-size:10px; font-weight:700; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">{{ chat.unreadCount }}</div>
                </div>
                <span class="muted" style="font-size:10px; flex-shrink:0;">{{ chat.time }}</span>
              </div>
              <div class="muted" style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">{{ chat.lastMsg }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Chat View -->
      <main *ngIf="selectedChat()" style="flex:1; display:flex; flex-direction:column; background:var(--bg-app);">
        <header style="padding:16px 24px; background:var(--bg-card); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="position:relative;">
              <div class="avatar" [ngClass]="(selectedChat()?.email || selectedChat()?.name) | avatarColor : selectedChat()?.avatar">{{ selectedChat()?.initials }}</div>
              <div *ngIf="selectedChat()?.online" style="position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:var(--color-green); border:2px solid white; border-radius:50%;"></div>
            </div>
            <div>
              <div style="font-weight:700; font-size:15px;">{{ selectedChat()?.name }}</div>
              <div class="muted" style="font-size:11px;">{{ selectedChat()?.role }} · {{ selectedChat()?.online ? 'En ligne' : 'Hors ligne' }}</div>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="icon-btn" (click)="startCall('audio')"><i-lucide name="Phone" [size]="18"></i-lucide></button>
            <button class="icon-btn" (click)="startCall('video')"><i-lucide name="Video" [size]="18"></i-lucide></button>
            <button class="icon-btn"><i-lucide name="MoreVertical" [size]="18"></i-lucide></button>
          </div>
        </header>
        <div style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; min-height: 0;">
          <div *ngFor="let msg of messages(); trackBy: trackByMsgTime" [style.align-self]="msg.isMe ? 'flex-end' : 'flex-start'" [style.max-width]="'70%'">
            <div [style.background]="msg.isMe ? 'var(--color-primary)' : 'var(--bg-input)'" [style.color]="msg.isMe ? 'white' : 'var(--text-main)'" [style.padding]="'12px 16px'" [style.border-radius]="msg.isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px'" [style.box-shadow]="'var(--shadow-sm)'" style="font-size:14px; line-height:1.5;">
              <div *ngIf="msg.text">{{ msg.text }}</div>
              <div *ngIf="msg.fileUrl" (click)="download(msg.fileUrl)" style="display:flex; align-items:center; gap:10px; padding:8px; background:rgba(0,0,0,0.05); border-radius:8px; margin-top:4px; cursor:pointer;" class="message-file">
                 <i-lucide name="FileText" [size]="18"></i-lucide>
                 <span style="font-size:12px; font-weight:600; text-decoration:underline;">{{ msg.fileName }}</span>
                 <i-lucide name="Download" [size]="14" style="opacity:0.7;"></i-lucide>
              </div>
              <div *ngIf="msg.fileUrl && isImage(msg.fileName)" (click)="download(msg.fileUrl)" style="margin-top:8px; cursor:pointer;">
                 <img [src]="getFullUrl(msg.fileUrl)" style="max-width:100%; border-radius:8px; border:1px solid rgba(255,255,255,0.2);" />
              </div>
            </div>
            <div [style.text-align]="msg.isMe ? 'right' : 'left'" class="muted" style="font-size:10px; margin:4px 4px 0;">{{ msg.time }}</div>
          </div>
        </div>
        <footer style="padding:20px; background:var(--bg-card); border-top:1px solid var(--border-color);">
          <div *ngIf="stagedFile()" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; padding:10px; background:var(--bg-app); border-radius:12px; border:1px dashed var(--border-color);">
            <div style="background:var(--color-primary-bg); color:var(--color-primary); width:40px; height:40px; border-radius:8px; display:grid; place-items:center;">
              <i-lucide [name]="isImage(stagedFile()?.name || '') ? 'Image' : 'FileText'" [size]="20"></i-lucide>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ stagedFile()?.name }}</div>
              <div style="font-size:11px; opacity:0.6;">Fichier prêt à être envoyé</div>
            </div>
            <button class="icon-btn" (click)="clearStagedFile()" style="color:#ef4444;"><i-lucide name="X" [size]="18"></i-lucide></button>
          </div>
          <div style="display:flex; gap:12px; align-items:center;">
            <input type="file" #fileInput style="display:none" (change)="onFileSelected($event)" />
            <button class="icon-btn" [class.active-staged]="stagedFile()" (click)="fileInput.click()"><i-lucide name="Paperclip" [size]="20"></i-lucide></button>
            <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Tapez votre message..." style="flex:1; border:1px solid var(--border-color); border-radius:24px; padding:10px 16px; outline:none; background:var(--bg-input); color:var(--text-main);" />
            <button class="btn btn-primary" style="padding:10px; border-radius:50%; min-width:44px;" (click)="sendMessage()">
              <i-lucide name="Send" [size]="20" color="#fff"></i-lucide>
            </button>
          </div>
        </footer>
      </main>

      <div *ngIf="!selectedChat()" style="flex:1; display:grid; place-items:center; background:var(--bg-app); color:var(--text-muted);">
        <div style="text-align:center;">
          <i-lucide name="MessageSquare" [size]="64" style="opacity:0.2; margin-bottom:16px;"></i-lucide>
          <p>Sélectionnez une conversation pour commencer à discuter</p>
        </div>
      </div>
    </div>

  `
})
/**
 * Employee portal messaging component with real-time WebSocket communication.
 * Handles chat list, message display, file sharing, and presence indicators.
 */
export class EmpMessagesPageComponent implements OnInit, OnDestroy {
  // Component State
  newMessage = '';
  searchQuery = signal('');
  selectedChatId = signal<number | null>(null);
  stagedFile = signal<File | null>(null);
  currentUserId = 0;

  // Subscriptions
  private msgSub?: Subscription;
  private pollingTimer?: any;

  // Reactive Data
  chats = signal<any[]>([]);

  chatsWithStatus = computed(() => {
    const list = this.chats();
    const onlineIds = this.presence.onlineUsers();
    return list.map(c => ({ ...c, online: onlineIds.includes(Number(c.dbUserId)) }));
  });

  filteredChats = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const currentList = this.chatsWithStatus();
    if (!query) return currentList;
    return currentList.filter(c => c.name.toLowerCase().includes(query));
  });

  selectedChat = computed(() => {
    const id = this.selectedChatId();
    return this.chatsWithStatus().find(c => c.id === id) || null;
  });

  messages = computed(() => this.selectedChat()?.messages || []);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly api: ApiService,
    public readonly presence: PresenceService,
    private readonly ngZone: NgZone
  ) {
    // Sync total unread count to the global presence service
    effect(() => {
      const total = this.chats().reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      this.presence.updateUnreadCount(total);
    });
  }

  // --- Lifecycle & Polling ---

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('hr_userId')) || 0;

    this.pollingTimer = setInterval(() => {
      if (!this.currentUserId) {
        this.currentUserId = Number(localStorage.getItem('hr_userId')) || 0;
      }
      if (this.currentUserId > 0) this.loadRealUsers();
    }, 5000);

    if (this.currentUserId > 0) this.loadRealUsers();

    this.msgSub = this.presence.messages$.subscribe(data => {
      this.ngZone.run(() => this.handleIncomingMessage(data));
    });
  }

  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  // --- Call Logic ---

  startCall(type: 'audio' | 'video'): void {
    const activeChat = this.selectedChat();
    if (!activeChat) return;
    if (!activeChat.online) { alert("L'utilisateur n'est pas en ligne."); return; }
    this.presence.startCall(activeChat.dbUserId, activeChat.name, type, activeChat.email, activeChat.avatar);
  }

  endCall(): void { this.presence.stopCall(); }
  formatDuration(seconds: number): string { return this.presence.formatDuration(seconds); }

  // --- Incoming Message Handling ---

  handleIncomingMessage(data: any): void {
    const senderIdNum = Number(data.senderId);
    const receiverIdNum = Number(data.receiverId);
    const otherUserId = senderIdNum === this.currentUserId ? receiverIdNum : senderIdNum;
    const chatList = [...this.chats()];
    const chatIndex = chatList.findIndex(c => Number(c.dbUserId) === otherUserId);
    if (chatIndex === -1) return;

    const chatObj = { ...chatList[chatIndex] };
    const displayTime = this.formatTimestamp(data.timestamp);
    const isFromMe = senderIdNum === this.currentUserId;

    chatObj.messages = [...(chatObj.messages || []), {
      text: data.text, time: displayTime, isMe: isFromMe,
      fileUrl: data.fileUrl, fileName: data.fileName
    }];
    chatObj.lastMsg = data.text || (data.fileName ? 'Fichier: ' + data.fileName : '');
    chatObj.time = displayTime;

    const isCurrentlySelected = this.selectedChat()?.dbUserId === chatObj.dbUserId;
    if (!isFromMe && !isCurrentlySelected) {
      chatObj.unreadCount = (chatObj.unreadCount || 0) + 1;
      chatObj.unread = true;
    } else if (!isFromMe && isCurrentlySelected) {
      this.api.markAsRead(this.currentUserId, chatObj.dbUserId).subscribe();
    }

    chatList[chatIndex] = chatObj;
    this.chats.set(chatList);
    this.cdr.detectChanges();
  }

  // --- Data Loading ---

  private loadRealUsers(): void {
    this.api.getChatUsers().subscribe(users => {
      const currentList = this.chats();
      const userChats = users
        .filter(u => Number(u.id) !== this.currentUserId)
        .map((u, index) => {
          const existing = currentList.find(c => Number(c.dbUserId) === Number(u.id));
          return {
            id: existing?.id ?? (index + 1), dbUserId: u.id,
            name: `${u.prenom} ${u.nom}`, initials: (u.prenom[0] || '') + (u.nom[0] || ''),
            email: u.email, avatar: u.avatar,
            role: u.poste || u.role, lastMsg: existing?.lastMsg ?? 'Commencez la discussion',
            time: existing?.time ?? '', unread: existing?.unread ?? false,
            unreadCount: existing?.unreadCount ?? 0, messages: existing?.messages ?? []
          };
        });
      this.chats.set(userChats);

      // Load conversation history for each user
      userChats.forEach(chat => {
        this.api.getConversation(this.currentUserId, chat.dbUserId).subscribe(dbMessages => {
          if (!dbMessages?.length) return;
          const formattedMsgs = dbMessages.map((m: any) => ({
            text: m.text, time: this.formatTimestamp(m.timestamp),
            isMe: Number(m.senderId) === this.currentUserId,
            fileUrl: m.fileUrl, fileName: m.fileName
          }));

          this.chats.update(list => {
            const idx = list.findIndex(c => c.dbUserId === chat.dbUserId);
            if (idx === -1) return list;

            const updated = { ...list[idx] };
            if (JSON.stringify(updated.messages) !== JSON.stringify(formattedMsgs)) {
              updated.messages = formattedMsgs;
            }
            const lastM = formattedMsgs[formattedMsgs.length - 1];
            updated.lastMsg = lastM.text || (lastM.fileName ? 'Fichier: ' + lastM.fileName : '');
            updated.time = lastM.time;

            const unreadCount = dbMessages.filter((m: any) => {
              const isRead = m.read ?? m.isRead ?? false;
              return Number(m.senderId) !== this.currentUserId && !isRead;
            }).length;
            updated.unreadCount = unreadCount;
            updated.unread = unreadCount > 0;

            list[idx] = updated;
            return [...list];
          });
          this.cdr.detectChanges();
        });
      });
    });
  }

  // --- Chat Selection & Actions ---

  selectChat(chat: any): void {
    this.selectedChatId.set(chat.id);
    if (chat.unread) {
      this.chats.update(list => {
        const idx = list.findIndex(c => c.id === chat.id);
        if (idx !== -1) { list[idx].unread = false; list[idx].unreadCount = 0; }
        return [...list];
      });
      this.api.markAsRead(this.currentUserId, chat.dbUserId).subscribe();
    }
    this.cdr.detectChanges();
  }

  trackByChatId(_: number, chat: any): number { return chat.id; }
  trackByMsgTime(index: number): number { return index; }

  // --- Message Sending ---

  sendMessage(): void {
    const activeChat = this.selectedChat();
    if ((!this.newMessage.trim() && !this.stagedFile()) || !activeChat) return;
    const file = this.stagedFile();
    if (file) {
      this.api.uploadFile(file).subscribe(res => {
        this.presence.send({ senderId: this.currentUserId, receiverId: activeChat.dbUserId, text: this.newMessage, fileUrl: res.url, fileName: res.name });
        this.stagedFile.set(null);
        this.newMessage = '';
      });
    } else {
      this.presence.send({ senderId: this.currentUserId, receiverId: activeChat.dbUserId, text: this.newMessage });
      this.newMessage = '';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedChat()) return;
    this.stagedFile.set(file);
    event.target.value = '';
  }

  clearStagedFile(): void { this.stagedFile.set(null); }

  // --- Utility Helpers ---

  download(url: string): void { window.open(this.getFullUrl(url), '_blank'); }
  getFullUrl(url: string): string { return url.startsWith('http') ? url : 'http://localhost:8081' + url; }

  isImage(fileName: string): boolean {
    if (!fileName) return false;
    return /\.(png|jpe?g|gif|webp)$/i.test(fileName);
  }

  /** Parses server timestamps (ISO string or Array format) to a display time string. */
  private formatTimestamp(timestamp: any): string {
    if (!timestamp) return 'Maintenant';
    const d = Array.isArray(timestamp)
      ? new Date(timestamp[0], timestamp[1] - 1, timestamp[2], timestamp[3] || 0, timestamp[4] || 0)
      : new Date(timestamp);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
