import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import { ApiService } from '../core/api.service';
import { 
  LucideAngularModule, 
  Users, 
  Calendar, 
  Ticket, 
  AlertCircle 
} from 'lucide-angular';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

interface DashboardCard {
  label: string;
  value: string;
  icon: any;
  colorClass: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NgFor, LucideAngularModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <div class="subtitle">Vue d'ensemble de la plateforme RH</div>
      </div>
    </div>

    <!-- KPI Cards -->
    <section class="grid-cards">
      <article class="card" *ngFor="let card of statsCards">
        <div class="kpi-card">
          <div class="kpi-icon-circle" [class]="card.colorClass">
            <i-lucide [name]="card.icon" [size]="24"></i-lucide>
          </div>
          <div class="kpi-content">
            <div class="kpi-header">
              <span class="kpi-label">{{ card.label }}</span>
            </div>
            <p class="value value-sm">{{ card.value }}</p>
          </div>
        </div>
      </article>
    </section>

    <!-- Charts Row 1 -->
    <div class="grid-2" style="margin-bottom: 24px;">
      <section class="card">
        <h3 class="chart-title">Absentéisme (6 derniers mois)</h3>
        <div class="chart-container">
          <canvas #absenteeismCanvas></canvas>
        </div>
      </section>

      <section class="card">
        <h3 class="chart-title">Autorisations de Sortie (6 derniers mois)</h3>
        <div class="chart-container">
          <canvas #autorisationsCanvas></canvas>
        </div>
      </section>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid-2" style="margin-bottom: 24px;">
      <section class="card">
        <h3 class="chart-title">Évolution des Tickets (6 derniers mois)</h3>
        <div class="chart-container">
          <canvas #ticketsCanvas></canvas>
        </div>
      </section>

      <section class="card">
        <h3 class="chart-title">Travaux Supplémentaires (6 derniers mois)</h3>
        <div class="chart-container">
          <canvas #travailCanvas></canvas>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .chart-title { font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; }
    .chart-container { min-height: 260px; }
  `]
})
export class DashboardPageComponent implements OnInit, OnDestroy, AfterViewInit {
  // View References
  @ViewChild('absenteeismCanvas') private absenteeismRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('autorisationsCanvas') private autorisationsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ticketsCanvas') private ticketsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('travailCanvas') private travailRef!: ElementRef<HTMLCanvasElement>;

  // Component State
  public statsCards: DashboardCard[] = [
    { label: 'Employés Actifs', value: '...', icon: Users, colorClass: 'green' },
    { label: 'Demandes de Congé', value: '...', icon: Calendar, colorClass: 'blue' },
    { label: 'Tickets Ouverts', value: '...', icon: Ticket, colorClass: 'orange' },
    { label: 'Absences non justifiées', value: '...', icon: AlertCircle, colorClass: 'red' }
  ];

  private chartData: Record<string, Record<string, number>> = {
    absences: {},
    autorisations: {},
    tickets: {},
    travail: {}
  };

  private charts = new Map<string, Chart>();
  private autoRefreshTimer?: any;

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    this.initAutoRefresh();
  }

  ngAfterViewInit(): void {
    this.waitForCanvasReady();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  // --- Data Logic ---

  private initAutoRefresh(): void {
    this.fetchDashboardData();
    this.autoRefreshTimer = setInterval(() => this.fetchDashboardData(), 1000);
  }

  private fetchDashboardData(): void {
    this.api.getDashboardStats().subscribe(stats => {
      if (!stats) return;

      // Update KPI Cards
      this.statsCards[0].value = String(stats.employesActifs || 0);
      this.statsCards[1].value = String(stats.demandesEnAttente || 0);
      this.statsCards[2].value = String(stats.ticketsOuverts || 0);
      this.statsCards[3].value = String(stats.absencesNonJustifiees || 0);
      
      // Update Chart State
      this.chartData['absences'] = stats.absencesParMois || {};
      this.chartData['autorisations'] = stats.autorisationsParMois || {};
      this.chartData['tickets'] = stats.ticketsParMois || {};
      this.chartData['travail'] = stats.travailParMois || {};
      
      this.updateAllCharts();
      this.cdr.detectChanges();
    });
  }

  // --- Chart Logic ---

  private waitForCanvasReady(): void {
    const check = () => {
      const isReady = this.absenteeismRef?.nativeElement?.offsetWidth > 0 && 
                      this.autorisationsRef?.nativeElement?.offsetWidth > 0 &&
                      this.ticketsRef?.nativeElement?.offsetWidth > 0 &&
                      this.travailRef?.nativeElement?.offsetWidth > 0;

      if (isReady) {
        this.renderAllCharts();
        this.cdr.detectChanges();
      } else {
        requestAnimationFrame(check);
      }
    };
    setTimeout(() => requestAnimationFrame(check), 200);
  }

  private renderAllCharts(): void {
    this.createOrUpdateChart('absences', this.absenteeismRef, 'Jours d\'absence', '#0061ff');
    this.createOrUpdateChart('autorisations', this.autorisationsRef, 'Autorisations', '#22c55e');
    this.createOrUpdateChart('tickets', this.ticketsRef, 'Tickets', '#a855f7');
    this.createOrUpdateChart('travail', this.travailRef, 'Travaux Sup.', '#f97316');
  }

  private updateAllCharts(): void {
    ['absences', 'autorisations', 'tickets', 'travail'].forEach(key => this.syncChartData(key));
  }

  private syncChartData(key: string): void {
    const chart = this.charts.get(key);
    if (!chart) return;

    const labels = this.getLastSixMonths();
    chart.data.labels = labels;
    chart.data.datasets[0].data = labels.map(l => this.chartData[key][l] || 0);
    chart.update('none');
  }

  private createOrUpdateChart(key: string, ref: ElementRef<HTMLCanvasElement>, label: string, color: string): void {
    const ctx = ref?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (this.charts.has(key)) {
      this.syncChartData(key);
      return;
    }

    const labels = this.getLastSixMonths();
    const data = labels.map(l => this.chartData[key][l] || 0);
    const gradient = this.createGradient(ctx, color);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 2,
          pointBorderColor: color
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b', font: { size: 12 } } },
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 12 } } }
        }
      }
    };

    this.charts.set(key, new Chart(ctx, config));
  }

  // --- Helpers ---

  private createGradient(ctx: CanvasRenderingContext2D, color: string): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, `${color}26`);
    gradient.addColorStop(1, `${color}03`);
    return gradient;
  }

  private getLastSixMonths(): string[] {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('fr-FR', { month: 'short' }));
    }
    return months;
  }
}
