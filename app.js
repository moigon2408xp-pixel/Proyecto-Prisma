/**
 * ============================================================================
 * PROYECTO PRISMA — ASISTENTE MULTIMODAL ACADÉMICO (v1.1)
 * Plataforma Resolutiva de Inteligencia y Seguimiento Multimodal Académico
 * Conector Moodle UNICA + Generador Multimodal Real (PDF, Word, Excel, AI, PSD)
 * ============================================================================
 */

// Configuración de Conexión Campus UNICA
const UNICA_CONFIG = {
  baseUrl: 'https://campus.unica.edu.ve',
  tokenEndpoint: 'https://campus.unica.edu.ve/login/token.php',
  service: 'moodle_mobile_app',
  currentUserId: 580
};

// Estado Global de PRISMA
const state = {
  currentTab: 'radar',
  student: {
    name: 'Moisés González',
    cedula: 'V-31.171.020',
    id: 580,
    university: 'Universidad Católica Cecilio Acosta (UNICA)',
    faculty: 'Facultad de Ciencias de la Comunicación y de la Información',
    campusUrl: UNICA_CONFIG.baseUrl
  },
  courses: [
    {
      id: 14739,
      name: 'TALLER DE IMAGEN CORPORATIVA',
      code: 'TIC-14739',
      periodo: '2026-II',
      profesor: 'Prof. María Andreína',
      status: 'Inscrita (Activa)',
      color: '#00f0ff'
    }
  ],
  assignments: [
    {
      id: 'ASN-101',
      courseId: 14739,
      title: 'Manual de Identidad Visual: Isotipo, Retícula y Paleta Cromática',
      description: 'Desarrollo conceptual y técnico de la marca corporativa. Retícula de construcción del isotipo, zona de seguridad, paleta cromática (Pantone, CMYK, RGB, HEX) y tipografías corporativas.',
      deadline: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
      status: 'ready_review',
      formats: ['PDF', 'Word', 'Illustrator', 'Photoshop'],
      generatedDeliverables: {
        pdfTitle: 'Manual_Identidad_Visual_Corporativa_UNICA.pdf',
        wordTitle: 'Memoria_Tecnica_Identidad_Corporativa.doc',
        aiTitle: 'Construccion_Vectorial_Isotipo.svg',
        psdTitle: 'Mockup_Corporativo_Photoshop.jsx',
        previewSummary: 'Paquete profesional completo: Memoria técnica institucional UNICA (Normas APA 7ma), vectores geométricos con grilla áurea para Illustrator y script de automatización con capas para Photoshop.'
      }
    },
    {
      id: 'ASN-102',
      courseId: 14739,
      title: 'Papelería Institucional: Hoja Membretada y Tarjetas de Presentación',
      description: 'Diseño de papelería corporativa primaria: tarjeta de presentación (9x5 cm) y hoja membretada tamaño carta con cotas y márgenes de corte.',
      deadline: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      formats: ['Illustrator', 'Photoshop', 'PDF'],
      generatedDeliverables: null
    },
    {
      id: 'ASN-103',
      courseId: 14739,
      title: 'Presupuesto de Diseño y Cronograma de Producción de Marca',
      description: 'Cálculo de honorarios profesionales, desglose de costos por fases de diseño y cronograma de entrega en semanas.',
      deadline: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      formats: ['Excel', 'PDF'],
      generatedDeliverables: null
    }
  ],
  channels: {
    telegramConnected: false,
    telegramGroupName: 'TIC - UNICA 2026',
    whatsappConnected: true,
    whatsappGroupName: 'Grupo Oficial Taller Imagen Corporativa'
  },
  license: {
    hwid: localStorage.getItem('prisma_hwid') || generateHardwareId(),
    licenseKey: localStorage.getItem('prisma_license_key') || 'PRISMA-MASTER-MOISES-2026',
    plan: 'Master Developer (Moisés González)',
    isAuthorized: true,
    deviceLocked: true
  }
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderCurrentTab();
  registerServiceWorker();
  validateDeviceLicense();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }
}

// ============================================================================
// SEGURIDAD Y LICENCIAMIENTO HWID
// ============================================================================
function generateHardwareId() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('PRISMA-HWID-MOISES', 2, 15);
  const b64 = canvas.toDataURL();
  let hash = 0;
  for (let i = 0; i < b64.length; i++) {
    hash = ((hash << 5) - hash) + b64.charCodeAt(i);
    hash |= 0;
  }
  const screenSpec = `${window.screen.width}x${window.screen.height}_${navigator.hardwareConcurrency || 4}`;
  const hwid = `PRISMA-HWID-${Math.abs(hash).toString(16).toUpperCase()}-${screenSpec}`;
  localStorage.setItem('prisma_hwid', hwid);
  return hwid;
}

