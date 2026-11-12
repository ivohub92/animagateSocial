import { DecimalPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { forkJoin } from 'rxjs';
import { mensajeDeError } from '../../core/auth.service';
import {
  ComentariosPorDia,
  ComentariosPorPublicacion,
  EstadisticasService,
  Lapso,
  PublicacionesPorUsuario,
} from '../../core/estadisticas.service';
import { DashboardTabs } from '../../shared/dashboard-tabs/dashboard-tabs';
import { NombreCompletoPipe } from '../../shared/pipes/nombre-completo.pipe';
import { PluralPipe } from '../../shared/pipes/plural.pipe';

// Solo se registran las piezas de Chart.js que se usan (el bundle queda más liviano).
Chart.register(
  BarController, BarElement, LineController, LineElement, PointElement, DoughnutController,
  ArcElement, CategoryScale, LinearScale, Tooltip, Filler,
);

/**
 * Colores de los gráficos, validados para el fondo oscuro (banda de luminosidad, contraste 3:1 y
 * separación para daltonismo). Las categorías van siempre en este orden; "Otras" es gris neutro.
 */
const COLORES = ['#00a3b5', '#ff2a85', '#8b5cf6', '#c98500', '#199e70'];
const GRIS_OTRAS = '#475569';
const TEXTO = '#94a3b8';
const GRILLA = '#1e293b';
const SUPERFICIE = '#16192b';
const MAX_BARRAS = 15;
const MAX_PORCIONES = 5;

type Atajo = 7 | 30 | 90 | 'personalizado';

/** "YYYY-MM-DD" de una fecha en la hora local. */
const aDia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Medianoche local de un "YYYY-MM-DD", desplazada n días. */
const medianoche = (dia: string, masDias = 0) => {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d + masDias);
};

/** Página dashboard/estadisticas (Sprint 4, solo administradores): tres gráficos de distinto tipo. */
@Component({
  selector: 'app-dashboard-estadisticas',
  imports: [DecimalPipe, DashboardTabs, NombreCompletoPipe, PluralPipe],
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.scss',
})
export class DashboardEstadisticas implements OnInit, OnDestroy {
  private readonly servicio = inject(EstadisticasService);

  // ---- Lapso (un solo filtro para los tres gráficos, así los números siempre coinciden) ----
  protected readonly hoy = aDia(new Date());
  protected readonly atajos: { valor: Atajo; texto: string }[] = [
    { valor: 7, texto: 'Últimos 7 días' },
    { valor: 30, texto: 'Últimos 30 días' },
    { valor: 90, texto: 'Últimos 90 días' },
    { valor: 'personalizado', texto: 'Personalizado' },
  ];
  protected readonly atajo = signal<Atajo>(30);
  protected readonly desde = signal(aDia(medianoche(this.hoy, -29)));
  protected readonly hasta = signal(this.hoy);
  protected readonly errorLapso = computed(() =>
    this.desde() > this.hasta() ? 'La fecha "desde" no puede ser posterior a "hasta".' : null,
  );

  // ---- Datos ----
  protected readonly publicaciones = signal<PublicacionesPorUsuario | null>(null);
  protected readonly comentarios = signal<ComentariosPorDia | null>(null);
  protected readonly porPublicacion = signal<ComentariosPorPublicacion | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly promedioDiario = computed(() => {
    const c = this.comentarios();
    return c && c.dias.length ? c.total / c.dias.length : 0;
  });
  /** Porciones de la torta: las 5 publicaciones con más comentarios y el resto en "Otras". */
  protected readonly porciones = computed(() => {
    const datos = this.porPublicacion();
    if (!datos) return [];
    const principales = datos.items.slice(0, MAX_PORCIONES).map((i, n) => ({
      etiqueta: i.publicacion.titulo,
      detalle: i.publicacion.autor ? `@${i.publicacion.autor}` : '',
      cantidad: i.cantidad,
      color: COLORES[n],
    }));
    const resto = datos.items.slice(MAX_PORCIONES);
    if (resto.length) {
      principales.push({
        etiqueta: `Otras (${resto.length})`,
        detalle: '',
        cantidad: resto.reduce((s, i) => s + i.cantidad, 0),
        color: GRIS_OTRAS,
      });
    }
    return principales.map((p) => ({ ...p, porcentaje: datos.total ? (p.cantidad / datos.total) * 100 : 0 }));
  });

  // ---- Gráficos ----
  private readonly lienzoBarras = viewChild<ElementRef<HTMLCanvasElement>>('barras');
  private readonly lienzoLinea = viewChild<ElementRef<HTMLCanvasElement>>('linea');
  private readonly lienzoTorta = viewChild<ElementRef<HTMLCanvasElement>>('torta');
  private graficos: Chart[] = [];

