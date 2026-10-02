<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from "../../servivces/auth.js"  // <-- ajusta a tu ruta

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend, Filler)
dayjs.locale('es')

/* ───────── Configuración ───────── */
const COLLECTION = 'reportes'
const CAMBIOS_COLLECTION = 'cambiosTanque'   // cambios de tanque fuera de horario
const CENTROS_COLLECTION = 'centros'
const GASES = ['Cero', 'Baja', 'Media']
const COLORS = { Cero: '#3d6fb6', Baja: '#7a5cc7', Media: '#1f8a78' }
const MAX_PSI = 2200
const LOW_PSI = 300
const TOL = 50
const GAP_DAYS = 7

const props = defineProps({ centros: { type: Array, default: () => [] } })

/* ───────── Estado ───────── */
const centroList = ref(props.centros)
const centroId = ref('')
const start = ref(dayjs().subtract(90, 'day').format('YYYY-MM-DD'))
const end = ref(dayjs().format('YYYY-MM-DD'))
const loading = ref(false)
const errorMsg = ref('')
const raw = ref([])
const anchor = ref(null)
const cambios = ref([])       // cambiosTanque del periodo (más el hueco antes del primer reporte)
const chartMode = ref('uso')
const feedFilter = ref('all')
const onlyIssues = ref(false)
const sel = ref(null)

const presets = [
  { l: '30 días', d: 30 }, { l: '90 días', d: 90 }, { l: '6 meses', d: 180 }, { l: '1 año', d: 365 }
]
const setPreset = d => {
  start.value = dayjs().subtract(d, 'day').format('YYYY-MM-DD')
  end.value = dayjs().format('YYYY-MM-DD')
}

/* ───────── Carga ───────── */
onMounted(async () => {
  if (centroList.value.length) return
  try {
    const s = await getDocs(collection(db, CENTROS_COLLECTION))
    centroList.value = s.docs
      .map(d => ({ id: d.id, nombre: d.data().ubicacion || d.id }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  } catch (e) { errorMsg.value = 'No se pudieron cargar los centros: ' + e.message }
})

async function load() {
  if (!centroId.value) return
  loading.value = true; errorMsg.value = ''; sel.value = null
  try {
    const s = dayjs(start.value).startOf('day').toISOString()
    const e = dayjs(end.value).endOf('day').toISOString()
    const base = [collection(db, COLLECTION), where('centroId', '==', centroId.value)]
    const snap = await getDocs(query(...base, where('fecha', '>=', s), where('fecha', '<=', e)))
    raw.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.fecha.localeCompare(b.fecha))
    const prev = await getDocs(query(...base, where('fecha', '<', s), orderBy('fecha', 'desc'), limit(1)))
    anchor.value = prev.docs[0] ? { id: prev.docs[0].id, ...prev.docs[0].data() } : null

    // Cambios de tanque fuera de horario: desde el ancla (o el inicio del periodo) hasta el final
    const desde = anchor.value?.fecha ?? s
    const snapCambios = await getDocs(query(
      collection(db, CAMBIOS_COLLECTION), where('centroId', '==', centroId.value),
      where('fecha', '>=', desde), where('fecha', '<=', e)
    ))
    cambios.value = snapCambios.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.fecha.localeCompare(b.fecha))
  } catch (err) {
    errorMsg.value = err.message // si pide índice compuesto, Firebase da el link en este mensaje
    raw.value = []; anchor.value = null; cambios.value = []
  } finally { loading.value = false }
}
watch([centroId, start, end], load)

/* ───────── Motor de validaciones ───────── */
const norm = s => String(s ?? '').trim().toUpperCase()
const num = v => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v)
const tanks = (r, where_, g) =>
  (r?.gases?.[where_]?.[g] || []).map(t => ({
    serie: norm(t.serie), psi: num(t.psi), estatus: t.estatus || '',
    reemplazo: !!t.reemplazo, reemplazoPor: t.reemplazoPor || '', reemplazoFechaHora: t.reemplazoFechaHora || '',
    falloManometro: !!t.falloManometro, numeroReporteFalla: t.numeroReporteFalla || ''
  }))
const worstOf = arr => arr.some(i => i.level === 'error') ? 'error' : arr.some(i => i.level === 'warn') ? 'warn' : 'ok'

// El cambio fuera de horario más reciente de este gas entre dos momentos
function puenteCambio(tipo, desdeTs, hastaTs) {
  let found = null
  cambios.value.forEach(c => {
    if (c.tipo !== tipo) return
    const t = dayjs(c.fecha).valueOf()
    if (t > desdeTs && t <= hastaTs) found = c // cambios.value viene ordenado asc, así que se queda el último
  })
  return found
}