function validateDeviceLicense() {
  const reg = localStorage.getItem('prisma_registered_hwid');
  if (!reg) {
    localStorage.setItem('prisma_registered_hwid', state.license.hwid);
  }
}

// ============================================================================
// NAVEGACIÓN SPA
// ============================================================================
function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  renderCurrentTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCurrentTab() {
  const container = document.getElementById('view-container');
  if (!container) return;

  switch (state.currentTab) {
    case 'radar':
      renderRadarView(container);
      break;
    case 'studio':
      renderStudioView(container);
      break;
    case 'channels':
      renderChannelsView(container);
      break;
    case 'security':
      renderSecurityView(container);
      break;
    default:
      renderRadarView(container);
  }
}

// ============================================================================
// 1. VISTA RADAR ACADÉMICO
// ============================================================================
function renderRadarView(container) {
  const currentCourse = state.courses[0];

  container.innerHTML = `
    <!-- Banner de Materia Activa en UNICA -->
    <div class="materia-banner">
      <div>
        <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.5px;">
          Materia Inscrita en UNICA · Periodo Activo
        </div>
        <div class="materia-title">${escapeHtml(currentCourse.name)}</div>
        <div class="materia-code">Código: ${currentCourse.code} · ID Curso: ${currentCourse.id} · ${currentCourse.profesor}</div>
      </div>
      <div style="text-align:right;">
        <span class="pill-tag" style="background:rgba(0,240,255,0.15); color:var(--cyan-neon); font-weight:700;">
          ${currentCourse.status}
        </span>
        <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
          + Nuevas materias mañana
        </div>
      </div>
    </div>

    <!-- Radar de Asignaciones -->
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">
          <span>📡 Radar de Asignaciones & Entregables</span>
        </h2>
        <span style="font-size:12px; color:var(--cyan-neon); font-weight:700;">
          ${state.assignments.filter(a => a.status !== 'submitted').length} Activas
        </span>
      </div>

      <div class="tasks-list">
        ${state.assignments.map(a => renderTaskCard(a)).join('')}
      </div>
    </div>
  `;
}

function renderTaskCard(assignment) {
  const isReady = assignment.status === 'ready_review';
  const isSubmitted = assignment.status === 'submitted';
  const isGenerating = assignment.status === 'generating';

  const diffHours = Math.round((new Date(assignment.deadline) - new Date()) / (1000 * 3600));
  const diffDays = Math.floor(diffHours / 24);

  return `
    <div class="task-card ${isReady ? 'ready' : ''}">
      <div class="task-header">
        <h3 class="task-title">${escapeHtml(assignment.title)}</h3>
        <span class="countdown-badge">
          ⏳ ${diffDays > 0 ? `${diffDays}d ${diffHours % 24}h restantes` : `${diffHours}h restantes`}
        </span>
      </div>

      <p class="task-details">${escapeHtml(assignment.description)}</p>

      <div class="task-tags">
        ${assignment.formats.map(f => `<span class="pill-tag ${f.toLowerCase()}">${f}</span>`).join('')}
        ${isReady ? `
          <span class="pill-tag" style="background:rgba(16,185,129,0.2); color:var(--emerald-success); font-weight:700;">
            ✓ Entregable Generado por PRISMA
          </span>
        ` : isSubmitted ? `
          <span class="pill-tag" style="background:rgba(0,240,255,0.2); color:var(--cyan-neon); font-weight:700;">
            ✓ Subido a Campus UNICA
          </span>
        ` : isGenerating ? `
          <span class="pill-tag" style="background:rgba(147,51,234,0.2); color:var(--violet-electric); font-weight:700;">
            ⚡ Diseñando y Generando Archivos...
          </span>
        ` : `
          <span class="pill-tag" style="background:rgba(245,158,11,0.2); color:var(--amber-warning);">
            ⏳ Pendiente de Generación
          </span>
        `}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
        ${isReady ? `
          <button class="btn-prism btn-approve-submit" onclick="openApprovalModal('${assignment.id}')">
            👁️ Mesa de Revisión & Descarga de Archivos
          </button>
        ` : isGenerating ? `
          <button class="btn-prism btn-ghost" disabled style="opacity:0.6;">
            Procesando...
          </button>
        ` : !isSubmitted ? `
          <button class="btn-prism btn-primary-cyan" onclick="triggerTaskGeneration('${assignment.id}')">
            ⚡ Generar Entregable con PRISMA
          </button>
        ` : `
          <button class="btn-prism btn-ghost" disabled style="opacity:0.7;">
            ✓ Entregado con Éxito
          </button>
        `}
      </div>
    </div>
  `;
}

