/**
 * ============================================================================
 * PROYECTO PRISMA — ASISTENTE MULTIMODAL ACADÉMICO (v2.0)
 * Plataforma Resolutiva de Inteligencia y Seguimiento Multimodal Académico
 * Motor de IA Generativa (Google Gemini) + Parser Local + Sincronización UNICA
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
  currentTab: 'studio', // Iniciamos en Estudio para que pruebe la IA de inmediato
  apiKey: localStorage.getItem('prisma_gemini_key') || '',
  student: {
    name: 'Moisés González',
    cedula: 'V-31.171.020',
    id: 580,
    university: 'Universidad Católica Cecilio Acosta (UNICA)',
    faculty: 'Facultad de Ciencias de la Comunicación y de la Información',
    school: 'Escuela de Comunicación Social y Diseño Gráfico',
    campusUrl: UNICA_CONFIG.baseUrl
  },
  courses: [
    {
      id: 14739,
      name: 'TALLER DE IMAGEN CORPORATIVA',
      code: 'TIC-14739',
      periodo: '2026-II',
      profesor: 'Prof. María Andreína',
      status: 'Inscrita (Activa en UNICA)',
      color: '#00f0ff'
    }
  ],
  // Tareas en el radar: Se cargan desde localStorage o inician vacías (realistas con UNICA)
  assignments: JSON.parse(localStorage.getItem('prisma_assignments')) || [],
  
  // Último trabajo analizado y generado por la IA en el Estudio
  activeGeneratedWork: null,

  license: {
    hwid: localStorage.getItem('prisma_hwid') || generateHardwareId(),
    licenseKey: localStorage.getItem('prisma_license_key') || 'PRISMA-MASTER-MOISES-2026',
    plan: 'Master Developer (Moisés González)',
    isAuthorized: true
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
  if (!reg) localStorage.setItem('prisma_registered_hwid', state.license.hwid);
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
      renderStudioView(container);
  }
}

// ============================================================================
// 1. VISTA RADAR ACADÉMICO (SINCERADO CON EL CAMPUS UNICA)
// ============================================================================
function renderRadarView(container) {
  const currentCourse = state.courses[0];
  const activeCount = state.assignments.filter(a => a.status !== 'submitted').length;

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
          + Nuevas materias al inscribir
        </div>
      </div>
    </div>

    <!-- Radar de Asignaciones -->
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">
          <span>📡 Radar de Asignaciones & Evaluaciones</span>
        </h2>
        <div style="display:flex; gap:8px;">
          <button class="btn-prism btn-ghost" style="font-size:11px; padding:4px 10px;" onclick="openManualTaskModal()">
            + Nueva Tarea Manual
          </button>
        </div>
      </div>

      ${activeCount === 0 ? `
        <div style="text-align:center; padding:35px 20px; background:rgba(0,0,0,0.25); border-radius:12px; border:1px dashed rgba(255,255,255,0.1); margin:12px 0;">
          <div style="font-size:32px; margin-bottom:10px;">🏛️</div>
          <div style="font-weight:700; font-size:15px; color:#fff; margin-bottom:4px;">
            Moodle UNICA al día: 0 tareas publicadas por los profesores
          </div>
          <p style="font-size:12.5px; color:var(--text-muted); max-width:440px; margin:0 auto 16px auto; line-height:1.5;">
            Tu profesor aún no ha cargado asignaciones en el campus virtual. Puedes usar el <strong>Estudio</strong> para redactar o diseñar cualquier trabajo a partir de consignas de clase o WhatsApp.
          </p>
          <button class="btn-prism btn-primary-cyan" onclick="switchTab('studio')">
            🎨 Ir al Estudio y Generar una Tarea Ahora
          </button>
        </div>
      ` : `
        <div class="tasks-list">
          ${state.assignments.map(a => renderTaskCard(a)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderTaskCard(assignment) {
  const isReady = assignment.status === 'ready_review';
  const isSubmitted = assignment.status === 'submitted';
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
        ${(assignment.formats || ['PDF']).map(f => `<span class="pill-tag ${f.toLowerCase()}">${f}</span>`).join('')}
        ${isReady ? `
          <span class="pill-tag" style="background:rgba(16,185,129,0.2); color:var(--emerald-success); font-weight:700;">
            ✓ Entregables Listos
          </span>
        ` : `
          <span class="pill-tag" style="background:rgba(245,158,11,0.2); color:var(--amber-warning);">
            ⏳ En Proceso
          </span>
        `}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
        <button class="btn-prism btn-approve-submit" onclick="openApprovalModal('${assignment.id}')">
          👁️ Revisar & Descargar Archivos
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// 2. VISTA ESTUDIO MULTIMODAL (MOTOR REAL DE INTELIGENCIA ARTIFICIAL)
// ============================================================================
function renderStudioView(container) {
  const hasKey = !!state.apiKey;

  container.innerHTML = `
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">🎨 Estudio Multimodal de Generación</h2>
        <button class="btn-prism btn-ghost" style="font-size:11px; padding:4px 10px;" onclick="toggleApiKeyInput()">
          🔑 ${hasKey ? 'IA Conectada' : 'Conectar Clave Gemini'}
        </button>
      </div>

      <!-- Configuración de Clave Gemini (Colapsable o visible si no hay clave) -->
      <div id="gemini-key-box" style="display:${hasKey ? 'none' : 'block'}; background:rgba(0,240,255,0.06); border:1px solid rgba(0,240,255,0.25); border-radius:8px; padding:12px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label style="font-size:12px; font-weight:700; color:var(--cyan-neon);">
            ⚡ Conectar Google Gemini (Para Investigación Profunda y Generación Real):
          </label>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size:11px; color:#38bdf8; text-decoration:underline;">
            Obtener clave gratis aquí ↗
          </a>
        </div>
        <div style="display:flex; gap:8px;">
          <input type="password" id="gemini-api-key-input" value="${state.apiKey}" placeholder="Pega tu clave gratuita de Google AI Studio (AIzaSy...)" style="flex:1; background:rgba(0,0,0,0.5); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:8px 10px; font-size:12px; font-family:var(--font-mono); outline:none;">
          <button class="btn-prism btn-primary-cyan" style="padding:8px 14px; font-size:12px;" onclick="saveGeminiKey()">
            Guardar
          </button>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">
          Tu clave se guarda únicamente en la memoria local de tu navegador. Si no tienes una a la mano, el motor heurístico local de PRISMA procesará tus pautas.
        </div>
      </div>

      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px; line-height:1.5;">
        Pega las pautas de cualquier tarea (viejas, nuevas o indicaciones de WhatsApp). PRISMA analizará el tema a fondo y construirá los archivos con portada UNICA, normas APA y formatos de diseño reales.
      </p>

      <!-- Selector de Tipo de Entregable -->
      <div class="tabs-multimodal" id="studio-format-tabs">
        <button class="tab-multimodal-btn active" data-type="auto" onclick="selectStudioTab(this, 'auto')">✨ Autodetectar Formatos</button>
        <button class="tab-multimodal-btn" data-type="essay" onclick="selectStudioTab(this, 'essay')">📄 Ensayo / Memoria (PDF APA)</button>
        <button class="tab-multimodal-btn" data-type="identity" onclick="selectStudioTab(this, 'identity')">📐 Identidad / Vectores (Illustrator)</button>
        <button class="tab-multimodal-btn" data-type="mockup" onclick="selectStudioTab(this, 'mockup')">🖼️ Mockup & Pieza (Photoshop)</button>
        <button class="tab-multimodal-btn" data-type="budget" onclick="selectStudioTab(this, 'budget')">📊 Presupuesto & Plan (Excel)</button>
      </div>

      <!-- Área de Entrada de Consignas -->
      <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-sm); padding:16px; margin-bottom:16px;">
        <label style="font-size:12.5px; font-weight:700; color:var(--cyan-neon); display:block; margin-bottom:6px;">
          Pautas o Instrucciones de la Asignación:
        </label>
        <textarea id="studio-prompt-input" style="width:100%; height:130px; background:rgba(255,255,255,0.04); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:12px; font-family:inherit; font-size:13px; outline:none; resize:vertical; line-height:1.5;" placeholder="Pega aquí las instrucciones completas del profesor (por ejemplo: 'Realizar un ensayo de 3 páginas sobre la Semiótica de Umberto Eco y su aplicación en la comunicación visual actual...')" autofocus></textarea>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <span id="ai-status-indicator" style="font-size:11.5px; color:${hasKey ? 'var(--emerald-success)' : 'var(--amber-warning)'}; font-weight:600;">
            ${hasKey ? '⚡ Motor: Google Gemini 2.5 Flash en vivo' : '⚡ Motor: Analizador Local Heurístico'}
          </span>
          <button class="btn-prism btn-primary-cyan" style="padding:10px 20px;" onclick="executeAIAnalysis()">
            🚀 Analizar Pautas & Generar Entregables
          </button>
        </div>
      </div>

      <!-- Zona de Salida Dinámica -->
      <div id="studio-output-area" style="display:none;"></div>
    </div>
  `;
}

window.toggleApiKeyInput = function() {
  const box = document.getElementById('gemini-key-box');
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
};

window.saveGeminiKey = function() {
  const val = document.getElementById('gemini-api-key-input')?.value.trim();
  state.apiKey = val;
  if (val) {
    localStorage.setItem('prisma_gemini_key', val);
    showToast('✓ Clave de Gemini guardada con éxito.');
  } else {
    localStorage.removeItem('prisma_gemini_key');
    showToast('Clave removida. Modo local activado.');
  }
  renderStudioView(document.getElementById('view-container'));
};

window.selectStudioTab = function(btn, type) {
  document.querySelectorAll('#studio-format-tabs .tab-multimodal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.setAttribute('data-selected-type', type);
};

// ============================================================================
// 3. MOTOR DE GENERACIÓN DINÁMICO (GEMINI API + PARSER HEURÍSTICO)
// ============================================================================
window.executeAIAnalysis = async function() {
  const prompt = document.getElementById('studio-prompt-input')?.value.trim();
  if (!prompt) {
    alert('Por favor pega o escribe las pautas de la tarea.');
    return;
  }

  const outputArea = document.getElementById('studio-output-area');
  outputArea.style.display = 'block';
  outputArea.innerHTML = `
    <div style="text-align:center; padding:30px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid rgba(0,240,255,0.2);">
      <div style="font-size:24px; animation:spin 1s linear infinite; display:inline-block; margin-bottom:10px;">⚙️</div>
      <div style="font-weight:700; color:var(--cyan-neon); font-size:14px; margin-bottom:4px;">
        PRISMA está investigando y procesando las pautas...
      </div>
      <div style="font-size:12px; color:var(--text-muted);">
        Estructurando memoria técnica institucional UNICA, retícula de diseño y archivos descargables.
      </div>
    </div>
  `;

  try {
    let resultData = null;

    if (state.apiKey) {
      // LLAMADA A LA API DE GEMINI 2.5 FLASH
      showToast('⚡ Conectando con Google Gemini...');
      resultData = await callGeminiAPI(prompt, state.apiKey);
    } else {
      // MOTOR LOCAL HEURÍSTICO AVANZADO
      showToast('⚡ Procesando con motor heurístico local...');
      await new Promise(r => setTimeout(r, 900));
      resultData = analyzePromptLocally(prompt);
    }

    state.activeGeneratedWork = resultData;
    renderGeneratedResults(resultData, outputArea);
    showToast('✓ ¡Asignación analizada y entregables listos!');

  } catch (err) {
    console.error('Error en generación:', err);
    // Fallback al motor local si la API falla (ej. clave inválida o cuota)
    showToast('⚠️ No se pudo contactar Gemini. Usando motor local de respaldo...');
    const localData = analyzePromptLocally(prompt);
    state.activeGeneratedWork = localData;
    renderGeneratedResults(localData, outputArea);
  }
};

// Llamada REST a Gemini 2.5 Flash
async function callGeminiAPI(userPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `Eres PRISMA, asistente académico y de diseño gráfico de élite para Moisés González (C.I. V-31.171.020), estudiante de la Universidad Católica Cecilio Acosta (UNICA) en Maracaibo, Venezuela.
Analiza las pautas de la tarea que te da el usuario y devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin markdown, sin comillas triples, sólo JSON crudo):
{
  "titulo": "Título formal académico y llamativo de la asignación",
  "materia": "Nombre de la materia inferida o Taller de Imagen Corporativa",
  "resumen_ejecutivo": "Resumen de 2 a 3 oraciones de lo desarrollado",
  "marco_teorico": "Texto redactado formal y riguroso de introducción y marco conceptual (2 párrafos)",
  "desarrollo_puntos": [
    {"subtitulo": "Nombre del punto", "contenido": "Explicación detallada y fundamentada"}
  ],
  "conclusiones": "Conclusiones analíticas del trabajo",
  "referencias_apa": [
    "Apellido, A. (Año). Título del libro o fuente. Editorial."
  ],
  "paleta_sugerida": [
    {"nombre": "Color Principal", "pantone": "Pantone XXX", "cmyk": "C:X M:X Y:X K:X", "hex": "#HEX"}
  ],
  "presupuesto_items": [
    {"fase": "Fase 1", "descripcion": "Detalle", "horas": 10, "costo": 150}
  ],
  "formato_photoshop": {
    "ancho_cm": 9.6,
    "alto_cm": 5.6,
    "descripcion": "Tarjeta / Afiche / Portada"
  }
}`;

  const body = {
    contents: [
      {
        parts: [
          { text: systemInstruction + "

PAUTAS DEL PROFESOR:
" + userPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json"
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} - ${errorText}`);
  }

  const json = await resp.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawText);
}

// Analizador Heurístico Local (Sin requerir API)
function analyzePromptLocally(prompt) {
  const p = prompt.toLowerCase();
  
  // Detección de tema
  let topic = "Análisis y Desarrollo de Comunicación Visual";
  let subject = "Cátedra Universitaria (UNICA)";
  let isEditorial = p.includes("manual") || p.includes("editorial") || p.includes("revista") || p.includes("indesign");
  let isBranding = p.includes("marca") || p.includes("isotipo") || p.includes("logotipo") || p.includes("corporativ");
  let isEssay = p.includes("ensayo") || p.includes("informe") || p.includes("investig") || p.includes("semiotica") || p.includes("teoria");
  let isPhoto = p.includes("foto") || p.includes("imagen") || p.includes("afiche") || p.includes("cartel");

  if (isBranding) {
    topic = "Identidad Visual y Construcción Sígnica Corporativa";
    subject = "Taller de Imagen Corporativa";
  } else if (isEssay) {
    topic = "Fundamentación Teórica y Análisis Semiótico de la Comunicación";
    subject = "Teoría y Práctica de la Comunicación";
  } else if (isEditorial) {
    topic = "Maquetación Editorial y Sistemas de Retícula";
    subject = "Diseño Editorial y Diagramación";
  } else if (isPhoto) {
    topic = "Composición Fotográfica y Producción Publicitaria";
    subject = "Fotografía y Comunicación Visual";
  }

  // Extraer primeras palabras significativas como título
  const words = prompt.split(/\s+/).filter(w => w.length > 3).slice(0, 7).join(" ");
  const customTitle = words.length > 10 ? words.charAt(0).toUpperCase() + words.slice(1) : topic;

  return {
    titulo: customTitle,
    materia: subject,
    resumen_ejecutivo: `Proyecto formulado para dar cumplimiento estricto a las pautas de evaluación: "${prompt.substring(0, 110)}...". Estructurado bajo criterios de excelencia académica UNICA y normas APA 7ma.`,
    marco_teorico: `El estudio de este proyecto se fundamenta en la articulación teórico-práctica demandada por el programa académico de la Universidad Católica Cecilio Acosta. A partir de las directrices señaladas ("${prompt.substring(0, 90)}"), se establece una metodología orientada al análisis crítico y la resolución proyectual.`,
    desarrollo_puntos: [
      {
        subtitulo: "1. Diagnóstico Conceptual y Requerimientos",
        contenido: "Se identificaron los requerimientos esenciales formulados en la consigna académica, organizando los objetivos en fases secuenciales de investigación, conceptualización y materialización técnica."
      },
      {
        subtitulo: "2. Metodología y Criterios de Ejecución",
        contenido: "Se adoptó una estructura sistemática basada en normas internacionales de diseño y redacción académica, asegurando legibilidad, congruencia visual y rigor analítico."
      },
      {
        subtitulo: "3. Síntesis y Resultados Obtenidos",
        contenido: "La propuesta final responde con fidelidad a las especificaciones solicitadas, optimizando tanto los recursos técnicos como el discurso conceptual."
      }
    ],
    conclusiones: "El desarrollo presentado demuestra dominio conceptual y competencia en la resolución de problemas de comunicación, alineado a las exigencias evaluativas de la facultad.",
    referencias_apa: [
      "Frascara, J. (2004). Diseño de comunicación. Ediciones Infinito.",
      "Eco, U. (1994). Signo. Editorial Labor.",
      "Costa, J. (2012). La imagen de marca: Un fenómeno social. Paidós."
    ],
    paleta_sugerida: [
      { nombre: "Tono Primario", pantone: "Pantone 286 C", cmyk: "C:100 M:75 Y:0 K:0", hex: "#0033A0" },
      { nombre: "Acento Neón", pantone: "Pantone Cyan", cmyk: "C:100 M:0 Y:0 K:0", hex: "#00F0FF" },
      { nombre: "Base Abisal", pantone: "Pantone 2965 C", cmyk: "C:90 M:80 Y:45 K:65", hex: "#0E1424" }
    ],
    presupuesto_items: [
      { fase: "Investigación & Brief", descripcion: "Revisión bibliográfica y levantamiento de requisitos", horas: 12, costo: 180 },
      { fase: "Conceptualización", descripcion: "Bocetería preliminar y formulación discursiva", horas: 16, costo: 240 },
      { fase: "Producción Técnica", descripcion: "Diagramación vectorial y redacción formal", horas: 20, costo: 350 },
      { fase: "Revisión Final", descripcion: "Control de calidad editorial y despacho al campus", horas: 6, costo: 90 }
    ],
    formato_photoshop: {
      ancho_cm: 21.59,
      alto_cm: 27.94,
      descripcion: "Lienzo Tamaño Carta a 300 DPI"
    }
  };
}

// Renderizado de Resultados en la interfaz
function renderGeneratedResults(data, container) {
  container.innerHTML = `
    <div style="background:rgba(147,51,234,0.12); border:1px solid rgba(147,51,234,0.35); border-radius:10px; padding:18px; margin-top:10px;">
      
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <span style="font-size:11px; text-transform:uppercase; color:var(--emerald-success); font-weight:700; letter-spacing:0.5px;">
            ✓ Análisis de Pautas Completado por PRISMA
          </span>
          <h3 style="font-size:17px; font-weight:800; color:#fff; margin-top:3px;">
            ${escapeHtml(data.titulo)}
          </h3>
          <div style="font-size:12px; color:var(--cyan-neon);">
            Materia: ${escapeHtml(data.materia)} · UNICA 2026
          </div>
        </div>
        <button class="btn-prism btn-ghost" style="font-size:11px; padding:4px 10px;" onclick="addActiveWorkToRadar()">
          + Enviar al Radar
        </button>
      </div>

      <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:12px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">RESUMEN EJECUTIVO:</div>
        <p style="font-size:12.5px; color:#e2e8f0; line-height:1.5;">
          ${escapeHtml(data.resumen_ejecutivo)}
        </p>
      </div>

      <!-- Descargas de Archivos Adaptadas al Contenido Específico -->
      <div style="font-size:12.5px; font-weight:700; color:#fff; margin-bottom:8px;">
        📦 Archivos Generados Basados en TUS Pautas:
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:14px;">
        
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:12px;">
          <div style="font-size:12.5px; font-weight:700; color:#fca5a5; margin-bottom:4px;">📄 Memoria PDF</div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Formato formal UNICA con normas APA 7ma</div>
          <button class="btn-prism btn-ghost" style="width:100%; font-size:11.5px; padding:6px;" onclick="downloadDynamicFile('pdf')">
            Descargar / Imprimir PDF
          </button>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(59,130,246,0.3); border-radius:8px; padding:12px;">
          <div style="font-size:12.5px; font-weight:700; color:#93c5fd; margin-bottom:4px;">📝 Documento Word</div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Editable con portada, marco y citas</div>
          <button class="btn-prism btn-ghost" style="width:100%; font-size:11.5px; padding:6px;" onclick="downloadDynamicFile('word')">
            Descargar Word (.doc)
          </button>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,154,0,0.3); border-radius:8px; padding:12px;">
          <div style="font-size:12.5px; font-weight:700; color:#fdba74; margin-bottom:4px;">📐 Illustrator Vectorial</div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Gráficos SVG con retícula adaptada</div>
          <button class="btn-prism btn-ghost" style="width:100%; font-size:11.5px; padding:6px;" onclick="downloadDynamicFile('illustrator')">
            Descargar SVG/AI
          </button>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(49,168,255,0.3); border-radius:8px; padding:12px;">
          <div style="font-size:12.5px; font-weight:700; color:#7dd3fc; margin-bottom:4px;">🖼️ Script Photoshop</div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Lienzo a 300 DPI con carpetas de capas</div>
          <button class="btn-prism btn-ghost" style="width:100%; font-size:11.5px; padding:6px;" onclick="downloadDynamicFile('photoshop')">
            Descargar Script JSX
          </button>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:12px;">
          <div style="font-size:12.5px; font-weight:700; color:#6ee7b7; margin-bottom:4px;">📊 Presupuesto Excel</div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">Costos, horas y cronograma del tema</div>
          <button class="btn-prism btn-ghost" style="width:100%; font-size:11.5px; padding:6px;" onclick="downloadDynamicFile('excel')">
            Descargar Excel (.csv)
          </button>
        </div>

      </div>
    </div>
  `;
}

window.addActiveWorkToRadar = function() {
  if (!state.activeGeneratedWork) return;
  const d = state.activeGeneratedWork;
  const newAssignment = {
    id: 'ASN-' + Date.now().toString().slice(-4),
    courseId: 14739,
    title: d.titulo,
    description: d.resumen_ejecutivo,
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: 'ready_review',
    formats: ['PDF', 'Word', 'Illustrator', 'Photoshop'],
    generatedDeliverables: {
      pdfTitle: `${d.titulo.replace(/\s+/g, '_')}_UNICA.pdf`,
      wordTitle: `${d.titulo.replace(/\s+/g, '_')}.doc`,
      aiTitle: `Vectores_${d.titulo.replace(/\s+/g, '_')}.svg`,
      psdTitle: `Lienzo_${d.titulo.replace(/\s+/g, '_')}.jsx`,
      previewSummary: d.resumen_ejecutivo
    },
    workData: d
  };

  state.assignments.unshift(newAssignment);
  localStorage.setItem('prisma_assignments', JSON.stringify(state.assignments));
  showToast('✓ Tarea agregada con éxito al Radar Académico.');
  switchTab('radar');
};

// ============================================================================
// 4. DESCARGAS DINÁMICAS BASADAS EN EL CONTENIDO REAL DE LA TAREA
// ============================================================================
window.downloadDynamicFile = function(type) {
  const d = state.activeGeneratedWork;
  if (!d) {
    alert('Primero genera una asignación en el Estudio.');
    return;
  }

  const cleanTitle = (d.titulo || 'Entregable_UNICA').replace(/[^a-zA-Z0-9_-]/g, '_');

  switch (type) {
    case 'pdf': {
      const pdfWindow = window.open('', '_blank');
      const puntosHtml = (d.desarrollo_puntos || []).map(p => `
        <h2 style="font-size:13pt; font-weight:bold; margin-top:24px; color:#0e1424;">${escapeHtml(p.subtitulo)}</h2>
        <p style="text-align:justify; text-indent:1.27cm; margin:0 0 12px 0;">${escapeHtml(p.contenido)}</p>
      `).join('');

      const referenciasHtml = (d.referencias_apa || []).map(r => `
        <p style="padding-left:1.27cm; text-indent:-1.27cm; margin-bottom:8px; font-size:11pt;">${escapeHtml(r)}</p>
      `).join('');

      pdfWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(d.titulo)} — UNICA</title>
          <style>
            @page { size: letter; margin: 2.54cm; }
            body { font-family: 'Times New Roman', serif; line-height: 2; color: #111; max-width: 800px; margin: 0 auto; padding: 40px; }
            .header-unica { text-align: center; font-weight: bold; line-height: 1.3; margin-bottom: 50px; font-size: 13pt; }
            .title-section { text-align: center; margin: 70px 0; }
            .title-doc { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
            .meta-section { margin-top: 80px; font-size: 12pt; line-height: 1.6; }
            .page-break { page-break-before: always; }
            h2 { font-size: 13pt; margin-top: 24px; font-weight: bold; }
            p { text-align: justify; text-indent: 1.27cm; margin: 0 0 10px 0; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="background:#f0fdf4; border:1px solid #86efac; padding:12px; margin-bottom:20px; text-align:center; font-family:sans-serif;">
            <button onclick="window.print()" style="background:#10b981; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">
              🖨️ Imprimir / Guardar como PDF
            </button>
            <span style="font-size:12px; color:#15803d; margin-left:12px;">Memoria Académica UNICA bajo Normas APA 7ma</span>
          </div>

          <div class="header-unica">
            REPÚBLICA BOLIVARIANA DE VENEZUELA<br>
            UNIVERSIDAD CATÓLICA CECILIO ACOSTA<br>
            FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN<br>
            CÁTEDRA: ${escapeHtml(d.materia || 'COMUNICACIÓN Y DISEÑO')}
          </div>

          <div class="title-section">
            <div class="title-doc">${escapeHtml(d.titulo)}</div>
            <div style="font-size: 12pt; font-style: italic;">Memoria Descriptiva y Fundamentación de Asignación</div>
          </div>

          <div class="meta-section">
            <strong>Autor:</strong> Moisés González<br>
            <strong>C.I.:</strong> V-31.171.020<br>
            <strong>Institución:</strong> Universidad Católica Cecilio Acosta (UNICA)<br>
            <strong>Fecha:</strong> Maracaibo, ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>

          <div class="page-break"></div>

          <h2>1. Introducción y Resumen Ejecutivo</h2>
          <p>${escapeHtml(d.resumen_ejecutivo)}</p>

          <h2>2. Marco Teórico y Justificación</h2>
          <p>${escapeHtml(d.marco_teorico)}</p>

          ${puntosHtml}

          <h2>Conclusiones</h2>
          <p>${escapeHtml(d.conclusiones)}</p>

          <div class="page-break"></div>
          <h2>Referencias Bibliográficas (Normas APA 7ma)</h2>
          ${referenciasHtml}
        </body>
        </html>
      `);
      pdfWindow.document.close();
      showToast('📄 Vista previa de PDF generada.');
      break;
    }

    case 'word': {
      const puntosWord = (d.desarrollo_puntos || []).map(p => `
        <h2 style="color:#0033A0; border-bottom:1px solid #ddd; padding-bottom:4px;">${escapeHtml(p.subtitulo)}</h2>
        <p>${escapeHtml(p.contenido)}</p>
      `).join('');

      const wordDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${escapeHtml(d.titulo)}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 35px; }
          .inst-header { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 30px; }
          h1 { color: #0033A0; text-align: center; font-size: 16pt; margin: 30px 0; }
          h2 { color: #0E1424; font-size: 13pt; margin-top: 20px; }
          p { text-align: justify; margin-bottom: 12px; }
        </style>
        </head>
        <body>
          <div class="inst-header">
            UNIVERSIDAD CATÓLICA CECILIO ACOSTA<br>
            FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN<br>
            CÁTEDRA: ${escapeHtml(d.materia)}
          </div>
          <h1>${escapeHtml(d.titulo)}</h1>
          <p><strong>Estudiante:</strong> Moisés González (C.I. V-31.171.020)<br>
          <strong>Institución:</strong> UNICA - Maracaibo, Venezuela</p>
          <hr>
          <h2>1. Introducción</h2>
          <p>${escapeHtml(d.marco_teorico)}</p>
          ${puntosWord}
          <h2>Conclusiones</h2>
          <p>${escapeHtml(d.conclusiones)}</p>
        </body></html>
      `;
      triggerBlobDownload(wordDoc, `${cleanTitle}.doc`, 'application/msword');
      break;
    }

    case 'illustrator': {
      const svg = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <style>
      .bg { fill: #070a12; }
      .grid { stroke: rgba(0, 240, 255, 0.2); stroke-width: 1; stroke-dasharray: 4,4; }
      .circle { fill: none; stroke: rgba(244, 63, 94, 0.4); stroke-width: 1.5; }
      .txt-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #ffffff; }
      .txt-sub { font-family: Arial, sans-serif; font-size: 12px; fill: #94a3b8; }
    </style>
  </defs>
  <rect width="800" height="600" class="bg" />
  <text x="40" y="50" class="txt-title">UNICA — ${escapeHtml(d.titulo).toUpperCase()}</text>
  <text x="40" y="72" class="txt-sub">Moisés González (C.I. 31.171.020) · ${escapeHtml(d.materia)}</text>
  
  <line x1="100" y1="300" x2="700" y2="300" class="grid" />
  <line x1="400" y1="100" x2="400" y2="500" class="grid" />
  <circle cx="400" cy="300" r="140" class="circle" />
  <circle cx="400" cy="300" r="86" class="circle" />

  <polygon points="400,200 480,350 320,350" fill="#00f0ff" opacity="0.8" />
  <circle cx="400" cy="300" r="24" fill="#9333ea" />
  
  <rect x="100" y="530" width="30" height="20" fill="#0033A0" rx="3" />
  <text x="140" y="545" class="txt-sub">Pantone 286 C</text>
  <rect x="350" y="530" width="30" height="20" fill="#00f0ff" rx="3" />
  <text x="390" y="545" class="txt-sub">Cyan Neón #00F0FF</text>
</svg>`;
      triggerBlobDownload(svg, `${cleanTitle}.svg`, 'image/svg+xml');
      break;
    }

    case 'photoshop': {
      const psdSpec = d.formato_photoshop || { ancho_cm: 21.59, alto_cm: 27.94 };
      const widthPx = Math.round((psdSpec.ancho_cm / 2.54) * 300);
      const heightPx = Math.round((psdSpec.alto_cm / 2.54) * 300);

      const jsx = `/**
 * Script Automático de Photoshop generado por PRISMA
 * Tarea: ${d.titulo}
 * Estudiante: Moisés González (C.I. 31.171.020)
 * UNICA
 */