function analyze(list) {
  const out = []
  let prev = null
  list.forEach(r => {
    const ts = dayjs(r.fecha).valueOf()
    const entry = { r, id: r.id, ts, byGas: {}, issues: [] }

    GASES.forEach(g => {
      const cur = { uso: tanks(r, 'uso', g), stock: tanks(r, 'stock', g) }
      const iss = []
      const add = (level, msg, kind) => iss.push({ level, msg, kind, gas: g, ts, id: r.id })
      const actual = cur.uso[0]
      const puente = prev ? puenteCambio(g, prev.ts, ts) : null
      let cambioSerie = false, puenteUsado = false, rate = null

      // Coherencia interna del reporte
      ;[...cur.uso, ...cur.stock].forEach(t => { if (!t.serie) add('warn', 'Tanque sin número de serie') })
      cur.uso.forEach(u => {
        if (u.serie && cur.stock.some(s => s.serie === u.serie)) add('error', `${u.serie} aparece en uso y en stock a la vez`)
        if (!u.falloManometro && u.psi !== null && u.psi <= LOW_PSI && !cur.stock.some(s => s.psi === null || s.psi > LOW_PSI))
          add('error', `${u.serie} con ${u.psi} psi y sin tanque lleno de respaldo`)
      })
      if (!cur.uso.length) add('warn', 'No hay tanque registrado en uso')
      if (actual?.falloManometro && !actual.numeroReporteFalla) add('warn', 'Falla de manómetro sin número de reporte')
      if (actual?.reemplazo && (!actual.reemplazoPor || !actual.reemplazoFechaHora))
        add('warn', 'Reemplazo marcado sin nombre o fecha/hora de quién lo hizo')

      // Continuidad contra el reporte anterior
      const p = prev?.byGas[g]
      if (p && actual) {
        const before = p.uso[0]
        const days = (ts - prev.ts) / 864e5
        const mismaSerie = before && actual.serie === before.serie

        if (mismaSerie) {
          if (actual.reemplazo && !puente) add('warn', `Marcado como reemplazo, pero ${actual.serie} ya estaba en uso`)
          if (!actual.falloManometro && !before.falloManometro && actual.psi !== null && before.psi !== null) {
            if (actual.psi > before.psi + TOL) add('warn', `${actual.serie} subió de ${before.psi} a ${actual.psi} psi sin reemplazo`)
            else if (days > 0 && before.psi - actual.psi > 0) rate = (before.psi - actual.psi) / days
          }
        } else if (actual.serie) {
          cambioSerie = true
          const fromStock = p.stock.find(t => t.serie === actual.serie)
          const quien = actual.reemplazoPor ? ` por ${actual.reemplazoPor}` : ''
          const cuando = actual.reemplazoFechaHora ? ` el ${fmt(actual.reemplazoFechaHora)}` : ''

          if (puente) {
            puenteUsado = true
            add('info', `Reemplazo confirmado (ya se había registrado fuera de horario${puente.realizadoPor ? ' por ' + puente.realizadoPor : ''})`, 'replace')
            if (!actual.reemplazo) add('warn', `Cambió a ${actual.serie} (ya registrado fuera de horario) pero no se marcó "reemplazo" en el reporte`)
          } else if (fromStock) {
            add('info', `Reemplazo: ${actual.serie} pasó de stock a uso${quien}${cuando}`, 'replace')
            if (!actual.reemplazo) add('warn', `Cambió a ${actual.serie} pero no se marcó "reemplazo"`)
            if (fromStock.psi !== null && actual.psi !== null && actual.psi > fromStock.psi + TOL)
              add('warn', `${actual.serie} tiene más psi (${actual.psi}) de los que tenía en stock (${fromStock.psi})`)
          } else if (actual.reemplazo && actual.reemplazoPor && actual.reemplazoFechaHora) {
            add('warn', `Reemplazo${quien}${cuando}, pero ${actual.serie} no aparecía en el stock ni en un cambio registrado`, 'replace')
          } else {
            add('error', `${actual.serie} entró a uso pero no hay registro de dónde vino (ni stock, ni cambio fuera de horario, ni reemplazo marcado)`, 'replace')
          }
        }

        p.uso.forEach(b => {
          if (cur.uso.some(u => u.serie === b.serie)) return
          if (cur.stock.some(s => s.serie === b.serie)) add('warn', `${b.serie} regresó de uso a stock`)
          else if (b.psi !== null && b.psi > LOW_PSI) add('warn', `${b.serie} salió de uso con ${b.psi} psi (no estaba agotado)`)
        })
        p.stock.forEach(b => {
          const still = cur.stock.find(s => s.serie === b.serie)
          const moved = actual?.serie === b.serie
          if (!still && !moved && (b.psi === null || b.psi > 0)) add('warn', `Stock ${b.serie} desapareció sin pasar a uso`)
          if (still && b.psi !== null && still.psi !== null && still.psi > b.psi + TOL)
            add('warn', `Stock ${b.serie} subió de ${b.psi} a ${still.psi} psi`)
        })
        cur.stock.forEach(s => {
          if (s.serie && !p.stock.some(t => t.serie === s.serie) && !p.uso.some(t => t.serie === s.serie))
            add('info', `Nuevo tanque en stock: ${s.serie}`, 'stock')
        })
      }
      entry.byGas[g] = { ...cur, issues: iss, cambioSerie, puenteUsado, rate }
    })

    if (prev) {
      const gap = (ts - prev.ts) / 864e5
      if (gap > GAP_DAYS) entry.issues.push({ level: 'warn', msg: `${Math.round(gap)} días sin reporte`, gas: null, ts, id: r.id })
    }
    entry.all = [...GASES.flatMap(g => entry.byGas[g].issues), ...entry.issues]
    entry.worst = worstOf(entry.all)
    out.push(entry); prev = entry
  })
  return out
}

