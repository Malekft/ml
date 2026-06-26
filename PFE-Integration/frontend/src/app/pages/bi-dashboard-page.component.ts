import { Component, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import {
  LucideAngularModule,
  Filter,
  Download,
  TrendingUp,
  TrendingDown
} from 'lucide-angular';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-bi-dashboard-page',
  standalone: true,
  imports: [NgFor, LucideAngularModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Tableaux de Bord BI</h2>
        <div class="subtitle">Analyses avancées et KPI stratégiques</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary">
          <i-lucide [name]="Filter" [size]="18" color="var(--text-main)"></i-lucide>
          Filtres
        </button>
        <button class="btn btn-primary">
          <i-lucide [name]="Download" [size]="18" color="#ffffff"></i-lucide>
          Exporter PDF
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <section class="grid-cards">
      <article class="card" *ngFor="let kpi of kpis">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <span class="kpi-label">{{ kpi.label }}</span>
          <span class="kpi-trend" [class]="kpi.trendUp ? 'up' : 'down'">
            <i-lucide [name]="kpi.trendUp ? TrendingUp : TrendingDown" [size]="14"></i-lucide>
          </span>
        </div>
        <p class="value value-sm">{{ kpi.value }}</p>
        <div class="muted" style="font-size:12px;margin-top:6px;" [style.color]="kpi.trendUp ? 'var(--color-green)' : 'var(--color-red)'">
          {{ kpi.comparison }}
        </div>
      </article>
    </section>

    <!-- Charts Row -->
    <div class="grid-2" style="margin-bottom: 24px;">
      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">Répartition des Congés par Sous-type</h3>
          <a style="color:var(--color-primary);font-size:13px;text-decoration:none;cursor:pointer;font-weight:500;">Détails complets</a>
        </div>
        <div class="chart-container" style="min-height:280px;">
          <canvas #leavesDistributionChart></canvas>
        </div>
      </section>

      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">Répartition par Type de Projet</h3>
          <a style="color:var(--color-primary);font-size:13px;text-decoration:none;cursor:pointer;font-weight:500;">Voir détails</a>
        </div>
        <div class="chart-container" style="min-height:280px;">
          <canvas #projectTypeChart></canvas>
        </div>
      </section>
    </div>

    <!-- Second Charts Row -->
    <div class="grid-2" style="margin-bottom: 24px;">
      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">Tendances Congés & Absences</h3>
          <button style="border:none; background:none; color:var(--color-primary); font-size:13px; font-weight:500; cursor:pointer;">Exporter Excel</button>
        </div>
        <div class="chart-container" style="min-height:280px;">
          <canvas #leavesTrendChart></canvas>
        </div>
      </section>

      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">Performance Support (6 semaines)</h3>
          <button style="border:none; background:none; color:var(--color-primary); font-size:13px; font-weight:500; cursor:pointer;">Voir détails</button>
        </div>
        <div class="chart-container" style="min-height:280px;">
          <canvas #supportPerformanceChart></canvas>
        </div>
      </section>
    </div>

    <!-- Details Table -->
    <section class="card">
      <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:16px;">Détails Projets</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Type Projet</th>
            <th>Volume</th>
            <th>Délai moyen</th>
            <th>Satisfaction</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:600;">Illustration</td>
            <td>58</td>
            <td>4 jours</td>
            <td><span class="chip chip-green">92%</span></td>
          </tr>
          <tr>
            <td style="font-weight:600;">Design 3D</td>
            <td>45</td>
            <td>5 jours</td>
            <td><span class="chip chip-green">90%</span></td>
          </tr>
          <tr>
            <td style="font-weight:600;">Motion Design</td>
            <td>32</td>
            <td>6 jours</td>
            <td><span class="chip chip-orange">87%</span></td>
          </tr>
          <tr>
            <td style="font-weight:600;">Branding</td>
            <td>28</td>
            <td>3 jours</td>
            <td><span class="chip chip-green">95%</span></td>
          </tr>
          <tr>
            <td style="font-weight:600;">Retouche Photo</td>
            <td>22</td>
            <td>2 jours</td>
            <td><span class="chip chip-green">93%</span></td>
          </tr>
        </tbody>
      </table>
    </section>
  `
})
export class BiDashboardPageComponent implements AfterViewInit {
  @ViewChild('leavesDistributionChart') leavesDistributionRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectTypeChart') projectTypeRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('leavesTrendChart') leavesTrendRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('supportPerformanceChart') supportPerformanceRef!: ElementRef<HTMLCanvasElement>;

  protected readonly Filter = Filter;
  protected readonly Download = Download;
  protected readonly TrendingUp = TrendingUp;
  protected readonly TrendingDown = TrendingDown;

  kpis = [
    { label: 'Effectif Total', value: '248', trendUp: true, comparison: '+8% vs mois dernier' },
    { label: 'Taux Support Résolu', value: '88.5%', trendUp: true, comparison: '+5.2% vs semaine dernière' },
    { label: 'Taux d\'Absentéisme', value: '3.8%', trendUp: false, comparison: '+0.5% vs mois dernier' },
    { label: 'Coût Moyen/Employé', value: '4,250€', trendUp: false, comparison: '+3.2% vs trimestre dernier' }
  ];

  constructor(private readonly cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    const checkAndRender = () => {
      if (this.leavesDistributionRef?.nativeElement?.offsetWidth > 0) {
        this.createLeavesDistributionChart();
        this.createProjectTypeChart();
        this.createLeavesTrendChart();
        this.createSupportPerformanceChart();
        this.cdr.detectChanges();
      } else {
        requestAnimationFrame(checkAndRender);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(checkAndRender);
    }, 200);
  }

  private createLeavesDistributionChart(): void {
    if (!this.leavesDistributionRef) return;
    const ctx = this.leavesDistributionRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['CP', 'Maladie (Ord)', 'Longue Durée', 'Décès', 'Mariage', 'Paternité', 'Accompagnement'],
        datasets: [
          {
            label: 'Nombre de jours cumulés',
            data: [120, 45, 85, 12, 21, 14, 32],
            backgroundColor: [
              '#3b82f6', // CP
              '#ef4444', // Maladie
              '#b91c1c', // Longue Durée
              '#f59e0b', // Décès
              '#10b981', // Mariage
              '#8b5cf6', // Paternité
              '#06b6d4'  // Accompagnement
            ],
            borderRadius: 6,
            barThickness: 28
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Total: ${item.formattedValue} jours`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(0,0,0,0.04)' },
            title: { display: true, text: 'Jours cumulés', font: { size: 10 } }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private createProjectTypeChart(): void {
    if (!this.projectTypeRef) return;
    const ctx = this.projectTypeRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Illustration', 'Design 3D', 'Motion Design', 'Branding', 'Retouche Photo'],
        datasets: [{
          data: [58, 45, 32, 28, 22],
          backgroundColor: [
            '#0061FF',
            '#22c55e',
            '#f97316',
            '#ef4444',
            '#8b5cf6'
          ],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 12 },
              usePointStyle: true,
              padding: 16,
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                return (chart.data.labels as string[]).map((label, i) => ({
                  text: `${label} (${(datasets[0].data as number[])[i]})`,
                  fillStyle: (datasets[0].backgroundColor as string[])[i],
                  strokeStyle: (datasets[0].backgroundColor as string[])[i],
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                }));
              }
            }
          }
        }
      }
    });
  }

  private createLeavesTrendChart(): void {
    if (!this.leavesTrendRef) return;
    const ctx = this.leavesTrendRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [
          {
            label: 'Congés',
            data: [12, 19, 15, 25, 22, 30],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'RTT',
            data: [8, 12, 10, 15, 12, 18],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Maladie',
            data: [5, 3, 8, 4, 6, 3],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
        scales: {
          y: { stacked: true, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private createSupportPerformanceChart(): void {
    if (!this.supportPerformanceRef) return;
    const ctx = this.supportPerformanceRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
        datasets: [
          {
            label: 'Tickets Résolus',
            data: [45, 52, 48, 61, 55, 68],
            borderColor: '#10b981',
            borderWidth: 3,
            pointRadius: 4,
            tension: 0.3
          },
          {
            label: 'En Cours',
            data: [12, 15, 10, 8, 14, 9],
            borderColor: '#f59e0b',
            borderWidth: 3,
            pointRadius: 4,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}