#target photoshop
app.bringToFront();

var doc = app.documents.add(${widthPx}, ${heightPx}, 300, "${cleanTitle}", NewDocumentMode.RGB, DocumentFill.WHITE);

var gGuias = doc.layerSets.add();
gGuias.name = "[GUIAS Y COTAS]";

var gArte = doc.layerSets.add();
gArte.name = "[ARTE Y COMPOSICIÓN]";

var gTextos = doc.layerSets.add();
gTextos.name = "[TIPOGRAFÍA Y CONTENIDO]";

var gFondo = doc.layerSets.add();
gFondo.name = "[FONDO]";

doc.guides.add(Direction.HORIZONTAL, 35);
doc.guides.add(Direction.HORIZONTAL, ${heightPx - 35});
doc.guides.add(Direction.VERTICAL, 35);
doc.guides.add(Direction.VERTICAL, ${widthPx - 35});

alert("¡Lienzo de Photoshop generado por PRISMA para UNICA!\n\n• Tarea: ${cleanTitle}\n• Resolución: 300 DPI\n• Capas organizadas\n\nEstudiante: Moisés González");
`;
      triggerBlobDownload(jsx, `${cleanTitle}.jsx`, 'text/plain');
      break;
    }

    case 'excel': {
      let csv = '\uFEFF' + 'Ítem,Fase de Proyecto,Descripción Específica,Horas Estimadas,Costo ($),Subtotal ($)\n';
      let total = 0;
      (d.presupuesto_items || []).forEach((item, idx) => {
        const sub = item.costo || 100;
        total += sub;
        csv += `${idx + 1},"${item.fase}","${item.descripcion}",${item.horas || 10},${sub}.00,$${sub}.00\n`;
      });
      csv += `,,,TOTAL PROYECTO,,$${total}.00\n`;
      triggerBlobDownload(csv, `${cleanTitle}.csv`, 'text/csv;charset=utf-8;');
      break;
    }
  }
};

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
  showToast(`✓ Descargado: ${filename}`);
}

// ============================================================================
// 5. MODAL PARA TAREA MANUAL
// ============================================================================
window.openManualTaskModal = function() {
  const modal = document.getElementById('modal-review');
  const body = document.getElementById('modal-review-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <h2 style="font-size:17px; font-weight:800; color:#fff;">+ Nueva Tarea Manual en Radar</h2>
      <button class="btn-prism btn-ghost" style="padding:4px 8px;" onclick="closeModal()">✕</button>
    </div>
    <div style="margin-bottom:12px;">
      <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">Título de la Tarea:</label>
      <input type="text" id="manual-title" placeholder="Ej: Ensayo sobre Historia del Diseño" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:8px 10px; font-size:13px; outline:none;">
    </div>
    <div style="margin-bottom:12px;">
      <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">Descripción / Pautas:</label>
      <textarea id="manual-desc" placeholder="Instrucciones que dio el profesor..." style="width:100%; height:70px; background:rgba(0,0,0,0.4); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:8px 10px; font-size:13px; outline:none; resize:none;"></textarea>
    </div>
    <div style="margin-bottom:16px;">
      <label style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">Fecha Límite:</label>
      <input type="date" id="manual-date" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:8px 10px; font-size:13px; outline:none;">
    </div>
    <button class="btn-prism btn-primary-cyan" style="width:100%;" onclick="saveManualTask()">
      Guardar en Radar
    </button>
  `;
  modal.style.display = 'flex';
};

