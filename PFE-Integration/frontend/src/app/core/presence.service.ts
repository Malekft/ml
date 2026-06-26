import { Injectable, signal, computed, NgZone, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private ws: WebSocket | null = null;
  private currentConnectedUserId: number | null = null;
  private onlineUsersSignal = signal<number[]>([]);
  private heartbeatInterval: any;
  private pollingInterval: any;
  totalUnreadCount = signal<number>(0);
  
  // Call Global State
  isCalling = signal(false);
  callType = signal<'audio' | 'video'>('audio');
  isIncomingCall = signal(false);
  callerInfo = signal<any>(null);
  incomingCallType = signal<'audio' | 'video'>('audio');
  callDuration = signal(0);
  amIInitiator = signal(false);
  private callTimerInterval?: any;
  private ringtone?: HTMLAudioElement;
  private remoteAudioElement?: HTMLAudioElement;

  // Media Controls State
  isMicMuted = signal(false);
  isSpeakerMuted = signal(false);
  isVideoMuted = signal(false);
  isCallExpandedSignal = signal(false);
  private pendingCallSync = false;



  // WebRTC State
  private peerConnection?: RTCPeerConnection;
  private localStream?: MediaStream;
  private remoteStream?: MediaStream;



  // Observable for incoming chat messages so components can listen
  private messageSubject = new Subject<any>();
  messages$ = this.messageSubject.asObservable();

  private signalSubject = new Subject<any>();
  signals$ = this.signalSubject.asObservable();

  onlineUsers = computed(() => this.onlineUsersSignal());
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8081/api';

  constructor(private readonly ngZone: NgZone) {
    this.ringtone = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
    this.ringtone.loop = true;
    this.remoteAudioElement = new Audio();
    this.remoteAudioElement.autoplay = true;

    // Restore call if page was refreshed
    this.restoreCallState();
  }



  connect(userId: number) {
    if (userId === 0) return;
    
    // If already connected for the same user AND it's still alive, just exit
    if (this.ws && 
        this.currentConnectedUserId === userId && 
        (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // If already connected for a DIFFERENT user or stale, disconnect first
    if (this.ws) {
       this.disconnect();
    }

    this.currentConnectedUserId = userId;
    this.ws = new WebSocket('ws://localhost:8081/api/ws/chat');

    this.ws.onopen = () => {
      console.log('Presence WS Connected for User:', userId);
      this.ws?.send('REGISTER:' + userId);
      
      // Start heartbeat to keep connection alive
      this.heartbeatInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send('PING');
        }
      }, 30000); // Pulse every 30s

      if (this.pendingCallSync) {
        this.reinitCallAfterRefresh();
        this.pendingCallSync = false;
      }
    };


    this.ws.onmessage = (event) => {
      this.ngZone.run(() => {
        const data = JSON.parse(event.data);
        if (data.type === 'PRESENCE') {
          this.handlePresenceUpdate(data.userId, data.online);
        } else if (data.type === 'ONLINE_LIST') {
          this.handleOnlineList(data.users);
        } else if (data.type === 'SIGNAL') {
          this.handleCallSignal(data);
          this.signalSubject.next(data);
        } else {
          // It's a real chat message
          if (Number(data.receiverId) === this.currentConnectedUserId) {
            this.totalUnreadCount.update(c => c + 1);
          }
          this.messageSubject.next(data);
        }
      });
    };

    this.ws.onclose = () => {
      console.log('Presence WS Disconnected. Attempting reconnect in 5s...');
      this.ws = null;
      setTimeout(() => {
        if (this.currentConnectedUserId) {
          this.connect(this.currentConnectedUserId);
        }
      }, 5000);
    };

    this.ws.onerror = (e) => {
      console.error('Presence WS Error:', e);
    };
  }

  private handlePresenceUpdate(userId: number, online: boolean) {
    this.onlineUsersSignal.update(users => {
      if (online) {
        return users.includes(userId) ? users : [...users, userId];
      } else {
        return users.filter(id => id !== userId);
      }
    });
  }

  private handleOnlineList(users: number[]) {
    this.onlineUsersSignal.set(users);
  }

  send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('WS not open, cannot send message');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.heartbeatInterval) {
       clearInterval(this.heartbeatInterval);
       this.heartbeatInterval = null;
    }
    if (this.pollingInterval) {
       clearInterval(this.pollingInterval);
       this.pollingInterval = null;
    }
    this.currentConnectedUserId = null;
    this.onlineUsersSignal.set([]);
    this.totalUnreadCount.set(0);
  }

  updateUnreadCount(count: number) {
    this.totalUnreadCount.set(count);
  }

  loadUnreadCount(userId: number) {
    if (userId === 0) return;
    this.http.get<number>(`${this.baseUrl}/messages/unread/${userId}`).subscribe({
      next: (count) => this.totalUnreadCount.set(count),
      error: () => {}
    });
  }

  startPollingUnreadCount(userId: number) {
    if (userId === 0) return;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.loadUnreadCount(userId);
    this.pollingInterval = setInterval(() => {
      this.loadUnreadCount(userId);
    }, 1000);
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsersSignal().includes(Number(userId));
  }

  // =============================================
  // CALLING LOGIC - Clean WebRTC Signaling Flow
  // =============================================
  // Flow:
  //   1. Caller → OFFER_REQUEST → Receiver
  //   2. Receiver → CALL_ACCEPTED → Caller  (timer starts for both)
  //   3. Caller → inits WebRTC → creates OFFER → Receiver
  //   4. Receiver → inits WebRTC → creates ANSWER → Caller
  //   5. Both exchange CANDIDATE signals
  //   6. Audio/video flows!

  handleCallSignal(data: any) {
    this.ngZone.run(() => {
      switch (data.subtype) {
        case 'OFFER_REQUEST':
          if (this.isCalling() || this.isIncomingCall()) {
             // Busy — auto-reject
             this.send({ type: 'SIGNAL', subtype: 'REJECT', senderId: this.currentConnectedUserId, receiverId: data.senderId });
             return;
          }
          this.callerInfo.set({ id: data.senderId, name: data.senderName, email: data.senderEmail || '', avatar: data.senderAvatar || '' });
          this.incomingCallType.set(data.callType);
          this.isIncomingCall.set(true);
          this.playRingtone();
          break;

        case 'CALL_ACCEPTED':
          // I'm the caller — the other person accepted!
          this.startCallTimer();
          this.initWebRTC(true);
          break;
        case 'OFFER':
          this.handleOffer(data.offer, data.senderId);
          break;
        case 'ANSWER':
          this.handleAnswer(data.answer);
          break;
        case 'CANDIDATE':
          this.handleCandidate(data.candidate);
          break;
        case 'REJECT':
          this.stopCall();
          break;
        case 'REJOIN':
          // The other party reconnected after a refresh
          // We need to re-initiate the handshake
          if (this.amIInitiator()) {
            this.initWebRTC(true);
          }
          break;
      }

    });
  }


  /** Caller initiates a call */
  startCall(targetUserId: number, targetName: string, type: 'audio' | 'video', targetEmail?: string, targetAvatar?: string) {
    this.callType.set(type);
    this.isCalling.set(true);
    this.amIInitiator.set(true);
    this.callerInfo.set({ id: targetUserId, name: targetName, email: targetEmail || '', avatar: targetAvatar || '' });
    
    const prenom = localStorage.getItem('hr_prenom') || '';
    const nom = localStorage.getItem('hr_nom') || '';
    const fullName = `${prenom} ${nom}`.trim() || 'Utilisateur';
    const myEmail = localStorage.getItem('hr_email') || '';
    const myAvatar = localStorage.getItem('hr_avatar') || '';
    
    this.send({
      type: 'SIGNAL',
      subtype: 'OFFER_REQUEST',
      senderId: this.currentConnectedUserId,
      receiverId: targetUserId,
      senderName: fullName,
      senderEmail: myEmail,
      senderAvatar: myAvatar,
      callType: type
    });

    this.setCallExpanded(true);
  }



  /** Receiver accepts the call */
  acceptCall() {
    this.stopRingtone();
    const callerId = this.callerInfo()?.id;
    const type = this.incomingCallType();
    this.isIncomingCall.set(false);
    this.isCalling.set(true);
    this.amIInitiator.set(false);
    this.callType.set(type);
    this.startCallTimer();

    // Start WebRTC as receiver
    this.initWebRTC(false);

    // Notify the caller that we accepted

    this.send({
      type: 'SIGNAL',
      subtype: 'CALL_ACCEPTED',
      senderId: this.currentConnectedUserId,
      receiverId: callerId
    });

    this.setCallExpanded(true);
  }



  rejectCall() {
    this.stopRingtone();
    this.send({
      type: 'SIGNAL',
      subtype: 'REJECT',
      senderId: this.currentConnectedUserId,
      receiverId: this.callerInfo()?.id
    });
    this.isIncomingCall.set(false);
    this.callerInfo.set(null);
    this.clearCallState();
  }


  stopCall() {
    console.log('--- GLOBAL STOP CALL ---');
    // Notify the other side
    const otherId = this.callerInfo()?.id;
    if (otherId && this.isCalling()) {
      console.log('Sending REJECT to:', otherId);
      this.send({
        type: 'SIGNAL',
        subtype: 'REJECT',
        senderId: this.currentConnectedUserId,
        receiverId: otherId
      });
    }
    this.isCalling.set(false);
    this.isIncomingCall.set(false);
    this.amIInitiator.set(false);
    this.isMicMuted.set(false);
    this.isSpeakerMuted.set(false);
    this.isVideoMuted.set(false);
    this.stopRingtone();
    this.stopCallTimer();
    this.cleanupWebRTC();
    this.clearCallState();
  }

  // --- Persistence Logic ---

  private saveCallState() {
    const state = {
      isCalling: this.isCalling(),
      callType: this.callType(),
      callerInfo: this.callerInfo(),
      amIInitiator: this.amIInitiator(),
      callDuration: this.callDuration(),
      startTime: Date.now() - (this.callDuration() * 1000),
      isCallExpanded: this.isCallExpandedSignal()
    };
    sessionStorage.setItem('active_call_state', JSON.stringify(state));
  }


  private restoreCallState() {
    const raw = sessionStorage.getItem('active_call_state');
    if (!raw) return;

    try {
      const state = JSON.parse(raw);
      if (state.isCalling) {
        this.isCalling.set(true);
        this.callType.set(state.callType);
        this.callerInfo.set(state.callerInfo);
        this.amIInitiator.set(state.amIInitiator);
        
        // Calculate recovered duration from the original start time
        const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        const recovered = elapsedSeconds > 0 ? elapsedSeconds : 0;
        
        // Start timer WITH the recovered duration (don't reset to 0)
        this.startCallTimer(recovered);

        // Auto-expand for video calls, or restore previous state
        if (state.callType === 'video' || state.isCallExpanded) {
          this.isCallExpandedSignal.set(true);
        }
        
        // Flag to re-establish WebRTC as soon as WS is open
        this.pendingCallSync = true;

        // PRE-WARM: Start camera immediately before WebSocket even connects
        this.prewarmCamera();
      }
    } catch (e) {
      this.clearCallState();
    }
  }

  private async prewarmCamera() {
    if (this.localStream) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.callType() === 'video'
      });
      this.attachVideoElements();
    } catch (err) {
      console.warn('Pre-warm camera failed:', err);
    }
  }


  private reinitCallAfterRefresh() {
    if (this.amIInitiator()) {
      // I'm the initiator, I can start the handshake immediately
      this.initWebRTC(true);
    } else {
      // I'm the receiver, I need to tell the initiator I'm back
      this.send({
        type: 'SIGNAL',
        subtype: 'REJOIN',
        senderId: this.currentConnectedUserId,
        receiverId: this.callerInfo()?.id
      });
    }
    // Re-attach video elements immediately
    this.attachVideoElements();
  }



  setCallExpanded(expanded: boolean) {
    this.isCallExpandedSignal.set(expanded);
    this.saveCallState();
  }


  private clearCallState() {
    sessionStorage.removeItem('active_call_state');
  }


  // --- Media Controls ---
  toggleMicrophone() {
    if (this.localStream) {
      const track = this.localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        this.isMicMuted.set(!track.enabled);
      }
    }
  }

  toggleSpeaker() {
    if (this.remoteAudioElement) {
      this.remoteAudioElement.muted = !this.remoteAudioElement.muted;
      this.isSpeakerMuted.set(this.remoteAudioElement.muted);
      
      const remoteVideo = document.getElementById('globalRemoteVideo') as HTMLVideoElement;
      if (remoteVideo) remoteVideo.muted = this.remoteAudioElement.muted;
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const track = this.localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        this.isVideoMuted.set(!track.enabled);
      }
    }
  }

  /** Called by shell components when the expanded video panel becomes visible */
  attachVideoElements() {
    let attempts = 0;
    const maxAttempts = 30; // Try for 3 seconds
    const checkInterval = setInterval(() => {
      const localVid = document.getElementById('globalLocalVideo') as HTMLVideoElement;
      const remoteVid = document.getElementById('globalRemoteVideo') as HTMLVideoElement;
      
      let foundAll = true;

      if (this.localStream) {
        if (localVid) {
          if (localVid.srcObject !== this.localStream) localVid.srcObject = this.localStream;
        } else {
          foundAll = false;
        }
      }

      if (this.remoteStream) {
        if (remoteVid) {
          if (remoteVid.srcObject !== this.remoteStream) remoteVid.srcObject = this.remoteStream;
        } else {
          foundAll = false;
        }
      }

      attempts++;
      if (foundAll || attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 100);
  }



  // --- WebRTC Logic ---


  private cleanupWebRTC() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = undefined;
    }
    this.remoteStream = undefined;
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = undefined;
    }
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }
  }


  private async initWebRTC(createOffer: boolean) {
    try {
      this.cleanupWebRTC();

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: this.callType() === 'video'
          });
        } else {
          console.warn('getUserMedia non supporté ou contexte non sécurisé.');
        }
      } catch (err) {
        console.warn('Accès microphone refusé/impossible:', err);
      }

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }


      const otherUserId = this.callerInfo()?.id;
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && otherUserId) {
          this.send({
            type: 'SIGNAL', subtype: 'CANDIDATE',
            candidate: event.candidate,
            senderId: this.currentConnectedUserId,
            receiverId: otherUserId
          });
        }
      };

      this.peerConnection.ontrack = (event) => {
        if (event.track.kind === 'audio' && this.remoteAudioElement) {
          this.remoteAudioElement.srcObject = event.streams[0];
        }
        if (event.track.kind === 'video') {
          this.remoteStream = event.streams[0];
          // Try to attach immediately if element exists
          this.attachVideoElements();
        }
      };



      if (createOffer && otherUserId) {
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: this.callType() === 'video'
        });
        await this.peerConnection.setLocalDescription(offer);
        this.send({
          type: 'SIGNAL', subtype: 'OFFER',
          offer: offer,
          senderId: this.currentConnectedUserId,
          receiverId: otherUserId
        });
      }
    } catch (e) {
      console.error('WebRTC init failed:', e);
      this.stopCall();
    }
  }

  private async handleOffer(offer: any, senderId: number) {
    // Always create a fresh connection when receiving an offer
    // This handles renegotiation (e.g. after the other party refreshed)
    await this.initWebRTC(false);
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.send({
        type: 'SIGNAL', subtype: 'ANSWER',
        answer: answer,
        senderId: this.currentConnectedUserId,
        receiverId: senderId
      });
    }
  }

  private async handleAnswer(answer: any) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleCandidate(candidate: any) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }



  private playRingtone() {
    this.ringtone?.play().catch(() => {});
  }

  private stopRingtone() {
    this.ringtone?.pause();
    if (this.ringtone) this.ringtone.currentTime = 0;
  }

  private startCallTimer(initialDuration?: number) {
    if (initialDuration !== undefined) {
      this.callDuration.set(initialDuration);
    } else {
      this.callDuration.set(0);
    }
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    this.callTimerInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.callDuration.update(d => d + 1);
      });
    }, 1000);
  }

  private stopCallTimer() {
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
