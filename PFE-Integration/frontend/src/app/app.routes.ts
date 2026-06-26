import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page.component';
import { ShellLayoutComponent } from './pages/shell-layout.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { EmployeesPageComponent } from './pages/employees-page.component';
import { LeavesPageComponent } from './pages/leaves-page.component';
import { TicketsPageComponent } from './pages/tickets-page.component';
import { CommunicationPageComponent } from './pages/communication-page.component';
import { BiDashboardPageComponent } from './pages/bi-dashboard-page.component';
import { AnalyticsPageComponent } from './pages/analytics-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { ExtraWorkPageComponent } from './pages/extra-work-page.component';
import { AbsencesPageComponent } from './pages/absences-page.component';
import { AutorisationsPageComponent } from './pages/autorisations-page.component';

// Employee Portal Imports
import { EmployeeShellComponent } from './pages/employee/employee-shell.component';
import { EmpDashboardPageComponent } from './pages/employee/emp-dashboard-page.component';
import { EmpLeavesPageComponent } from './pages/employee/emp-leaves-page.component';
import { EmpTicketsPageComponent } from './pages/employee/emp-tickets-page.component';
import { EmpExtraWorkPageComponent } from './pages/employee/emp-extra-work-page.component';
import { EmpProfilePageComponent } from './pages/employee/emp-profile-page.component';
import { EmpMessagesPageComponent } from './pages/employee/emp-messages-page.component';
import { EmpAnnouncementsPageComponent } from './pages/employee/emp-announcements-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  
  // Manager Portal (Default)
  {
    path: '',
    component: ShellLayoutComponent,
    children: [
      { path: '', component: DashboardPageComponent },
      { path: 'employees', component: EmployeesPageComponent },
      { path: 'autorisations', component: AutorisationsPageComponent },
      { path: 'absences', component: AbsencesPageComponent },
      { path: 'leaves', component: LeavesPageComponent },
      { path: 'tickets', component: TicketsPageComponent },
      { path: 'communication', component: CommunicationPageComponent },
      { path: 'bi-dashboard', component: BiDashboardPageComponent },
      { path: 'analytics', component: AnalyticsPageComponent },
      { path: 'extra-work', component: ExtraWorkPageComponent },
      { path: 'messages', component: EmpMessagesPageComponent },
      { path: 'admin', component: AdminPageComponent }
    ]
  },

  // Employee Portal
  {
    path: 'employee',
    component: EmployeeShellComponent,
    children: [
      { path: '', component: EmpDashboardPageComponent },
      { path: 'announcements', component: EmpAnnouncementsPageComponent },
      { path: 'leaves', component: EmpLeavesPageComponent },
      { path: 'tickets', component: EmpTicketsPageComponent },
      { path: 'extra-work', component: EmpExtraWorkPageComponent },
      { path: 'profile', component: EmpProfilePageComponent },
      { path: 'messages', component: EmpMessagesPageComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