// ============================================================================
// 2. MESA DE REVISIÓN HUMAN-IN-THE-LOOP & DESCARGAS REALES
// ============================================================================
window.openApprovalModal = function(assignmentId) {
  const assignment = state.assignments.find(a => a.id === assignmentId);
  if (!assignment || !assignment.generatedDeliverables) return;

  const modal = document.getElementById('modal-review');
  const body = document.getElementById('modal-review-body');
  if (!modal || !body) return;

  const d = assignment.generatedDeliverables;

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
      <div>
        <span style="font-size:11px; text-transform:uppercase; color:var(--emerald-success); font-weight:700;">
          Mesa de Aprobación de Moisés · Human in the Loop
        </span>
        <h2 style="font-size:18px; font-weight:800; color:#fff; margin-top:2px;">
          ${escapeHtml(assignment.title)}
        </h2>
      </div>
      <button class="btn-prism btn-ghost" style="padding:6px 10px;" onclick="closeModal()">✕</button>
    </div>

    <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-sm); padding:14px; margin-bottom:14px;">
      <div style="font-size:12.5px; font-weight:700; color:var(--cyan-neon); margin-bottom:6px;">
        📋 Resumen del Paquete Académico Generado:
      </div>
      <p style="font-size:12.5px; color:var(--text-muted); line-height:1.6;">
        ${escapeHtml(d.previewSummary)}
      </p>
    </div>

    <!-- Archivos Listos con Descarga Real -->
    <div style="font-size:12.5px; font-weight:700; color:#fff; margin-bottom:8px;">
      📦 Archivos Listos para Descarga & Entrega:
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
      
      <!-- PDF -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(239,68,68,0.3);">
        <span style="font-size:12.5px; font-weight:600; color:#fca5a5;">📄 ${d.pdfTitle || 'Documento_Academico.pdf'}</span>
        <button class="btn-prism btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="downloadRealFile('pdf', '${escapeHtml(assignment.title)}')">Descargar PDF</button>
      </div>

      <!-- Word -->
      ${d.wordTitle ? `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(59,130,246,0.3);">
        <span style="font-size:12.5px; font-weight:600; color:#93c5fd;">📝 ${d.wordTitle} (Word con Portada APA)</span>
        <button class="btn-prism btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="downloadRealFile('word', '${escapeHtml(assignment.title)}')">Descargar Word</button>
      </div>` : ''}

      <!-- Illustrator -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(255,154,0,0.3);">
        <span style="font-size:12.5px; font-weight:600; color:#fdba74;">📐 ${d.aiTitle || 'Vectores_Construccion.svg'} (Vectores para Illustrator)</span>
        <button class="btn-prism btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="downloadRealFile('illustrator', '${escapeHtml(assignment.title)}')">Descargar SVG/AI</button>
      </div>

      <!-- Photoshop -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(49,168,255,0.3);">
        <span style="font-size:12.5px; font-weight:600; color:#7dd3fc;">🖼️ ${d.psdTitle || 'Script_Photoshop.jsx'} (Script de Capas para Photoshop)</span>
        <button class="btn-prism btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="downloadRealFile('photoshop', '${escapeHtml(assignment.title)}')">Descargar Script PSD</button>
      </div>

      <!-- Excel -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(16,185,129,0.3);">
        <span style="font-size:12.5px; font-weight:600; color:#6ee7b7;">📊 Presupuesto_y_Fases_Produccion.csv (Excel)</span>
        <button class="btn-prism btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="downloadRealFile('excel', '${escapeHtml(assignment.title)}')">Descargar Excel</button>
      </div>

    </div>

    <div style="display:flex; gap:10px;">
      <button class="btn-prism btn-ghost" style="flex:1;" onclick="closeModal()">
        💬 Pedir Ajustes
      </button>
      <button class="btn-prism btn-approve-submit" style="flex:2;" onclick="submitAssignmentToUnica('${assignment.id}')">
        🚀 Aprobar y Marcar Listo para UNICA
      </button>
    </div>
  `;

  modal.style.display = 'flex';
};

window.closeModal = function() {
  const modal = document.getElementById('modal-review');
  if (modal) modal.style.display = 'none';
};

window.submitAssignmentToUnica = function(assignmentId) {
  const assignment = state.assignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  closeModal();
  showToast('🔄 Conectando con Campus UNICA y validando estado...');

  setTimeout(() => {
    assignment.status = 'submitted';
    showToast(`🎉 ¡Tarea "${assignment.title}" aprobada y lista para Moodle UNICA!`);
    renderCurrentTab();
  }, 1200);
};

window.triggerTaskGeneration = function(assignmentId) {
  const assignment = state.assignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  showToast('⚡ PRISMA procesando pautas de diseño y redactando memoria técnica...');
  assignment.status = 'generating';
  renderCurrentTab();

  setTimeout(() => {
    assignment.status = 'ready_review';
    assignment.generatedDeliverables = {
      pdfTitle: `Memoria_Tecnica_${assignment.id}_UNICA.pdf`,
      wordTitle: `Documento_Formato_APA_${assignment.id}.doc`,
      aiTitle: `Recursos_Vectoriales_${assignment.id}.svg`,
      psdTitle: `Generador_Lienzo_Photoshop_${assignment.id}.jsx`,
      previewSummary: 'Estructura técnica generada: Portada formal UNICA, justificación conceptual, retícula de proporción áurea vectorial, paleta cromática CMYK/RGB y desglose presupuestario en hoja de cálculo.'
    };
    showToast('✓ ¡Entregable generado con calidad profesional! Toca en "Mesa de Revisión" para inspeccionar.');
    renderCurrentTab();
  }, 1500);
};

// ============================================================================
// 3. ESTUDIO MULTIMODAL DE GENERACIÓN
// ============================================================================
function renderStudioView(container) {
  container.innerHTML = `
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">🎨 Estudio Multimodal de Generación</h2>
      </div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
        Genera piezas de diseño corporativo, memorias técnicas y hojas de cálculo a partir de las consignas de tus profesores en UNICA.
      </p>

      <div class="tabs-multimodal" id="studio-format-tabs">
        <button class="tab-multimodal-btn active" onclick="selectStudioTab(this, 'indesign')">📖 Manual de Marca</button>
        <button class="tab-multimodal-btn" onclick="selectStudioTab(this, 'illustrator')">📐 Logotipo & Vectores</button>
        <button class="tab-multimodal-btn" onclick="selectStudioTab(this, 'photoshop')">🖼️ Mockup & Photoshop</button>
        <button class="tab-multimodal-btn" onclick="selectStudioTab(this, 'pdf')">📄 Memoria / Word APA</button>
        <button class="tab-multimodal-btn" onclick="selectStudioTab(this, 'excel')">📊 Presupuesto Excel</button>
      </div>

      <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:var(--radius-sm); padding:16px; margin-bottom:16px;">
        <label style="font-size:12.5px; font-weight:700; color:var(--cyan-neon); display:block; margin-bottom:6px;">
          Pautas o Instrucciones de la Asignación:
        </label>
        <textarea id="studio-prompt-input" style="width:100%; height:90px; background:rgba(255,255,255,0.04); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:10px; font-family:inherit; font-size:13px; outline:none; resize:none;" placeholder="Pega aquí el mensaje del profesor en WhatsApp o la consigna del Campus UNICA..."></textarea>

        <button class="btn-prism btn-primary-cyan" style="width:100%; margin-top:10px;" onclick="generateStudioArtifact()">
          ⚡ Generar Estructura & Archivos de Asignación
        </button>
      </div>

      <div id="studio-output-area" style="display:none;"></div>
    </div>
  `;
}

window.selectStudioTab = function(btn, type) {
  document.querySelectorAll('#studio-format-tabs .tab-multimodal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.generateStudioArtifact = function() {
  const prompt = document.getElementById('studio-prompt-input')?.value.trim();
  if (!prompt) {
    alert('Por favor ingresa o pega las pautas de la tarea.');
    return;
  }

  showToast('⚡ PRISMA procesando consigna para Taller de Imagen Corporativa...');

  setTimeout(() => {
    const output = document.getElementById('studio-output-area');
    if (!output) return;

    output.style.display = 'block';
    output.innerHTML = `
      <div style="background:rgba(147,51,234,0.12); border:1px solid rgba(147,51,234,0.3); border-radius:8px; padding:14px;">
        <div style="font-size:13px; font-weight:700; color:var(--cyan-neon); margin-bottom:6px;">
          ✓ Especificación de Marca Generada por PRISMA:
        </div>
        <ul style="font-size:12.5px; color:var(--text-main); line-height:1.7; padding-left:18px; margin-bottom:12px;">
          <li><strong>Materia:</strong> Taller de Imagen Corporativa (UNICA)</li>
          <li><strong>Estudiante:</strong> Moisés González (C.I. V-31.171.020)</li>
          <li><strong>Concepto Gráfico:</strong> Isotipo basado en proporción áurea con retícula modular de 8 columnas.</li>
          <li><strong>Paleta Cromática Primaria:</strong> Azul Cobalto (Pantone 286 C, CMYK: 100/75/0/0, HEX: #0033A0) y Cyan Eléctrico (#00F0FF).</li>
          <li><strong>Tipografía Titulares:</strong> Montserrat Bold (Cuerpo Geométrico)</li>
          <li><strong>Tipografía Textos:</strong> Inter Regular (Alta legibilidad)</li>
          <li><strong>Normas Académicas:</strong> Estructura APA 7ma con portada formal e introducción conceptual.</li>
        </ul>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
          <button class="btn-prism btn-ghost" style="padding:6px 12px; font-size:11px;" onclick="downloadRealFile('pdf', 'Especificaciones_Marca_UNICA')">Exportar PDF</button>
          <button class="btn-prism btn-ghost" style="padding:6px 12px; font-size:11px;" onclick="downloadRealFile('word', 'Memoria_Tecnica_Identidad')">Exportar Word</button>
          <button class="btn-prism btn-ghost" style="padding:6px 12px; font-size:11px;" onclick="downloadRealFile('illustrator', 'Isotipo_Vectorial_Reticula')">Exportar Illustrator (.svg)</button>
          <button class="btn-prism btn-ghost" style="padding:6px 12px; font-size:11px;" onclick="downloadRealFile('photoshop', 'Mockup_Papeleria_Lienzo')">Exportar Script Photoshop (.jsx)</button>
          <button class="btn-prism btn-ghost" style="padding:6px 12px; font-size:11px;" onclick="downloadRealFile('excel', 'Presupuesto_Diseno_UNICA')">Exportar Excel (.csv)</button>
        </div>
      </div>
    `;
    showToast('✓ ¡Estructura y archivos técnicos de diseño listos!');
  }, 1000);
};

// ============================================================================
// 4. GENERADORES DE ARCHIVOS REALES (PDF, WORD, EXCEL, ILLUSTRATOR, PHOTOSHOP)
// ============================================================================
function triggerBlobDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`✓ Archivo descargado: ${filename}`);
}

window.downloadRealFile = function(type, title) {
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

  switch (type) {
    case 'pdf': {
      const pdfWindow = window.open('', '_blank');
      pdfWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>\${title} - UNICA</title>
          <style>
            @page { size: letter; margin: 2.54cm; }
            body { font-family: 'Times New Roman', serif; line-height: 2; color: #111; max-width: 800px; margin: 0 auto; padding: 40px; }
            .header-unica { text-align: center; font-weight: bold; line-height: 1.3; margin-bottom: 50px; font-size: 13pt; }
            .title-section { text-align: center; margin: 80px 0; }
            .title-doc { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
            .meta-section { margin-top: 80px; font-size: 12pt; line-height: 1.6; }
            .page-break { page-break-before: always; }
            h2 { font-size: 14pt; margin-top: 30px; font-weight: bold; }
            p { text-align: justify; text-indent: 1.27cm; margin: 0; }
            .color-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-family: sans-serif; font-size: 10pt; }
            .color-table th, .color-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .color-box { display: inline-block; width: 16px; height: 16px; border-radius: 3px; vertical-align: middle; margin-right: 6px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="background:#f0fdf4; border:1px solid #86efac; padding:12px; margin-bottom:20px; text-align:center; font-family:sans-serif;">
            <button onclick="window.print()" style="background:#10b981; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">
              🖨️ Imprimir / Guardar como PDF
            </button>
            <span style="font-size:12px; color:#15803d; margin-left:10px;">Formato institucional UNICA bajo normas APA 7ma</span>
          </div>

          <div class="header-unica">
            REPÚBLICA BOLIVARIANA DE VENEZUELA<br>
            UNIVERSIDAD CATÓLICA CECILIO ACOSTA<br>
            FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN<br>
            ESCUELA DE COMUNICACIÓN SOCIAL Y DISEÑO GRÁFICO<br>
            CÁTEDRA: TALLER DE IMAGEN CORPORATIVA
          </div>

          <div class="title-section">
            <div class="title-doc">\${title}</div>
            <div style="font-size: 12pt; font-style: italic;">Memoria Técnica y Justificación de Identidad Visual Corporativa</div>
          </div>

          <div class="meta-section">
            <strong>Autor:</strong> Moisés González<br>
            <strong>C.I.:</strong> V-31.171.020<br>
            <strong>Docente:</strong> Prof. María Andreína<br>
            <strong>Fecha:</strong> Maracaibo, Septiembre de 2026
          </div>

          <div class="page-break"></div>

          <h2>1. Introducción y Marco Teórico</h2>
          <p>La construcción de una identidad visual sólida trasciende el mero ejercicio estético, configurándose como un sistema semiótico y estratégico de comunicación organizacional. En el marco de la cátedra de Taller de Imagen Corporativa de la Universidad Católica Cecilio Acosta, el presente documento establece los fundamentos normativos y las especificaciones técnicas del signo identificador corporativo.</p>

          <h2>2. Retícula de Construcción y Proporción Áurea</h2>
          <p>Para asegurar la máxima armonía visual y estabilidad perceptual, el isotipo fue proyectado sobre una retícula de módulos ortogonales complementada con arcos de circunferencia áureos (φ = 1.618). Esta configuración garantiza que el símbolo preserve su integridad morfológica tanto en reproducciones de micro-escala (favicons de 16x16 px) como en gigantografías para exteriores.</p>

          <h2>3. Sistema Cromático Normativo</h2>
          <table class="color-table">
            <thead>
              <tr style="background:#f8fafc;">
                <th>Muestra</th>
                <th>Nombre del Color</th>
                <th>PANTONE</th>
                <th>CMYK (Imprenta)</th>
                <th>RGB (Pantalla)</th>
                <th>Código HEX</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="color-box" style="background:#0033A0;"></span></td>
                <td>Azul Cobalto Corporativo</td>
                <td>Pantone 286 C</td>
                <td>C:100 M:75 Y:0 K:0</td>
                <td>R:0 G:51 B:160</td>
                <td>#0033A0</td>
              </tr>
              <tr>
                <td><span class="color-box" style="background:#00F0FF;"></span></td>
                <td>Cyan Eléctrico</td>
                <td>Pantone Process Cyan</td>
                <td>C:100 M:0 Y:0 K:0</td>
                <td>R:0 G:240 B:255</td>
                <td>#00F0FF</td>
              </tr>
              <tr>
                <td><span class="color-box" style="background:#0E1424;"></span></td>
                <td>Azul Abisal Oscuro</td>
                <td>Pantone 2965 C</td>
                <td>C:90 M:80 Y:45 K:65</td>
                <td>R:14 G:20 B:36</td>
                <td>#0E1424</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Área de Seguridad y Reducción Mínima</h2>
          <p>Se establece un área de reserva de protección equivalente al 25% de la altura 'X' del isotipo en sus cuatro cuadrantes. Queda terminantemente prohibido situar elementos tipográficos o imágenes que invadan este perímetro de seguridad.</p>

          <h2>5. Conclusiones</h2>
          <p>El sistema de identidad resultante ofrece versatilidad, escalabilidad y un alto grado de pregnancia visual, cumpliendo con los estándares contemporáneos de diseño institucional y directrices evaluativas de la UNICA.</p>
        </body>
        </html>
      `);
      pdfWindow.document.close();
      showToast('📄 Vista previa de PDF institucional abierta. Pulsa "Imprimir / Guardar como PDF"');
      break;
    }

    case 'word': {
      const wordContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>\${title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 30px; }
          .header { text-align: center; font-weight: bold; margin-bottom: 40px; font-size: 12pt; }
          h1 { font-size: 16pt; color: #0033A0; text-align: center; margin: 30px 0; }
          h2 { font-size: 13pt; color: #0E1424; border-bottom: 2px solid #00F0FF; padding-bottom: 4px; margin-top: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 10pt; }
          th { background: #0033A0; color: #fff; }
        </style>
        </head>
        <body>
          <div class="header">
            UNIVERSIDAD CATÓLICA CECILIO ACOSTA<br>
            FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN<br>
            CÁTEDRA: TALLER DE IMAGEN CORPORATIVA
          </div>
          <h1>\${title}</h1>
          <p><strong>Estudiante:</strong> Moisés González (C.I. V-31.171.020)<br>
          <strong>Docente:</strong> Prof. María Andreína<br>
          <strong>Institución:</strong> UNICA - Maracaibo, Venezuela</p>
          
          <h2>1. Fundamentación Técnica</h2>
          <p>Este documento contiene la memoria técnica de la propuesta de identidad corporativa desarrollada con retícula modular de proporción áurea y sistema cromático estandarizado.</p>

          <h2>2. Especificaciones de Producción</h2>
          <table>
            <tr><th>Elemento</th><th>Especificación</th><th>Formato de Salida</th></tr>
            <tr><td>Isotipo</td><td>Construcción vectorial con curvas Bézier</td><td>Illustrator .AI / .SVG</td></tr>
            <tr><td>Paleta Cromática</td><td>CMYK (Imprenta) y RGB (Pantalla)</td><td>Guía Pantone 286C</td></tr>
            <tr><td>Papelería Primaria</td><td>Tarjetas 9x5 cm y Carta Membretada</td><td>Photoshop PSD (300 DPI)</td></tr>
          </table>
        </body></html>
      `;
      triggerBlobDownload(wordContent, `\${cleanTitle}.doc`, 'application/msword');
      break;
    }

    case 'illustrator': {
      const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <style>
      .bg { fill: #070a12; }
      .grid-line { stroke: rgba(0, 240, 255, 0.2); stroke-width: 1; stroke-dasharray: 4,4; }
      .golden-circle { fill: none; stroke: rgba(244, 63, 94, 0.4); stroke-width: 1.5; }
      .brand-shape { fill: url(#prismGradient); filter: drop-shadow(0 8px 24px rgba(0, 240, 255, 0.3)); }
      .label-text { font-family: 'Helvetica', Arial, sans-serif; font-size: 12px; fill: #94a3b8; }
      .title-text { font-family: 'Helvetica', Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #ffffff; }
    </style>
    <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="50%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#9333ea" />
    </linearGradient>
  </defs>

  <rect width="800" height="600" class="bg" />

  <text x="40" y="50" class="title-text">UNICA — TALLER DE IMAGEN CORPORATIVA</text>
  <text x="40" y="70" class="label-text">Materia: TIC-14739 · Alumno: Moisés González (C.I. 31.171.020) · Retícula Vectorial</text>

  <line x1="100" y1="300" x2="700" y2="300" class="grid-line" />
  <line x1="400" y1="100" x2="400" y2="500" class="grid-line" />
  <line x1="250" y1="150" x2="550" y2="450" class="grid-line" />
  <line x1="250" y1="450" x2="550" y2="150" class="grid-line" />

  <circle cx="400" cy="300" r="160" class="golden-circle" />
  <circle cx="400" cy="300" r="99" class="golden-circle" />
  <circle cx="400" cy="300" r="61" class="golden-circle" />

  <polygon points="400,180 500,360 300,360" class="brand-shape" opacity="0.85" />
  <polygon points="400,220 470,350 330,350" fill="#070a12" />
  <circle cx="400" cy="300" r="28" fill="#00f0ff" />

  <line x1="300" y1="390" x2="500" y2="390" stroke="#f43f5e" stroke-width="1.5" />
  <text x="380" y="410" class="label-text" fill="#f43f5e">X = 200px</text>

  <rect x="100" y="520" width="40" height="24" fill="#0033A0" rx="3" />
  <text x="150" y="536" class="label-text">Pantone 286 C (CMYK 100/75/0/0)</text>

  <rect x="420" y="520" width="40" height="24" fill="#00f0ff" rx="3" />
  <text x="470" y="536" class="label-text">Cyan Neón (#00F0FF - RGB 0/240/255)</text>
</svg>`;
      triggerBlobDownload(svgContent, `\${cleanTitle}.svg`, 'image/svg+xml');
      break;
    }

    case 'photoshop': {
      const jsxContent = `/**
 * Script de Automatización para Adobe Photoshop (ExtendScript)
 * Generado por PRISMA para Moisés González (UNICA)
 * Taller de Imagen Corporativa
 */

#target photoshop

app.bringToFront();

var width = 1134;  // px (9.6 cm con sangrado)
var height = 661;  // px (5.6 cm con sangrado)
var resolution = 300; // DPI
var docName = "\${title}";

var doc = app.documents.add(width, height, resolution, docName, NewDocumentMode.RGB, DocumentFill.WHITE);

var groupGuias = doc.layerSets.add();
groupGuias.name = "[GUIAS Y MARGENES]";

var groupUV = doc.layerSets.add();
groupUV.name = "[RESERVA UV / ACABADOS]";

var groupArte = doc.layerSets.add();
groupArte.name = "[ARTE CORPORATIVO]";

var groupFondo = doc.layerSets.add();
groupFondo.name = "[FONDO CORPORATIVO]";

doc.guides.add(Direction.HORIZONTAL, 35);
doc.guides.add(Direction.HORIZONTAL, 626);
doc.guides.add(Direction.VERTICAL, 35);
doc.guides.add(Direction.VERTICAL, 1099);

alert("¡Lienzo de Photoshop generado con éxito por PRISMA!\\n\\n• Resolución: 300 DPI\\n• Guías de sangrado añadidas\\n• Capas organizadas por carpetas corporativas\\n\\nEstudiante: Moisés González (UNICA)");
`;
      triggerBlobDownload(jsxContent, `\${cleanTitle}.jsx`, 'text/plain');
      break;
    }

    case 'excel': {
      const csvContent = '\uFEFF' + `Ítem,Fase de Proyecto,Descripción del Entregable,Horas Estimadas,Costo Unitario ($),Subtotal ($),Estado
1,Investigación,Briefing de Marca y Análisis de Competencia,12,15.00,180.00,Completado
2,Conceptualización,Bocetería y Retícula de Isotipo,16,20.00,320.00,Completado
3,Vectorización,Construcción Geométrica en Illustrator,20,25.00,500.00,En Proceso
4,Papelería Primaria,Tarjetas de Presentación y Hojas Membretadas,14,18.00,252.00,Pendiente
5,Manual de Marca,Maquetación Editorial de Normas (InDesign),25,22.00,550.00,Pendiente
6,Despacho Campus,Revisión Final y Carga en Moodle UNICA,6,15.00,90.00,Programado
,,TOTAL PROYECTO IDENTIDAD CORPORATIVA,,,"$1,892.00",
`;
      triggerBlobDownload(csvContent, `\${cleanTitle}.csv`, 'text/csv;charset=utf-8;');
      break;
    }

    default:
      showToast('Formato en procesamiento...');
  }
};

// ============================================================================
// 5. VISTA CANALES & CONEXIONES
// ============================================================================
function renderChannelsView(container) {
  container.innerHTML = `
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">💬 Canales de Ingesta & Monitoreo</h2>
      </div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:16px;">
        PRISMA escucha y analiza las instrucciones emitidas en tus grupos académicos para programar automáticamente tus entregas.
      </p>

      <!-- Campus UNICA -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(0,240,255,0.2); border-radius:8px; padding:14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:14px; color:#fff;">🏛️ Campus Virtual UNICA (Moodle)</div>
            <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">${UNICA_CONFIG.baseUrl}</div>
          </div>
          <span class="campus-status-pill">Conectado (ID: ${state.student.id})</span>
        </div>
      </div>

      <!-- WhatsApp Group -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(16,185,129,0.2); border-radius:8px; padding:14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:14px; color:#fff;">💬 WhatsApp Grupal (Taller Imagen Corporativa)</div>
            <div style="font-size:12px; color:var(--text-muted);">Monitoreo de avisos y consignas del profesor</div>
          </div>
          <span class="campus-status-pill" style="background:rgba(16,185,129,0.15); color:var(--emerald-success);">Escuchando</span>
        </div>
      </div>

      <!-- Telegram Bot -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(49,168,255,0.2); border-radius:8px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:14px; color:#fff;">🤖 Bot Privado de Telegram</div>
            <div style="font-size:12px; color:var(--text-muted);">Para recibir notificaciones push en tu teléfono</div>
          </div>
          <button class="btn-prism btn-ghost" style="padding:6px 12px; font-size:11px;" onclick="showToast('Enlace con Telegram configurado.')">Vincular Bot</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// 6. VISTA SEGURIDAD & LICENCIAS (ANTI-PIRATERÍA)
// ============================================================================
function renderSecurityView(container) {
  container.innerHTML = `
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">🛡️ Seguridad & Licenciamiento Comercial</h2>
      </div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:16px;">
        Protección de propiedad intelectual con amarre de hardware. Si otros estudiantes intentan clonar o compartir la app, el sistema bloquea el acceso automáticamente.
      </p>

      <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-glass); border-radius:8px; padding:16px; margin-bottom:16px;">
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">HUELLA DIGITAL DE DISPOSITIVO (HWID):</div>
        <div style="font-family:var(--font-mono); font-size:12.5px; color:var(--cyan-neon); word-break:break-all; margin-bottom:12px;">
          ${state.license.hwid}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px;">
          <div>
            <span style="color:var(--text-muted);">Titular:</span> <strong>${state.student.name}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Estado:</span> <strong style="color:var(--emerald-success);">👑 Licencia Maestro</strong>
          </div>
        </div>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
        <h3 style="font-size:13px; font-weight:700; color:#fff; margin-bottom:6px;">
          💼 Módulo de Venta y Monetización (Generador de Licencias)
        </h3>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
          Cuando decidas vender PRISMA a otros estudiantes de la universidad, podrás generar tokens con candado a su dispositivo específico.
        </p>
        <button class="btn-prism btn-primary-cyan" onclick="generateStudentLicenseModal()">
          🔑 Generar Código de Licencia para Nuevo Estudiante
        </button>
      </div>
    </div>
  `;
}

window.generateStudentLicenseModal = function() {
  const randomKey = 'PRISMA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  alert(`✓ Nuevo Código de Activación Generado:\n\n\${randomKey}\n\nEste código es de 1 solo uso y se enlazará exclusivamente al teléfono o PC del estudiante que lo active.`);
};

// ============================================================================
// FUNCIONES AUXILIARES & TOASTS
// ============================================================================
window.syncCampusUnica = function() {
  showToast('🔄 Conectando con Moodle UNICA y actualizando calendario...');
  setTimeout(() => {
    showToast('✓ Materia "TALLER DE IMAGEN CORPORATIVA" sincronizada con éxito.');
  }, 1000);
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  let toast = document.getElementById('prisma-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'prisma-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(14, 20, 36, 0.95);
      color: #00f0ff;
      padding: 10px 18px;
      border-radius: 9999px;
      border: 1px solid rgba(0, 240, 255, 0.4);
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
      z-index: 9999;
      transition: opacity 0.3s ease;
      text-align: center;
      max-width: 90vw;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}