const analysis = computed(() => {
  const full = analyze(anchor.value ? [anchor.value, ...raw.value] : raw.value)
  return anchor.value ? full.slice(1) : full
})
const last = computed(() => analysis.value.at(-1))

// Eventos de cambiosTanque como entradas propias del feed (aunque aún no los
// confirme un reporte posterior dentro del periodo)
const cambiosFeed = computed(() => cambios.value.map(c => ({
  level: 'info',
  msg: `Cambio fuera de horario: ${c.tipo} → serie ${c.serieNueva}` +
       `${c.realizadoPor ? ' · ' + c.realizadoPor : ' · sin nombre'}` +
       `${c.motivo ? ' · ' + c.motivo : ''}`,
  kind: 'cambio_externo', gas: c.tipo, ts: dayjs(c.fecha).valueOf(), id: c.id
})))

const allIssues = computed(() =>
  [...analysis.value.flatMap(a => a.all), ...cambiosFeed.value].sort((a, b) => b.ts - a.ts)
)
const count = lvl => allIssues.value.filter(i => i.level === lvl).length

// Reemplazos totales = los registrados fuera de horario + los que se
// detectaron/marcaron directo en un reporte sin haber sido pre-registrados
const replacements = computed(() => {
  const fuera = cambios.value.length
  const enReporte = analysis.value.reduce((acc, a) =>
    acc + GASES.filter(g => a.byGas[g].cambioSerie && !a.byGas[g].puenteUsado).length, 0)
  return fuera + enReporte
})

const summary = computed(() => {
  const o = {}
  GASES.forEach(g => {
    const st = last.value?.byGas[g]
    const rates = analysis.value.map(a => a.byGas[g].rate).filter(x => x).slice(-5)
    const rate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null
    const u = st?.uso[0]
    o[g] = {
      tanks: st ? [...st.uso.map(t => ({ ...t, kind: 'uso' })), ...st.stock.map(t => ({ ...t, kind: 'stock' }))] : [],
      rate, daysLeft: rate && u?.psi ? Math.round(u.psi / rate) : null,
      worst: st ? worstOf(st.issues) : 'ok',
      changes: analysis.value.filter(a => a.byGas[g].cambioSerie).length,
      issues: allIssues.value.filter(i => i.gas === g && i.level !== 'info').length
    }
  })
  return o
})

/* ───────── Visuales ───────── */
const fmtPsi = v => v === null || v === undefined ? 'Sin dato' : Number(v).toLocaleString('es-MX') + ' psi'
const fmt = d => dayjs(d).format('DD MMM YYYY, HH:mm')
const lvl = t => t.psi === null ? 0 : Math.max(0, Math.min(1, t.psi / MAX_PSI))
const tankColor = (t, g) => t.psi !== null && t.psi <= LOW_PSI ? '#cf3f3f' : COLORS[g]
const LABEL = { ok: 'Sin incidencias', warn: 'Revisar', error: 'Inconsistente' }

