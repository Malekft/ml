export type Priorite = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';
export type StatutDemande = 'EN_ATTENTE' | 'IN_PROGRESS' | 'RESOLU' | 'FERME' | 'APPROUVEE' | 'REFUSEE' | 'ANNULEE';

export interface EmployeeDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  matricule: string;
  poste: string;
  dateEmbauche: string;
  bureau?: string;
  manager?: string;
  competences?: string[];
  joursRestants: number;
  isOnline?: boolean;
  avatar?: string;
  documents?: DocumentDto[];
}

export interface DocumentDto {
  id: number;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
  validated: boolean;
}

export interface TypeCongeDto {
  id: number;
  nom: string;
  categorie: string;
  estPaye: boolean;
  maxDays: number;
  justificatifObligatoire: boolean;
  delaiDemandeJours: number;
}

export interface SousTypeCongeDto {
  id: number;
  typeCongeId: number;
  nom: string;
  maxJours: number;
}

export interface DemandeDto {
  id: number;
  employeId: number;
  employeNom: string;
  employePrenom?: string;
  statut: StatutDemande;
  dateCreation: string;
  dateTraitement?: string;
  motifRefus?: string;
  type?: 'CONGE' | 'TICKET';
  // Conge specific
  typeCongeId?: number;
  typeCongeNom?: string;
  sousTypeCongeId?: number;
  sousTypeCongeNom?: string;
  dateDebut?: string;
  dateFin?: string;
  dureeJours?: number;
  motif?: string;
  justificatifUrl?: string;
  email?: string;
  avatar?: string;
}

export interface TicketDto {
  id: number;
  employeId: number;
  employeNom: string;
  titre: string;
  description: string;
  categorie: string;
  priorite: Priorite;
  statut: StatutDemande;
  dateCreation: string;
  dateTraitement?: string;
  slaDeadline?: string;
  fileUrl?: string;
  avatar?: string;
  email?: string;
}

export interface AbsenceDto {
  id: number;
  employeId: number;
  dateDebut: string;
  dateFin: string;
  type: string;
  justifiee: boolean;
  dateLimiteJustification?: string;
  statut?: string;
  email?: string;
  avatar?: string;
}

export interface SoldeCongeDto {
  joursAccumules: number;
  joursRestants: number;
  annee: number;
}

export interface CommentDto {
  id?: number;
  author: string;
  avatar?: string;
  email?: string;
  authorId?: number;
  text: string;
  date: string;
  attachment?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  likes?: number;
  liked?: boolean;
  userReaction?: string | null;
  reactions?: any;
  showReactionPicker?: boolean;
  replies?: CommentDto[];
  showReplyInput?: boolean;
  isEditing?: boolean;
  editText?: string;
  tempFile?: any;
  showReplies?: boolean;
  showMoreMenu?: boolean;
}

// Announcement DTO 
export interface AnnouncementDto {
  id: number;
  title: string;
  content: string;
  category: 'INTERNE' | 'EXTERNE';
  status: 'PUBLISHED' | 'SCHEDULED';
  date?: string;
  author?: string;
  avatar?: string;
  email?: string;
  authorId?: number;
  comments?: CommentDto[];
  platforms?: string[];
  userReaction?: string | null;
  reactions?: { total: number; userReaction: string | null; breakdown?: any; namesByType?: any };
  // Frontend UI state
  showComments?: boolean;
  showReactionPicker?: boolean;
  commentText?: string;
  tempFile?: any;
  tempFileObject?: any;
  liked?: boolean;
  likes?: number;
}

export interface AutorisationSortieDto {
  id: number;
  employeId: number;
  employeNom?: string;
  employePrenom?: string;
  heures: number;
  dateAutorisation: string;
  dateSaisie: string;
  email?: string;
  avatar?: string;
}

export interface NotificationDto {
  id: number;
  userId: number;
  demandeId?: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
