import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import { ApiService } from '../core/api.service';
import { 
  LucideAngularModule, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  AlertTriangle 
} from 'lucide-angular';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [NgFor, LucideAngularModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Analyse Prédictive</h2>
        <div class="subtitle">Anticipation de la charge de travail et des tendances RH</div>
      </div>
      <div class="ia-badge">
        <i-lucide [name]="Globe" [size]="18" color="var(--color-primary)"></i-lucide>
        Modèle IA actif
      </div>
    </div>

    <!-- KPI Cards -->
    <section class="grid-cards animate-fade-in">
      <article class="card glass-panel hover-lift" *ngFor="let kpi of kpis">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
          <span class="kpi-label">{{ kpi.label }}</span>
          <i-lucide [name]="kpi.trendUp ? TrendingUp : TrendingDown" [size]="18"
            [style.color]="kpi.trendUp ? 'var(--color-green)' : 'var(--color-red)'"
            style="flex-shrink:0;"></i-lucide>
        </div>
        <p class="value value-sm" [style.color]="kpi.trendUp ? 'var(--color-green)' : 'var(--color-red)'">{{ kpi.value }}</p>
        <div class="muted" style="font-size:12px;margin-top:4px;">{{ kpi.detail }}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:10px;">
          <div class="progress-bar" style="flex:1;">
            <div class="fill" [class]="kpi.barColor" [style.width]="kpi.confidence + '%'"></div>
          </div>
          <span style="font-size:12px;font-weight:600;color:var(--text-muted);">{{ kpi.confidence }}%</span>
        </div>
      </article>
    </section>

    <!-- Charts Row -->
    <div class="grid-2 animate-fade-in" style="margin-bottom: 24px; animation-delay: 0.1s;">
      <section class="card glass-panel hover-lift">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">Prédiction Charge de Travail</h3>
            <div class="muted" style="font-size:13px;margin-top:2px;">Tickets support prévus (4 prochaines semaines)</div>
          </div>
          <i-lucide [name]="Activity" [size]="22" color="var(--color-primary)"></i-lucide>
        </div>
        <div class="chart-container" style="min-height:280px;">
          <canvas #workloadChart></canvas>
        </div>
      </section>

      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">Prédiction Demandes de Congés</h3>
            <div class="muted" style="font-size:13px;margin-top:2px;">Anticipation des périodes de forte demande</div>
          </div>
          <i-lucide [name]="Calendar" [size]="22" color="var(--color-orange)"></i-lucide>
        </div>
        <div class="chart-container" style="min-height:280px;">
          <canvas #leaveChart></canvas>
        </div>
      </section>
    </div>

    <!-- Analysis Sections -->
    <div class="grid-2">
      <section class="card">
        <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:16px;">Analyse des Risques</h3>
        <div class="kpi-row" *ngFor="let r of risks">
          <span style="display:flex;align-items:center;gap:8px;">
            <i-lucide [name]="AlertTriangle" [size]="16" [style.color]="r.color"></i-lucide>
            {{ r.label }}
          </span>
          <span class="chip" [class]="r.chipClass">{{ r.level }}</span>
        </div>
      </section>

      <section class="card">
        <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:16px;">Moteur IA</h3>
        <div class="kpi-row">
          <span>Précision moyenne</span>
          <strong>86.3%</strong>
        </div>
        <div class="kpi-row">
          <span>Dernière mise à jour</span>
          <strong>23 mars 2026</strong>
        </div>
        <div class="kpi-row">
          <span>Prochain entraînement</span>
          <strong>1 avril 2026</strong>
        </div>
      </section>
    </div>
  `
})
export class AnalyticsPageComponent implements OnInit, AfterViewInit {
  @ViewChild('workloadChart') workloadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('leaveChart') leaveRef!: ElementRef<HTMLCanvasElement>;

  protected readonly Globe = Globe;
  protected readonly TrendingUp = TrendingUp;
  protected readonly TrendingDown = TrendingDown;
  protected readonly Activity = Activity;
  protected readonly Calendar = Calendar;
  protected readonly AlertTriangle = AlertTriangle;

  kpis = [
    { label: 'Charge Prévue (7j)', value: '+18%', detail: 'vs semaine courante', trendUp: true, confidence: 87, barColor: 'red' },
    { label: 'Demandes Congés (30j)', value: '+45%', detail: 'Pic estival prévu', trendUp: true, confidence: 92, barColor: 'orange' },
    { label: 'Taux Rétention', value: '94.8%', detail: 'Stable prochain trimestre', trendUp: true, confidence: 78, barColor: 'green' },
    { label: 'Productivité Prévue', value: '-3%', detail: 'Impact congés estivaux', trendUp: false, confidence: 81, barColor: 'red' }
  ];

  risks = [
    { label: 'Charge de travail', level: 'ÉLEVÉ', color: 'var(--color-red)', chipClass: 'chip-red' },
    { label: 'Congés été', level: 'MOYEN', color: 'var(--color-orange)', chipClass: 'chip-orange' },
    { label: 'Turnover', level: 'FAIBLE', color: 'var(--color-green)', chipClass: 'chip-green' }
  ];

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load from API if available
    this.api.getLeavePrediction().subscribe({ 
      next: () => this.cdr.detectChanges(),
      error: () => {} 
    });
    this.api.getWorkloadPrediction().subscribe({ 
      next: () => this.cdr.detectChanges(),
      error: () => {} 
    });
  }

  ngAfterViewInit(): void {
    const checkAndRender = () => {
      if (this.workloadRef?.nativeElement?.offsetWidth > 0) {
        this.createWorkloadChart();
        this.createLeaveChart();
        this.cdr.detectChanges();
      } else {
        requestAnimationFrame(checkAndRender);
      }
    };
    
    setTimeout(() => {
      requestAnimationFrame(checkAndRender);
    }, 200);
  }

  private createWorkloadChart(): void {
    if (!this.workloadRef) return;
    const ctx = this.workloadRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'],
        datasets: [
          {
            label: 'Réel',
            data: [45, 52, 58, 55, 60, 62, null, null, null, null],
            borderColor: '#0061FF',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointBackgroundColor: '#0061FF',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: 0.3,
            spanGaps: false
          },
          {
            label: 'Prédiction',
            data: [null, null, null, null, null, 62, 65, 68, 72, 70],
            borderColor: '#22c55e',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderDash: [8, 4],
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.3,
            spanGaps: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, usePointStyle: true, padding: 20 }
          }
        },
        scales: {
          y: {
            min: 20,
            max: 80,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 12 }, color: '#9ca3af' }
          },
          x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 12 }, color: '#9ca3af' }
          }
        }
      }
    });
  }

  private createLeaveChart(): void {
    if (!this.leaveRef) return;
    const ctx = this.leaveRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0.01)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'],
        datasets: [{
          label: 'Demandes prévues',
          data: [35, 42, 55, 70, 95, 120, 140, 110],
          borderColor: '#f97316',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 160,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 12 }, color: '#9ca3af' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 }, color: '#9ca3af' }
          }
        }
      }
    });
  }
}