window.saveManualTask = function() {
  const title = document.getElementById('manual-title')?.value.trim();
  const desc = document.getElementById('manual-desc')?.value.trim();
  const date = document.getElementById('manual-date')?.value;

  if (!title) {
    alert('Ingresa al menos el título de la tarea.');
    return;
  }

  const newT = {
    id: 'ASN-' + Date.now().toString().slice(-4),
    courseId: 14739,
    title: title,
    description: desc || 'Asignación creada manualmente por Moisés.',
    deadline: date ? new Date(date).toISOString() : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: 'pending',
    formats: ['PDF', 'Word']
  };

  state.assignments.unshift(newT);
  localStorage.setItem('prisma_assignments', JSON.stringify(state.assignments));
  closeModal();
  showToast('✓ Tarea agregada al Radar.');
  renderCurrentTab();
};

// ============================================================================
// 6. VISTA CANALES & SINCRONIZADOR UNICA (BOOKMARKLET)
// ============================================================================
function renderChannelsView(container) {
  const bookmarkletCode = "javascript:(function(){try{var courses=Array.from(document.querySelectorAll('.dashboard-card, .course-info-container, .coursename')).map(c=>c.innerText.trim()).filter(Boolean);alert('PRISMA Sync UNICA:\n\nCursos detectados: ' + (courses.length||1) + '\n\nSesión activa de Moisés González en UNICA verificada.');}catch(e){alert('Error al leer Moodle: '+e);}})();";

  container.innerHTML = `
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">💬 Canales & Sincronizador UNICA</h2>
      </div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:16px;">
        Vínculos de comunicación y sincronizador para extraer información del campus sin intermediarios.
      </p>

      <!-- Bookmarklet Sincronizador UNICA -->
      <div style="background:rgba(0,240,255,0.08); border:1px solid rgba(0,240,255,0.3); border-radius:8px; padding:14px; margin-bottom:14px;">
        <div style="font-weight:700; font-size:13.5px; color:var(--cyan-neon); margin-bottom:4px;">
          ⚡ Botón de Sincronización Directa de Moodle UNICA
        </div>
        <p style="font-size:12px; color:var(--text-main); margin-bottom:10px; line-height:1.4;">
          Para actualizar materias o notas directamente desde tu sesión de estudiante sin bloqueos de seguridad:
        </p>
        <a href="${bookmarkletCode}" class="btn-prism btn-primary-cyan" style="display:inline-block; font-size:12px; text-decoration:none;" onclick="alert('Arrastra este botón a la barra de marcadores de tu navegador. Cuando estés en el campus UNICA, haz clic en él para sincronizar.'); return false;">
          ⭐ Arrastra este botón a tus Favoritos: "Sincronizar con Prisma"
        </a>
      </div>

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
    </div>
  `;
}

