import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DemandeDto, EmployeeDto, TicketDto,
  AbsenceDto,
  TypeCongeDto, SousTypeCongeDto,
  StatutDemande,
  AnnouncementDto,
  AutorisationSortieDto,
  NotificationDto
} from './api.types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8081/api';

  constructor(private readonly http: HttpClient) { }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/auth/login`, { email, password });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  verifyCode(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/verify-code`, { email, code });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/reset-password`, { email, code, newPassword });
  }

  // --- Employees ---
  getEmployees(): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(`${this.baseUrl}/employes`);
  }

  getEmployee(id: number): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.baseUrl}/employes/${id}`);
  }

  createAbsence(body: Partial<AbsenceDto>): Observable<AbsenceDto> {
    return this.http.post<AbsenceDto>(`${this.baseUrl}/absences`, body);
  }




  updateEmployee(id: number, body: any): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.baseUrl}/employes/${id}`, body);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employes/${id}`);
  }

  getDemands(): Observable<DemandeDto[]> {
    return this.http.get<DemandeDto[]>(`${this.baseUrl}/demandes`);
  }

  getAbsences(): Observable<AbsenceDto[]> {
    return this.http.get<AbsenceDto[]>(`${this.baseUrl}/absences`);
  }

  getAbsencesByEmployee(id: number): Observable<AbsenceDto[]> {
    return this.http.get<AbsenceDto[]>(`${this.baseUrl}/absences/employe/${id}`);
  }

  getEmployeeAbsences(id: number): Observable<AbsenceDto[]> {
    return this.getAbsencesByEmployee(id);
  }

  justifyAbsence(id: number, justificatifUrl: string): Observable<AbsenceDto> {
    return this.http.put<AbsenceDto>(`${this.baseUrl}/absences/${id}/justify`, { justificatifUrl });
  }

  validateAbsence(id: number, approved: boolean): Observable<AbsenceDto> {
    return this.http.put<AbsenceDto>(`${this.baseUrl}/absences/${id}/validate`, { approved });
  }

  getEmployeeLeaves(id: number): Observable<DemandeDto[]> {
    return this.http.get<DemandeDto[]>(`${this.baseUrl}/conges/employe/${id}`);
  }

  getEmployeeSolde(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/conges/solde/${id}`);
  }

  getLeaveTypes(): Observable<TypeCongeDto[]> {
    return this.http.get<TypeCongeDto[]>(`${this.baseUrl}/conges/types`);
  }

  getSousTypes(typeCongeId: number): Observable<SousTypeCongeDto[]> {
    return this.http.get<SousTypeCongeDto[]>(`${this.baseUrl}/conges/types/${typeCongeId}/sous-types`);
  }

  createDemand(body: Partial<DemandeDto>): Observable<DemandeDto> {
    return this.http.post<DemandeDto>(`${this.baseUrl}/demandes`, body);
  }

  approveDemand(id: number, adminId: number): Observable<DemandeDto> {
    return this.http.put<DemandeDto>(`${this.baseUrl}/demandes/${id}/approve`, { adminEmployeId: adminId });
  }

  rejectDemand(id: number, adminId: number, motif: string): Observable<DemandeDto> {
    return this.http.put<DemandeDto>(`${this.baseUrl}/demandes/${id}/reject`, { adminEmployeId: adminId, motif });
  }

  cancelDemand(id: number, employeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/demandes/${id}?employeId=${employeId}`);
  }

  // --- Autorisations ---
  getAutorisations(employeId?: number): Observable<AutorisationSortieDto[]> {
    if (employeId) {
      return this.http.get<AutorisationSortieDto[]>(`${this.baseUrl}/autorisations/employe/${employeId}`);
    }
    return this.http.get<AutorisationSortieDto[]>(`${this.baseUrl}/autorisations`);
  }

  createAutorisation(body: Partial<AutorisationSortieDto>): Observable<AutorisationSortieDto> {
    return this.http.post<AutorisationSortieDto>(`${this.baseUrl}/autorisations`, body);
  }

  // --- Tickets ---
  getTickets(): Observable<TicketDto[]> {
    return this.http.get<TicketDto[]>(`${this.baseUrl}/tickets`);
  }

  getEmployeeTickets(id: number): Observable<TicketDto[]> {
    return this.http.get<TicketDto[]>(`${this.baseUrl}/tickets/employe/${id}`);
  }

  createTicket(body: Partial<TicketDto>): Observable<TicketDto> {
    return this.http.post<TicketDto>(`${this.baseUrl}/tickets`, body);
  }

  updateTicketStatus(id: number, status: StatutDemande): Observable<TicketDto> {
    return this.http.put<TicketDto>(`${this.baseUrl}/tickets/${id}/status`, { statut: status });
  }

  // --- Analytics ---
  getKpis(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/analytics/kpis`);
  }

  getLeavePrediction(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/analytics/leave-prediction`);
  }

  getWorkloadPrediction(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/analytics/workload-prediction`);
  }

  // --- Admin ---
  getAdminStats(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/admin/stats`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/stats`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/users`);
  }

  getManagers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/managers`);
  }

  createUser(body: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/users`, body);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/users/${id}`);
  }

  updateUserRole(id: number, role: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/admin/users/${id}/role`, { role });
  }

  addDocument(body: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/documents`, body);
  }

  uploadFile(file: File): Observable<{ url: string; name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; name: string }>(`${this.baseUrl}/files/upload`, formData);
  }

  // --- Announcements ---
  getAnnouncements(userId?: number): Observable<AnnouncementDto[]> {
    const url = userId ? `${this.baseUrl}/announcements?userId=${userId}` : `${this.baseUrl}/announcements`;
    return this.http.get<AnnouncementDto[]>(url);
  }

  createAnnouncement(body: {
    title: string;
    content: string;
    category: 'INTERNE' | 'EXTERNE';
    status: 'PUBLISHED' | 'SCHEDULED';
    scheduledDate?: string;
    platforms?: string[];
  }, authorId?: number): Observable<AnnouncementDto> {
    const url = authorId ? `${this.baseUrl}/announcements?authorId=${authorId}` : `${this.baseUrl}/announcements`;
    return this.http.post<AnnouncementDto>(url, body);
  }

  likeAnnouncement(id: number, userId: number, type: string = 'LIKE'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/announcements/${id}/like?userId=${userId}&type=${type}`, {});
  }

  addAnnouncementComment(id: number, userId: number, content: string, fileName?: string, fileUrl?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/announcements/${id}/comment?userId=${userId}`, { content, fileName, fileUrl });
  }


  getAnnouncementStats(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/announcements/stats`);
  }

  getAdminRoles(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.baseUrl}/admin/roles`);
  }

  getAdminSettings(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.baseUrl}/admin/settings`);
  }

  // --- Travail Supplémentaire ---
  getAllExtraWork(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/travail-supp`);
  }

  getEmployeeExtraWork(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/travail-supp/employe/${id}`);
  }

  createExtraWork(body: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/travail-supp`, body);
  }

  updateExtraWorkStatus(id: number, status: StatutDemande): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/travail-supp/${id}/status`, { statut: status });
  }

  getConversation(user1: number, user2: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/messages/${user1}/${user2}`);
  }

  markAsRead(receiverId: number, senderId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/messages/read/${receiverId}/${senderId}`, {});
  }

  getUnreadCount(receiverId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/messages/unread/${receiverId}`);
  }

  getChatUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/chat`);
  }

  getFullUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/api') ? path.substring(4) : path;
    return this.baseUrl + (cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath);
  }

  toggleCommentLike(commentId: number, userId: number, type: string = 'LIKE'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/announcements/comments/${commentId}/like?userId=${userId}&type=${type}`, {});
  }

  addCommentReply(commentId: number, userId: number, content: string, fileName?: string, fileUrl?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/announcements/comments/${commentId}/reply?userId=${userId}`, { content, fileName, fileUrl });
  }

  updateComment(commentId: number, userId: number, content: string, fileName?: string, fileUrl?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/announcements/comments/${commentId}?userId=${userId}`, { content, fileName, fileUrl });
  }

  deleteComment(commentId: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/announcements/comments/${commentId}?userId=${userId}`);
  }

  getDownloadUrl(path?: string | null): string {
    if (!path) return '';
    return this.baseUrl + path + '?download=true';
  }

  // --- Notifications ---
  getNotifications(userId: number): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${this.baseUrl}/notifications/user/${userId}`);
  }

  getUnreadNotificationsCount(userId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/notifications/user/${userId}/unread-count`);
  }

  markNotificationAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/user/${userId}/read-all`, {});
  }

  getAvatarColor(identifier?: string | null): string {
    if (!identifier) return 'avatar-bg-1';
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = (identifier.charCodeAt(i) + ((hash << 5) - hash)) | 0; // Coerce to 32-bit int
    }
    const index = Math.abs(hash % 10) + 1;
    return `avatar-bg-${index}`;
  }

  // --- Change Password ---
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/change-password`, { currentPassword, newPassword });
  }
}