  constructor() {
    Chart.defaults.color = TEXTO;
    Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
    // Cuando llegan datos nuevos se redibujan los tres gráficos. afterRenderEffect corre DESPUÉS
    // de actualizar el DOM: así los contenedores ya no están ocultos y tienen su tamaño real
    // (con un effect común, Chart.js medía un contenedor todavía oculto, de tamaño 0).
    afterRenderEffect(() => {
      const [p, c, t] = [this.publicaciones(), this.comentarios(), this.porciones()];
      const [b, l, r] = [this.lienzoBarras(), this.lienzoLinea(), this.lienzoTorta()];
      if (!p || !c || !b || !l || !r) return;
      this.dibujar(p, c, t, b.nativeElement, l.nativeElement, r.nativeElement);
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.graficos.forEach((g) => g.destroy());
  }

  protected elegirAtajo(valor: Atajo): void {
    this.atajo.set(valor);
    if (valor === 'personalizado') return; // se eligen las fechas a mano y se toca "Aplicar"
    this.hasta.set(this.hoy);
    this.desde.set(aDia(medianoche(this.hoy, -(valor - 1))));
    this.cargar();
  }

  protected cambiarFecha(campo: 'desde' | 'hasta', evento: Event): void {
    (campo === 'desde' ? this.desde : this.hasta).set((evento.target as HTMLInputElement).value);
  }

  /** Pide las tres estadísticas a la vez para el lapso elegido (hasta incluido: se manda el día siguiente). */
  protected cargar(): void {
    if (this.errorLapso()) return;
    const lapso: Lapso = {
      desde: medianoche(this.desde()).toISOString(),
      hasta: medianoche(this.hasta(), 1).toISOString(),
      zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      publicaciones: this.servicio.publicacionesPorUsuario(lapso),
      comentarios: this.servicio.comentariosPorDia(lapso),
      porPublicacion: this.servicio.comentariosPorPublicacion(lapso),
    }).subscribe({
      next: (r) => {
        this.publicaciones.set(r.publicaciones);
        this.comentarios.set(r.comentarios);
        this.porPublicacion.set(r.porPublicacion);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected fechaCorta(dia: string): string {
    const [, m, d] = dia.split('-');
    return `${Number(d)}/${Number(m)}`;
  }

  private dibujar(
    p: PublicacionesPorUsuario,
    c: ComentariosPorDia,
    porciones: { etiqueta: string; cantidad: number; color: string }[],
    barras: HTMLCanvasElement,
    linea: HTMLCanvasElement,
    torta: HTMLCanvasElement,
  ): void {
    this.graficos.forEach((g) => g.destroy());
    const ejes = {
      grid: { color: GRILLA, drawTicks: false },
      border: { display: false },
      ticks: { padding: 8 },
    };
    const tooltip = {
      backgroundColor: SUPERFICIE,
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#cbd5e1',
      padding: 10,
      displayColors: false,
    };

    // 1) Barras horizontales: publicaciones por usuario, de mayor a menor, un solo color.
    const filas = p.items.slice(0, MAX_BARRAS);
    barras.parentElement!.style.height = `${Math.max(160, filas.length * 36 + 40)}px`;
    const configBarras: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: filas.map((i) => `@${i.usuario.nombreUsuario}`),
        datasets: [{
          data: filas.map((i) => i.cantidad),
          backgroundColor: COLORES[0],
          hoverBackgroundColor: '#13b8cb',
          borderRadius: { topRight: 4, bottomRight: 4 },
          borderSkipped: 'start',
          maxBarThickness: 24,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          x: { ...ejes, beginAtZero: true, ticks: { ...ejes.ticks, precision: 0 } },
          y: { ...ejes, grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltip,
            callbacks: {
              title: (items) => {
                const u = filas[items[0].dataIndex].usuario;
                return `${u.nombre} ${u.apellido} · @${u.nombreUsuario}`;
              },
              label: (item) => `${item.parsed.x} ${item.parsed.x === 1 ? 'publicación' : 'publicaciones'}`,
            },
          },
        },
      },
    };

    // 2) Línea: comentarios por día (los días sin comentarios valen 0).
    const configLinea: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: c.dias.map((d) => this.fechaCorta(d.fecha)),
        datasets: [{
          data: c.dias.map((d) => d.cantidad),
          borderColor: COLORES[1],
          borderWidth: 2,
          backgroundColor: 'rgba(255, 42, 133, 0.1)',
          fill: true,
          tension: 0, // recta: entre un día y otro no hay datos que inventar
          pointRadius: c.dias.length > 40 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: COLORES[1],
          pointBorderColor: SUPERFICIE,
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ...ejes, grid: { display: false }, ticks: { ...ejes.ticks, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
          y: { ...ejes, beginAtZero: true, ticks: { ...ejes.ticks, precision: 0 } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltip,
            callbacks: {
              title: (items) => c.dias[items[0].dataIndex].fecha.split('-').reverse().join('/'),
              label: (item) => `${item.parsed.y} ${item.parsed.y === 1 ? 'comentario' : 'comentarios'}`,
            },
          },
        },
      },
    };

    // 3) Torta (dona): comentarios por publicación, las 5 con más y el resto en "Otras".
    const configTorta: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: porciones.map((x) => x.etiqueta),
        datasets: [{
          data: porciones.map((x) => x.cantidad),
          backgroundColor: porciones.map((x) => x.color),
          borderColor: SUPERFICIE, // separación de 2px entre porciones
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: { duration: 300 },
        plugins: {
          legend: { display: false }, // la leyenda es HTML, con cantidades y porcentajes
          tooltip: {
            ...tooltip,
            callbacks: {
              label: (item) => {
                const total = porciones.reduce((s, x) => s + x.cantidad, 0);
                const valor = item.parsed as number;
                return `${valor} ${valor === 1 ? 'comentario' : 'comentarios'} · ${Math.round((valor / total) * 100)}%`;
              },
            },
          },
        },
      },
    };

    this.graficos = [
      new Chart(barras, configBarras),
      new Chart(linea, configLinea),
      new Chart(torta, configTorta),
    ];
  }
}