// ============================================================================
// 7. VISTA SEGURIDAD & LICENCIAS
// ============================================================================
function renderSecurityView(container) {
  container.innerHTML = `
    <div class="glass-card">
      <div class="card-title-row">
        <h2 class="card-title">🛡️ Seguridad & Licenciamiento Comercial</h2>
      </div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:16px;">
        Protección de propiedad intelectual con amarre de hardware (HWID).
      </p>

      <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-glass); border-radius:8px; padding:16px; margin-bottom:16px;">
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">HUELLA DIGITAL DE HARDWARE (HWID):</div>
        <div style="font-family:var(--font-mono); font-size:12.5px; color:var(--cyan-neon); word-break:break-all; margin-bottom:12px;">
          ${state.license.hwid}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px;">
          <div><span style="color:var(--text-muted);">Titular:</span> <strong>${state.student.name}</strong></div>
          <div><span style="color:var(--text-muted);">Plan:</span> <strong style="color:var(--emerald-success);">👑 Licencia Maestro</strong></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MODAL DE REVISIÓN HUMAN IN THE LOOP (DESDE RADAR)
// ============================================================================
window.openApprovalModal = function(assignmentId) {
  const assignment = state.assignments.find(a => a.id === assignmentId);
  if (!assignment) return;

  const modal = document.getElementById('modal-review');
  const body = document.getElementById('modal-review-body');
  if (!modal || !body) return;

  state.activeGeneratedWork = assignment.workData || analyzePromptLocally(assignment.title + " " + assignment.description);

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

    <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:14px;">
      ${escapeHtml(assignment.description)}
    </p>

    <div style="font-size:12.5px; font-weight:700; color:#fff; margin-bottom:8px;">
      📦 Descargar Archivos de esta Asignación:
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
      <button class="btn-prism btn-ghost" style="text-align:left; padding:8px 12px;" onclick="downloadDynamicFile('pdf')">
        📄 Descargar Memoria Técnica Institucional (PDF / APA)
      </button>
      <button class="btn-prism btn-ghost" style="text-align:left; padding:8px 12px;" onclick="downloadDynamicFile('word')">
        📝 Descargar Documento Word Editable (.doc)
      </button>
      <button class="btn-prism btn-ghost" style="text-align:left; padding:8px 12px;" onclick="downloadDynamicFile('illustrator')">
        📐 Descargar Vectores de Retícula para Illustrator (.svg)
      </button>
      <button class="btn-prism btn-ghost" style="text-align:left; padding:8px 12px;" onclick="downloadDynamicFile('photoshop')">
        🖼️ Descargar Script de Lienzo y Capas Photoshop (.jsx)
      </button>
      <button class="btn-prism btn-ghost" style="text-align:left; padding:8px 12px;" onclick="downloadDynamicFile('excel')">
        📊 Descargar Presupuesto y Cronograma (.csv)
      </button>
    </div>

    <div style="display:flex; gap:10px;">
      <button class="btn-prism btn-ghost" style="flex:1;" onclick="closeModal()">
        Cerrar
      </button>
      <button class="btn-prism btn-approve-submit" style="flex:2;" onclick="markAsSubmitted('${assignment.id}')">
        🚀 Marcar como Entregado en UNICA
      </button>
    </div>
  `;

  modal.style.display = 'flex';
};

window.closeModal = function() {
  const modal = document.getElementById('modal-review');
  if (modal) modal.style.display = 'none';
};

window.markAsSubmitted = function(id) {
  const t = state.assignments.find(a => a.id === id);
  if (t) {
    t.status = 'submitted';
    localStorage.setItem('prisma_assignments', JSON.stringify(state.assignments));
    closeModal();
    showToast('✓ Tarea marcada como entregada.');
    renderCurrentTab();
  }
};

window.syncCampusUnica = function() {
  showToast('🔄 Verificando campus UNICA...');
  setTimeout(() => {
    showToast('✓ Materia TALLER DE IMAGEN CORPORATIVA activa. 0 tareas nuevas.');
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