const chartData = computed(() => {
  const lineDatasets = GASES.map(g => ({
    label: g, borderColor: COLORS[g], backgroundColor: COLORS[g], borderWidth: 2.5, tension: 0.25, spanGaps: false,
    data: analysis.value.map(a => {
      const st = a.byGas[g]
      let y = null, s = ''
      if (chartMode.value === 'uso') { y = st.uso[0]?.psi ?? null; s = st.uso[0]?.serie || '' }
      else { const v = st.stock.map(t => t.psi).filter(x => x !== null); y = v.length ? v.reduce((p, c) => p + c, 0) : null; s = st.stock.map(t => t.serie).join(', ') }
      return { x: a.ts, y, s, rep: st.cambioSerie }
    }),
    pointRadius: c => c.raw?.rep ? 8 : 3,
    pointStyle: c => c.raw?.rep ? 'triangle' : 'circle',
    pointBackgroundColor: c => c.raw?.rep ? '#d9982b' : COLORS[g],
    pointBorderColor: '#fff', pointBorderWidth: 1.5
  }))

  // Marcadores de cambios fuera de horario (solo si trajeron psi, si no, solo viven en la bitácora)
  const cambioDatasets = chartMode.value === 'uso' ? GASES.map(g => ({
    label: `${g} · fuera de horario`, showLine: false,
    pointStyle: 'rectRot', pointRadius: 7, pointBackgroundColor: '#b23fb0', pointBorderColor: '#fff', pointBorderWidth: 1.5,
    data: cambios.value.filter(c => c.tipo === g && c.psi !== null && c.psi !== undefined)
      .map(c => ({ x: dayjs(c.fecha).valueOf(), y: c.psi, s: c.serieNueva, autor: c.realizadoPor, motivo: c.motivo }))
  })) : []

  return { datasets: [...lineDatasets, ...cambioDatasets] }
})
const chartOpts = computed(() => ({
  responsive: true, maintainAspectRatio: false, interaction: { mode: 'nearest', intersect: false },
  scales: {
    x: { type: 'linear', grid: { display: false }, ticks: { maxTicksLimit: 8, callback: v => dayjs(v).format('D MMM') } },
    y: { beginAtZero: true, suggestedMax: MAX_PSI, grid: { color: '#e3e9ee' }, title: { display: true, text: 'psi' } }
  },
  plugins: {
    legend: { labels: { usePointStyle: true, boxWidth: 8, filter: item => !item.text.includes('fuera de horario') } },
    tooltip: {
      callbacks: {
        title: i => fmt(i[0].parsed.x),
        label: c => c.raw.autor !== undefined
          ? ` Cambio fuera de horario: ${c.raw.s}${c.raw.autor ? ' · ' + c.raw.autor : ''}${c.raw.motivo ? ' · ' + c.raw.motivo : ''}`
          : ` ${c.dataset.label}: ${c.raw.y ?? 'sin dato'} psi` + (c.raw.s ? `  (${c.raw.s})` : '') + (c.raw.rep ? '  ▲ reemplazo' : '')
      }
    }
  }
}))

const feed = computed(() => allIssues.value
  .filter(i => feedFilter.value === 'all' ? true
    : feedFilter.value === 'replace' ? (i.kind === 'replace' || i.kind === 'cambio_externo')
    : i.level === feedFilter.value)
  .slice(0, 80))
const rows = computed(() => [...analysis.value].reverse().filter(a => !onlyIssues.value || a.worst !== 'ok'))
const centroName = computed(() => centroList.value.find(c => c.id === centroId.value)?.nombre || '')

function exportXlsx() {
  const data = []
  analysis.value.forEach(a => GASES.forEach(g => {
    const st = a.byGas[g]
    ;[...st.uso.map(t => ({ ...t, k: 'Uso' })), ...st.stock.map(t => ({ ...t, k: 'Stock' }))].forEach(t =>
      data.push({
        Fecha: fmt(a.r.fecha), Gas: g, Ubicación: t.k, Serie: t.serie,
        PSI: t.falloManometro ? '' : (t.psi ?? ''),
        'Falla manómetro': t.falloManometro ? 'Sí' : '',
        'Folio falla': t.numeroReporteFalla || '',
        Estatus: t.estatus, Reemplazo: t.reemplazo ? 'Sí' : '',
        'Reemplazo por': t.reemplazoPor || '', 'Reemplazo fecha/hora': t.reemplazoFechaHora ? fmt(t.reemplazoFechaHora) : '',
        Incidencias: st.issues.filter(i => i.level !== 'info').map(i => i.msg).join(' | ')
      }))
  }))
  cambios.value.forEach(c => data.push({
    Fecha: fmt(c.fecha), Gas: c.tipo, Ubicación: 'Cambio fuera de horario', Serie: c.serieNueva,
    PSI: c.psi ?? '', 'Falla manómetro': '', 'Folio falla': '', Estatus: '', Reemplazo: 'Sí',
    'Reemplazo por': c.realizadoPor || '', 'Reemplazo fecha/hora': fmt(c.fecha), Incidencias: c.motivo || ''
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Gases')
  XLSX.writeFile(wb, `historico-gases-${centroName.value || centroId.value}.xlsx`)
}
</script>

<template>
  <div class="gh">
    <!-- Barra de control -->
    <header class="bar">
      <div class="title">
        <h1>Histórico de gases</h1>
        <p>{{ centroName ? centroName : 'Selecciona un centro para revisar la continuidad de sus tanques' }}</p>
      </div>
      <div class="controls">
        <label>Centro
          <select v-model="centroId">
            <option value="" disabled>Elegir…</option>
            <option v-for="c in centroList" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </label>
        <label>Desde <input type="date" v-model="start" :max="end" /></label>
        <label>Hasta <input type="date" v-model="end" :min="start" /></label>
        <div class="presets">
          <button v-for="p in presets" :key="p.d" @click="setPreset(p.d)">{{ p.l }}</button>
        </div>
        <button class="ghost" :disabled="!analysis.length && !cambios.length" @click="exportXlsx">Exportar Excel</button>
      </div>
    </header>

    <p v-if="errorMsg" class="alert">{{ errorMsg }}</p>
    <div v-if="loading" class="empty">Cargando reportes…</div>
    <div v-else-if="!centroId" class="empty">Elige un centro y un periodo para ver el histórico.</div>
    <div v-else-if="!analysis.length" class="empty">Este centro no tiene reportes entre el {{ start }} y el {{ end }}. Amplía el periodo.</div>

    <template v-else>
      <!-- Resumen -->
      <section class="kpis">
        <div><b>{{ analysis.length }}</b><span>reportes en el periodo</span></div>
        <div><b>{{ replacements }}</b><span>reemplazos totales</span></div>
        <div><b>{{ cambios.length }}</b><span>registrados fuera de horario</span></div>
        <div class="k-warn"><b>{{ count('warn') }}</b><span>por revisar</span></div>
        <div class="k-error"><b>{{ count('error') }}</b><span>inconsistencias</span></div>
      </section>

      <!-- Estado actual por gas -->
      <section class="gases">
        <article v-for="g in GASES" :key="g" class="gas" :style="{ '--gc': COLORS[g] }">
          <header>
            <h2>Gas {{ g }}</h2>
            <span class="pill" :class="summary[g].worst">{{ LABEL[summary[g].worst] }}</span>
          </header>
          <p class="asof">Último reporte: {{ fmt(last.r.fecha) }}</p>

          <div class="tanks">
            <p v-if="!summary[g].tanks.length" class="muted">Sin tanques registrados.</p>
            <figure v-for="(t, i) in summary[g].tanks" :key="i" class="tank"
                    :class="[t.kind, { unknown: t.psi === null && !t.falloManometro, falla: t.falloManometro }]">
              <svg viewBox="0 0 64 150" role="img" :aria-label="`${t.serie} ${fmtPsi(t.psi)}`">
                <defs><clipPath :id="`c-${g}-${i}`"><rect x="8" y="30" width="48" height="112" rx="22" /></clipPath></defs>
                <rect x="26" y="6" width="12" height="14" rx="3" class="valve" />
                <rect x="19" y="18" width="26" height="13" rx="4" class="valve" />
                <rect x="8" y="30" width="48" height="112" rx="22" class="shell" />
                <g :clip-path="`url(#c-${g}-${i})`">
                  <rect x="8" width="48" class="fill" :fill="tankColor(t, g)"
                        :style="{ y: 142 - 112 * lvl(t) + 'px', height: 112 * lvl(t) + 'px' }" />
                </g>
                <path d="M17 50 Q14 90 17 128" class="shine" />
                <text v-if="t.psi === null && !t.falloManometro" x="32" y="94" text-anchor="middle" class="q">?</text>
                <text v-if="t.falloManometro" x="32" y="94" text-anchor="middle" class="q warn-q">⚠</text>
              </svg>
              <figcaption>
                <strong v-if="!t.falloManometro">{{ fmtPsi(t.psi) }}</strong>
                <strong v-else class="folio">Folio {{ t.numeroReporteFalla || 's/n' }}</strong>
                <span class="serie">{{ t.serie || 'Sin serie' }}</span>
                <span class="kind">{{ t.kind === 'uso' ? 'En uso' : 'Stock' }}</span>
                <span v-if="t.falloManometro" class="badge badge-warn">Manómetro con falla</span>
                <span v-if="t.reemplazo" class="badge">
                  Reemplazo<template v-if="t.reemplazoPor"> · {{ t.reemplazoPor }}</template>
                </span>
              </figcaption>
            </figure>
          </div>

          <dl class="meta">
            <div><dt>Consumo</dt><dd>{{ summary[g].rate ? '≈ ' + Math.round(summary[g].rate) + ' psi/día' : 'Sin datos' }}</dd></div>
            <div><dt>Se agota en</dt><dd>{{ summary[g].daysLeft !== null ? '≈ ' + summary[g].daysLeft + ' días' : 'Sin datos' }}</dd></div>
            <div><dt>Cambios</dt><dd>{{ summary[g].changes }}</dd></div>
            <div><dt>Incidencias</dt><dd>{{ summary[g].issues }}</dd></div>
          </dl>
        </article>
      </section>

      <!-- Gráfica + bitácora -->
      <section class="split">
        <div class="panel">
          <header class="ph">
            <h2>Nivel de tanques en el tiempo</h2>
            <div class="seg">
              <button :class="{ on: chartMode === 'uso' }" @click="chartMode = 'uso'">En uso</button>
              <button :class="{ on: chartMode === 'stock' }" @click="chartMode = 'stock'">Stock total</button>
            </div>
          </header>
          <div class="chart"><Line :data="chartData" :options="chartOpts" /></div>
          <p class="hint">
            Los triángulos ámbar marcan un cambio de serie confirmado en el reporte.
            Los rombos morados son cambios registrados fuera de horario (solo si traían psi).
          </p>
        </div>

        <div class="panel">
          <header class="ph">
            <h2>Bitácora de eventos</h2>
            <div class="seg">
              <button v-for="f in [['all','Todo'],['replace','Reemplazos'],['warn','Revisar'],['error','Errores']]" :key="f[0]"
                      :class="{ on: feedFilter === f[0] }" @click="feedFilter = f[0]">{{ f[1] }}</button>
            </div>
          </header>
          <ul class="feed">
            <li v-if="!feed.length" class="muted">No hay eventos con este filtro.</li>
            <li v-for="(i, k) in feed" :key="k" :class="i.level" @click="i.kind !== 'cambio_externo' && (sel = analysis.find(a => a.id === i.id))">
              <i :style="{ background: i.gas ? COLORS[i.gas] : '#64768a' }"></i>
              <div>
                <p>{{ i.msg }}</p>
                <small>{{ i.gas ? 'Gas ' + i.gas + ' · ' : '' }}{{ fmt(i.ts) }}{{ i.kind === 'cambio_externo' ? ' · fuera de horario' : '' }}</small>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- Tabla -->
      <section class="panel">
        <header class="ph">
          <h2>Reportes del periodo</h2>
          <label class="chk"><input type="checkbox" v-model="onlyIssues" /> Solo con incidencias</label>
        </header>
        <div class="tw">
          <table>
            <thead><tr><th>Fecha</th><th>Compresor</th><th v-for="g in GASES" :key="g">{{ g }}</th><th>Estado</th></tr></thead>
            <tbody>
              <tr v-for="a in rows" :key="a.id" @click="sel = a" :class="{ active: sel?.id === a.id }">
                <td>{{ fmt(a.r.fecha) }}</td>
                <td>{{ a.r.compresor?.estatus || '—' }}</td>
                <td v-for="g in GASES" :key="g">
                  <span class="dot" :class="worstOf(a.byGas[g].issues)"></span>
                  <template v-if="a.byGas[g].uso[0]?.falloManometro">falla</template>
                  <template v-else>{{ a.byGas[g].uso[0]?.psi ?? '—' }}</template>
                  <em v-if="a.byGas[g].cambioSerie" title="Cambio de tanque">▲</em>
                </td>
                <td><span class="pill" :class="a.worst">{{ LABEL[a.worst] }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Detalle -->
    <aside v-if="sel" class="drawer">
      <header>
        <div><h2>Reporte</h2><p>{{ fmt(sel.r.fecha) }}</p></div>
        <button class="x" @click="sel = null" aria-label="Cerrar">✕</button>
      </header>
      <p class="muted">Compresor: {{ sel.r.compresor?.estatus || '—' }} · Aceite: {{ sel.r.compresor?.nivelAceite ?? '—' }}</p>
      <div v-for="g in GASES" :key="g" class="dg" :style="{ '--gc': COLORS[g] }">
        <h3>{{ g }}</h3>
        <ul>
          <li v-for="(t, i) in [...sel.byGas[g].uso.map(x => ({...x, k:'Uso'})), ...sel.byGas[g].stock.map(x => ({...x, k:'Stock'}))]" :key="i">
            <span>{{ t.k }}</span><b>{{ t.serie || 'Sin serie' }}</b>
            <span v-if="t.falloManometro">Folio {{ t.numeroReporteFalla || 's/n' }}</span>
            <span v-else>{{ fmtPsi(t.psi) }}</span>
          </li>
        </ul>
        <p v-if="sel.byGas[g].uso[0]?.reemplazo" class="muted">
          Reemplazado por {{ sel.byGas[g].uso[0].reemplazoPor || 'sin nombre registrado' }}
          {{ sel.byGas[g].uso[0].reemplazoFechaHora ? ' el ' + fmt(sel.byGas[g].uso[0].reemplazoFechaHora) : ' (sin fecha registrada)' }}
        </p>
        <p v-for="(i, k) in sel.byGas[g].issues" :key="k" class="iss" :class="i.level">{{ i.msg }}</p>
        <a v-if="sel.r.imagenes?.[g.toLowerCase()]" :href="sel.r.imagenes[g.toLowerCase()]" target="_blank" rel="noopener">
          <img :src="sel.r.imagenes[g.toLowerCase()]" :alt="`Evidencia gas ${g}`" loading="lazy" />
        </a>
      </div>
      <p v-for="(i, k) in sel.issues" :key="'r' + k" class="iss" :class="i.level">{{ i.msg }}</p>
    </aside>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap');
.gh {
  --ink: #16232e; --paper: #eaeff2; --panel: #fff; --line: #d5dde3; --muted: #64768a;
  --ok: #2f8f5b; --warn: #d9982b; --err: #cf3f3f;
  font-family: 'Figtree', system-ui, sans-serif; color: var(--ink); background: var(--paper);
  padding: 20px; min-height: 100vh; font-variant-numeric: tabular-nums;
}
h1, h2, h3, p { margin: 0 }
.muted { color: var(--muted); font-size: .88rem }

/* barra */
.bar { background: var(--ink); color: #fff; border-radius: 16px; padding: 20px 24px; display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; align-items: flex-end }
.title h1 { font-size: 1.7rem; font-weight: 800; letter-spacing: -.02em }
.title p { color: #9fb3c4; margin-top: 4px; font-size: .92rem }
.controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end }
.controls label { display: grid; gap: 4px; font-size: .78rem; color: #9fb3c4 }
select, input[type=date] { font: inherit; color: #fff; background: #223444; border: 1px solid #38506a; border-radius: 8px; padding: 8px 10px; min-width: 150px; color-scheme: dark }
.presets { display: flex; gap: 4px }
.presets button, .ghost { font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; border-radius: 8px; padding: 9px 12px; border: 1px solid #38506a; background: transparent; color: #dbe6ef }
.presets button:hover, .ghost:hover:not(:disabled) { background: #2b4157 }
.ghost:disabled { opacity: .4; cursor: not-allowed }
button:focus-visible, select:focus-visible, input:focus-visible, tr:focus-visible { outline: 2px solid #79b8ff; outline-offset: 2px }

.alert { margin: 14px 0; padding: 12px 16px; border-radius: 10px; background: #fbe6e6; color: #8a2020; font-size: .9rem }
.empty { margin: 60px auto; text-align: center; color: var(--muted); max-width: 420px }

/* kpis */
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 16px 0 }
.kpis > div { background: var(--panel); border-radius: 14px; padding: 16px 18px; border: 1px solid var(--line) }
.kpis b { display: block; font-size: 2rem; font-weight: 800; letter-spacing: -.03em }
.kpis span { color: var(--muted); font-size: .86rem }
.k-warn b { color: var(--warn) } .k-error b { color: var(--err) }

/* gases */
.gases { display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 14px }
.gas { background: var(--panel); border-radius: 18px; padding: 18px 20px 16px; border: 1px solid var(--line); border-top: 6px solid var(--gc) }
.gas > header { display: flex; justify-content: space-between; align-items: center }
.gas h2 { font-size: 1.15rem; font-weight: 700; color: var(--gc) }
.asof { font-size: .8rem; color: var(--muted); margin: 2px 0 10px }
.tanks { display: flex; gap: 16px; align-items: flex-end; min-height: 200px; padding: 8px 0 12px; overflow-x: auto }
.tank { margin: 0; text-align: center; flex: 0 0 auto; width: 86px }
.tank.stock { width: 66px; opacity: .92 }
.tank svg { width: 100%; height: auto; overflow: visible }
.shell { fill: #f3f6f8; stroke: #9fb0be; stroke-width: 2 }
.valve { fill: #9fb0be }
.fill { transition: y .7s cubic-bezier(.2, .8, .2, 1), height .7s cubic-bezier(.2, .8, .2, 1); opacity: .9 }
.shine { fill: none; stroke: #fff; stroke-width: 4; stroke-linecap: round; opacity: .55 }
.unknown .shell { stroke-dasharray: 5 4 }
.falla .shell { stroke: #d9982b; stroke-dasharray: 5 4 }
.q { font-size: 30px; font-weight: 800; fill: #9fb0be }
.warn-q { fill: #d9982b; font-size: 26px }
.tank figcaption { display: grid; gap: 1px; margin-top: 6px; font-size: .78rem }
.tank strong { font-size: .86rem }
.tank strong.folio { color: var(--warn) }
.serie { color: var(--muted); word-break: break-all }
.kind { font-weight: 600; color: var(--gc) }
.badge { justify-self: center; background: #fdf0d5; color: #8a5a00; font-weight: 700; padding: 1px 7px; border-radius: 99px; margin-top: 2px }
.badge-warn { background: #fbe1e1; color: #a02323 }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin: 6px 0 0; padding-top: 12px; border-top: 1px solid var(--line) }
.meta dt { font-size: .76rem; color: var(--muted) } .meta dd { margin: 0; font-weight: 700 }

.pill { font-size: .76rem; font-weight: 700; padding: 3px 10px; border-radius: 99px; white-space: nowrap }
.pill.ok { background: #dff3e8; color: #1d6b42 } .pill.warn { background: #fdf0d5; color: #8a5a00 } .pill.error { background: #fbe1e1; color: #a02323 }

/* paneles */
.split { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr); gap: 14px; margin: 14px 0 }
@media (max-width: 900px) { .split { grid-template-columns: 1fr } }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 18px 20px }
.ph { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; margin-bottom: 12px }
.ph h2 { font-size: 1.05rem; font-weight: 700 }
.seg { display: flex; background: var(--paper); border-radius: 9px; padding: 3px }
.seg button { font: inherit; font-size: .8rem; font-weight: 600; border: 0; background: transparent; padding: 5px 10px; border-radius: 7px; cursor: pointer; color: var(--muted) }
.seg button.on { background: var(--ink); color: #fff }
.chart { height: 330px }
.hint { font-size: .8rem; color: var(--muted); margin-top: 8px }
.chk { font-size: .86rem; display: flex; gap: 6px; align-items: center }

.feed { list-style: none; margin: 0; padding: 0; max-height: 360px; overflow: auto; display: grid; gap: 2px }
.feed li { display: flex; gap: 10px; padding: 9px 8px; border-radius: 9px; cursor: pointer; border-left: 3px solid transparent }
.feed li:hover { background: var(--paper) }
.feed li.error { border-left-color: var(--err) } .feed li.warn { border-left-color: var(--warn) } .feed li.info { border-left-color: var(--ok) }
.feed i { width: 9px; height: 9px; border-radius: 50%; margin-top: 6px; flex: 0 0 auto }
.feed p { font-size: .88rem; line-height: 1.35 } .feed small { color: var(--muted) }

.tw { overflow-x: auto }
table { width: 100%; border-collapse: collapse; font-size: .88rem }
th { text-align: left; font-size: .78rem; color: var(--muted); font-weight: 600; padding: 8px 10px; border-bottom: 2px solid var(--line) }
td { padding: 10px; border-bottom: 1px solid var(--line) }
tbody tr { cursor: pointer } tbody tr:hover, tr.active { background: #f2f6f9 }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; background: var(--ok) }
.dot.warn { background: var(--warn) } .dot.error { background: var(--err) }
td em { color: var(--warn); font-style: normal; margin-left: 4px }

/* drawer */
.drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 100%); background: var(--panel); box-shadow: -12px 0 40px rgba(22, 35, 46, .18); padding: 20px; overflow: auto; z-index: 50; animation: slide .25s ease-out }
@keyframes slide { from { transform: translateX(30px); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .drawer { animation: none } .fill { transition: none } }
.drawer > header { display: flex; justify-content: space-between; margin-bottom: 8px }
.x { border: 0; background: var(--paper); border-radius: 8px; width: 34px; height: 34px; cursor: pointer }
.dg { margin-top: 16px; padding-left: 12px; border-left: 4px solid var(--gc) }
.dg h3 { color: var(--gc); font-size: 1rem }
.dg ul { list-style: none; padding: 0; margin: 6px 0; display: grid; gap: 4px; font-size: .86rem }
.dg li { display: grid; grid-template-columns: 50px 1fr auto; gap: 8px }
.iss { font-size: .82rem; padding: 6px 8px; border-radius: 7px; margin-top: 4px }
.iss.error { background: #fbe1e1; color: #a02323 } .iss.warn { background: #fdf0d5; color: #8a5a00 } .iss.info { background: #dff3e8; color: #1d6b42 }
.dg img { width: 100%; border-radius: 10px; margin-top: 8px; display: block }
</style>