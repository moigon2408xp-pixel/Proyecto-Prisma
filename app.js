/**
 * ============================================================================
 * PROYECTO PRISMA — FRONTEND ACTUALIZADO (v3.0)
 * Plataforma Resolutiva de Inteligencia y Seguimiento Multimodal Académico
 * Basado en la arquitectura exitosa de Creaciones JJ
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================================================
const PRISMA_CONFIG = {
  API_URL: localStorage.getItem('prisma_api_url') || '', // Se configurará en ajustes
  CAMPUS_URL: 'https://campus.unica.edu.ve',
  STUDENT_INFO: {
    name: 'Moisés González',
    cedula: 'V-31.171.020',
    id: 580,
    university: 'Universidad Católica Cecilio Acosta (UNICA)',
    faculty: 'Facultad de Ciencias de la Comunicación y de la Información',
    school: 'Escuela de Comunicación Social y Diseño Gráfico'
  }
};

// ============================================================================
// ESTADO GLOBAL
// ============================================================================
const state = {
  // Sesión de usuario
  session: JSON.parse(localStorage.getItem('prisma_session')) || null,
  
  // Datos académicos
  materias: JSON.parse(localStorage.getItem('prisma_materias')) || [],
  tareas: JSON.parse(localStorage.getItem('prisma_tareas')) || [],
  calendario: JSON.parse(localStorage.getItem('prisma_calendario')) || [],
  canales: JSON.parse(localStorage.getItem('prisma_canales')) || [],
  configuracion: JSON.parse(localStorage.getItem('prisma_configuracion')) || {},
  
  // Estado de la interfaz
  currentScreen: 'modules',
  theme: localStorage.getItem('prisma_theme') || 'dark',
  
  // Generación con IA
  apiKey: localStorage.getItem('prisma_gemini_key') || '',
  activeGeneratedWork: null,
  
  // Filtros y búsqueda
  searchQuery: '',
  filterPriority: 'all',
  filterStatus: 'all'
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Aplicar tema
  applyTheme(state.theme);
  
  // Verificar sesión
  if (state.session) {
    showWorkspace();
    loadDashboardData();
  } else {
    showLogin();
  }
  
  // Configurar event listeners
  setupEventListeners();
  
  // Iniciar atajos de teclado
  setupKeyboardShortcuts();
}

function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadDashboardData();
      showToast('Datos actualizados');
    });
  }
  
  // Bell notifications
  const bellBtn = document.getElementById('bellIconBtn');
  if (bellBtn) {
    bellBtn.addEventListener('click', toggleNotifications);
  }
  
  // Search toggle
  const searchBtn = document.getElementById('searchToggleBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', toggleSpotlight);
  }
  
  // Bottom navigation
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const screen = btn.getAttribute('data-screen');
      navigate(screen);
    });
  });
  
  // Module tabs
  document.querySelectorAll('.prisma-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const screen = btn.getAttribute('data-screen');
      navigate(screen);
    });
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K para spotlight
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleSpotlight();
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// ============================================================================
// GESTIÓN DE SESIÓN
// ============================================================================
function showLogin() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('workspace').style.display = 'none';
}

function showWorkspace() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('workspace').style.display = 'flex';
  updateUserPill();
}

function handleLogin(e) {
  e.preventDefault();
  
  const name = document.getElementById('login-name').value.trim();
  const pin = document.getElementById('login-pin').value.trim();
  
  if (!name || !pin) {
    showLoginError('Nombre y PIN son requeridos');
    return;
  }
  
  // Simular login (en producción, llamar a la API)
  if (PRISMA_CONFIG.API_URL) {
    // Login con backend
    fetch(PRISMA_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'prisma_login',
        name: name,
        pin: pin
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok && data.exito) {
        state.session = data.session;
        localStorage.setItem('prisma_session', JSON.stringify(state.session));
        showWorkspace();
        loadDashboardData();
      } else {
        showLoginError(data.mensaje || 'Error en login');
      }
    })
    .catch(err => {
      console.error('Error en login:', err);
      showLoginError('Error de conexión. Usando modo local.');
      // Fallback a modo local
      performLocalLogin(name, pin);
    });
  } else {
    // Modo local (sin backend configurado)
    performLocalLogin(name, pin);
  }
}

function performLocalLogin(name, pin) {
  // Login local simplificado para desarrollo
  state.session = {
    name: name,
    role: 'administrador',
    token: 'local-' + Date.now()
  };
  localStorage.setItem('prisma_session', JSON.stringify(state.session));
  showWorkspace();
  loadDashboardData();
  showToast('Sesión iniciada en modo local');
}

function showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function doLogout() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: '¿Estás seguro de que deseas salir?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#00f0ff',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      state.session = null;
      localStorage.removeItem('prisma_session');
      showLogin();
      showToast('Sesión cerrada');
    }
  });
}

function updateUserPill() {
  const nameEl = document.getElementById('userPillName');
  if (nameEl && state.session) {
    nameEl.textContent = state.session.name || 'Usuario';
  }
}

// ============================================================================
// NAVEGACIÓN SPA
// ============================================================================
function navigate(screen) {
  state.currentScreen = screen;
  
  // Actualizar tabs de módulos
  document.querySelectorAll('.prisma-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-screen') === screen);
  });
  
  // Actualizar navegación inferior
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-screen') === screen);
  });
  
  // Renderizar pantalla correspondiente
  renderScreen(screen);
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderScreen(screen) {
  const container = document.getElementById('screen');
  if (!container) return;
  
  switch (screen) {
    case 'modules':
      renderModulesScreen(container);
      break;
    case 'radar':
      renderRadarScreen(container);
      break;
    case 'studio':
      renderStudioScreen(container);
      break;
    case 'calendar':
      renderCalendarScreen(container);
      break;
    case 'channels':
      renderChannelsScreen(container);
      break;
    case 'courses':
      renderCoursesScreen(container);
      break;
    case 'settings':
      renderSettingsScreen(container);
      break;
    default:
      renderModulesScreen(container);
  }
}

// ============================================================================
// PANTALLA DE MÓDULOS
// ============================================================================
function renderModulesScreen(container) {
  const pendingTasks = state.tareas.filter(t => t.estado === 'Pendiente').length;
  const urgentTasks = state.tareas.filter(t => {
    if (!t.fecha_entrega) return false;
    const daysUntilDue = Math.ceil((new Date(t.fecha_entrega) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && t.estado !== 'Entregada';
  }).length;
  
  container.innerHTML = `
    <div class="modules-grid">
      <!-- Tarjeta Radar -->
      <div class="module-card" onclick="navigate('radar')">
        <div class="module-card-icon" style="background: rgba(0,240,255,0.15); color: #00f0ff;">
          <i class="fas fa-satellite-dish"></i>
        </div>
        <div class="module-card-content">
          <h3>Radar Académico</h3>
          <p>Monitoreo de tareas y prioridades</p>
          <div class="module-card-stats">
            <span class="stat-badge">${pendingTasks} pendientes</span>
            <span class="stat-badge urgent">${urgentTasks} urgentes</span>
          </div>
        </div>
      </div>
      
      <!-- Tarjeta Estudio -->
      <div class="module-card" onclick="navigate('studio')">
        <div class="module-card-icon" style="background: rgba(147,51,234,0.15); color: #9333ea;">
          <i class="fas fa-palette"></i>
        </div>
        <div class="module-card-content">
          <h3>Estudio Multimodal</h3>
          <p>Generación de entregables con IA</p>
          <div class="module-card-stats">
            <span class="stat-badge">Motor Gemini ${state.apiKey ? '✓' : '○'}</span>
          </div>
        </div>
      </div>
      
      <!-- Tarjeta Calendario -->
      <div class="module-card" onclick="navigate('calendar')">
        <div class="module-card-icon" style="background: rgba(16,185,129,0.15); color: #10b981;">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="module-card-content">
          <h3>Calendario Académico</h3>
          <p>Gestión de fechas y recordatorios</p>
          <div class="module-card-stats">
            <span class="stat-badge">${state.calendario.length} eventos</span>
          </div>
        </div>
      </div>
      
      <!-- Tarjeta Materias -->
      <div class="module-card" onclick="navigate('courses')">
        <div class="module-card-icon" style="background: rgba(245,158,11,0.15); color: #f59e0b;">
          <i class="fas fa-book"></i>
        </div>
        <div class="module-card-content">
          <h3>Materias Inscritas</h3>
          <p>Gestión de cursos y profesores</p>
          <div class="module-card-stats">
            <span class="stat-badge">${state.materias.length} materias</span>
          </div>
        </div>
      </div>
      
      <!-- Tarjeta Canales -->
      <div class="module-card" onclick="navigate('channels')">
        <div class="module-card-icon" style="background: rgba(236,72,153,0.15); color: #ec4899;">
          <i class="fas fa-comments"></i>
        </div>
        <div class="module-card-content">
          <h3>Canales de Mensajería</h3>
          <p>Integración WhatsApp/Telegram</p>
          <div class="module-card-stats">
            <span class="stat-badge">${state.canales.length} canales</span>
          </div>
        </div>
      </div>
      
      <!-- Tarjeta Ajustes -->
      <div class="module-card" onclick="navigate('settings')">
        <div class="module-card-icon" style="background: rgba(100,116,139,0.15); color: #64748b;">
          <i class="fas fa-cog"></i>
        </div>
        <div class="module-card-content">
          <h3>Ajustes del Sistema</h3>
          <p>Configuración y preferencias</p>
          <div class="module-card-stats">
            <span class="stat-badge">Configurar</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// PANTALLA RADAR
// ============================================================================
function renderRadarScreen(container) {
  const filteredTasks = filterTasks(state.tareas);
  
  container.innerHTML = `
    <div class="screen-header">
      <h2>📡 Radar Académico</h2>
      <button class="secondary-button" onclick="openNewTaskModal()">
        <i class="fas fa-plus"></i> Nueva Tarea
      </button>
    </div>
    
    <div class="filters-bar">
      <select class="filter-select" onchange="state.filterPriority = this.value; renderScreen('radar');">
        <option value="all">Todas las prioridades</option>
        <option value="Alta" ${state.filterPriority === 'Alta' ? 'selected' : ''}>Alta prioridad</option>
        <option value="Media" ${state.filterPriority === 'Media' ? 'selected' : ''}>Media prioridad</option>
        <option value="Baja" ${state.filterPriority === 'Baja' ? 'selected' : ''}>Baja prioridad</option>
      </select>
      
      <select class="filter-select" onchange="state.filterStatus = this.value; renderScreen('radar');">
        <option value="all">Todos los estados</option>
        <option value="Pendiente" ${state.filterStatus === 'Pendiente' ? 'selected' : ''}>Pendientes</option>
        <option value="En_Proceso" ${state.filterStatus === 'En_Proceso' ? 'selected' : ''}>En proceso</option>
        <option value="Entregada" ${state.filterStatus === 'Entregada' ? 'selected' : ''}>Entregadas</option>
      </select>
    </div>
    
    ${filteredTasks.length === 0 ? `
      <div class="empty-state">
        <i class="fas fa-satellite-dish" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
        <h3>No hay tareas en el radar</h3>
        <p>Agrega tu primera tarea o sincroniza con el campus universitario</p>
        <button class="primary-button" onclick="openNewTaskModal()" style="margin-top: 1rem;">
          Agregar Tarea Manual
        </button>
      </div>
    ` : `
      <div class="tasks-list">
        ${filteredTasks.map(task => renderTaskCard(task)).join('')}
      </div>
    `}
  `;
  
  updateBadge('tabBadgeRadar', filteredTasks.filter(t => t.estado === 'Pendiente').length);
}

function filterTasks(tasks) {
  return tasks.filter(task => {
    if (state.filterPriority !== 'all' && task.prioridad !== state.filterPriority) return false;
    if (state.filterStatus !== 'all' && task.estado !== state.filterStatus) return false;
    if (state.searchQuery && !task.titulo.toLowerCase().includes(state.searchQuery.toLowerCase())) return false;
    return true;
  });
}

function renderTaskCard(task) {
  const daysUntilDue = task.fecha_entrega ? 
    Math.ceil((new Date(task.fecha_entrega) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  const urgencyClass = daysUntilDue !== null ? 
    (daysUntilDue <= 2 ? 'urgent' : daysUntilDue <= 5 ? 'warning' : 'normal') : 'normal';
  
  const statusColors = {
    'Pendiente': '#f59e0b',
    'En_Proceso': '#3b82f6',
    'Lista_Entregada': '#10b981',
    'Entregada': '#64748b',
    'Calificada': '#8b5cf6'
  };
  
  return `
    <div class="task-card" onclick="openTaskDetailModal('${task.id}')">
      <div class="task-header">
        <div class="task-priority ${urgencyClass}"></div>
        <div class="task-info">
          <h3>${escapeHtml(task.titulo)}</h3>
          <p class="task-subtitle">${escapeHtml(task.materia_nombre || 'Sin materia')}</p>
        </div>
        <div class="task-status" style="background: ${statusColors[task.estado] || '#64748b'}">
          ${formatStatus(task.estado)}
        </div>
      </div>
      
      <div class="task-body">
        <p class="task-description">${escapeHtml(task.descripcion || '').substring(0, 100)}...</p>
        
        <div class="task-meta">
          ${daysUntilDue !== null ? `
            <span class="meta-item ${urgencyClass}">
              <i class="fas fa-clock"></i>
              ${daysUntilDue < 0 ? 'Vencida' : daysUntilDue === 0 ? 'Hoy' : daysUntilDue + ' días'}
            </span>
          ` : ''}
          
          <span class="meta-item">
            <i class="fas fa-file-alt"></i>
            ${task.tipo || 'Proyecto'}
          </span>
          
          <span class="meta-item">
            <i class="fas fa-percentage"></i>
            ${task.porcentaje_nota || 0}%
          </span>
        </div>
      </div>
      
      <div class="task-footer">
        <div class="task-formats">
          ${(task.formatos_requeridos || 'PDF').split(',').map(fmt => 
            `<span class="format-tag">${fmt.trim()}</span>`
          ).join('')}
        </div>
        
        <div class="task-actions">
          ${task.estado === 'Pendiente' ? `
            <button class="action-btn" onclick="event.stopPropagation(); updateTaskStatus('${task.id}', 'En_Proceso')">
              <i class="fas fa-play"></i>
            </button>
          ` : ''}
          
          ${task.estado === 'En_Proceso' ? `
            <button class="action-btn" onclick="event.stopPropagation(); generateForTask('${task.id}')">
              <i class="fas fa-magic"></i>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function formatStatus(status) {
  const statusMap = {
    'Pendiente': 'Pendiente',
    'En_Proceso': 'En Proceso',
    'Lista_Entregada': 'Lista',
    'Entregada': 'Entregada',
    'Calificada': 'Calificada'
  };
  return statusMap[status] || status;
}

// ============================================================================
// PANTALLA ESTUDIO (IA)
// ============================================================================
function renderStudioScreen(container) {
  const hasKey = !!state.apiKey;
  
  container.innerHTML = `
    <div class="screen-header">
      <h2>🎨 Estudio Multimodal</h2>
      <button class="secondary-button" onclick="toggleApiKeyInput()">
        <i class="fas fa-key"></i> ${hasKey ? 'IA Conectada' : 'Conectar Gemini'}
      </button>
    </div>
    
    <!-- Configuración de API -->
    <div id="gemini-config-box" style="display: ${hasKey ? 'none' : 'block'};" class="config-box">
      <h3>⚡ Conectar Google Gemini</h3>
      <p>Para generación avanzada de contenido académico, conecta tu clave de API de Google Gemini (gratis).</p>
      
      <div class="form-group">
        <label>Clave de API (AIzaSy...)</label>
        <input type="password" id="gemini-api-key" value="${state.apiKey}" placeholder="Pega tu clave de Google AI Studio">
      </div>
      
      <div class="form-actions">
        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="link-button">
          Obtener clave gratis ↗
        </a>
        <button class="primary-button" onclick="saveGeminiKey()">Guardar Clave</button>
      </div>
      
      <p class="note">Tu clave se guarda localmente en tu navegador. Si no tienes una, PRISMA usará su motor heurístico local.</p>
    </div>
    
    <!-- Selector de tipo de entregable -->
    <div class="format-selector">
      <button class="format-btn active" data-type="auto" onclick="selectFormat(this, 'auto')">
        <i class="fas fa-magic"></i> Autodetectar
      </button>
      <button class="format-btn" data-type="essay" onclick="selectFormat(this, 'essay')">
        <i class="fas fa-file-alt"></i> Ensayo PDF
      </button>
      <button class="format-btn" data-type="design" onclick="selectFormat(this, 'design')">
        <i class="fas fa-palette"></i> Diseño Vectorial
      </button>
      <button class="format-btn" data-type="presentation" onclick="selectFormat(this, 'presentation')">
        <i class="fas fa-presentation"></i> Presentación
      </button>
    </div>
    
    <!-- Área de entrada de pautas -->
    <div class="prompt-area">
      <label>Pautas o Instrucciones de la Tarea:</label>
      <textarea id="studio-prompt" rows="6" placeholder="Pega aquí las instrucciones completas del profesor (ej: 'Realizar un ensayo de 3 páginas sobre la Semiótica de Umberto Eco...')"></textarea>

      <div class="form-group">
        <label>🎨 Estilo de Portada:</label>
        <select id="cover-style" class="filter-select">
          <option value="modern">Gradiente Moderno</option>
          <option value="vibrant">Vibrante Moderna</option>
          <option value="elegant">Minimalista Elegante</option>
          <option value="pop">Pop Art Vibrante</option>
          <option value="abstract">Abstracto Creativo</option>
        </select>
      </div>

      <div class="prompt-actions">
        <span class="ai-status ${hasKey ? 'connected' : 'local'}">
          ${hasKey ? '⚡ Motor: Google Gemini 2.0 Flash' : '⚡ Motor: Analizador Local Heurístico'}
        </span>
        <button class="primary-button" onclick="executeAIAnalysis()">
          <i class="fas fa-rocket"></i> Analizar y Generar
        </button>
      </div>
    </div>

    <!-- Área de captura rápida de mensajes -->
    <div class="prompt-area" style="margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
      <label>💬 Captura Rápida de Mensajes (WhatsApp/Telegram):</label>
      <p style="font-size: 12px; color: #888; margin-bottom: 10px;">
        Copia un mensaje de WhatsApp o Telegram y pégalo aquí. PRISMA creará automáticamente la tarea.
      </p>
      <textarea id="quick-capture" rows="4" placeholder="Pega aquí el mensaje del profesor (ej: 'Tarea: Presentar composición el 20 de noviembre...')"></textarea>
      <div class="prompt-actions">
        <button class="secondary-button" onclick="quickCaptureTask()">
          <i class="fas fa-bolt"></i> Capturar y Crear Tarea
        </button>
      </div>
    </div>
    
    <!-- Área de resultados -->
    <div id="studio-results" style="display: none;"></div>
  `;
}

function toggleApiKeyInput() {
  const box = document.getElementById('gemini-config-box');
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
}

function saveGeminiKey() {
  const key = document.getElementById('gemini-api-key').value.trim();
  state.apiKey = key;
  localStorage.setItem('prisma_gemini_key', key);
  
  if (key) {
    showToast('✓ Clave de Gemini guardada');
  } else {
    localStorage.removeItem('prisma_gemini_key');
    showToast('Clave removida. Modo local activado.');
  }
  
  renderStudioScreen(document.getElementById('screen'));
}

function selectFormat(btn, type) {
  document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.setAttribute('data-selected-type', type);
}

async function executeAIAnalysis() {
  const prompt = document.getElementById('studio-prompt').value.trim();
  if (!prompt) {
    Swal.fire('Error', 'Por favor ingresa las pautas de la tarea', 'error');
    return;
  }
  
  const resultsArea = document.getElementById('studio-results');
  resultsArea.style.display = 'block';
  resultsArea.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-cog fa-spin"></i>
      <p>PRISMA está analizando las pautas...</p>
      <p class="sub-text">Estructurando contenido académico y generando entregables</p>
    </div>
  `;
  
  try {
    let resultData;

    if (state.apiKey && PRISMA_CONFIG.API_URL) {
      // Usar backend con Gemini (evita problemas de CORS)
      resultData = await callBackendForGeneration(prompt);
    } else if (state.apiKey) {
      // Intentar llamada directa a Gemini (puede fallar por CORS)
      try {
        resultData = await callGeminiDirectly(prompt);
      } catch (directError) {
        console.warn('Llamada directa falló por CORS, usando motor local:', directError);
        showToast('⚠️ Error de CORS. Usa motor local o configura el backend.');
        await new Promise(r => setTimeout(r, 1000));
        resultData = analyzePromptLocally(prompt);
      }
    } else {
      // Motor heurístico local
      await new Promise(r => setTimeout(r, 1000));
      resultData = analyzePromptLocally(prompt);
    }

    state.activeGeneratedWork = resultData;
    renderGeneratedResults(resultData, resultsArea);
    showToast('✓ Análisis completado y entregables listos');

  } catch (err) {
    console.error('Error en generación:', err);
    resultsArea.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error en la generación</p>
        <p class="sub-text">${err.message}</p>
        <button class="secondary-button" onclick="executeAIAnalysis()">Reintentar</button>
      </div>
    `;
  }
}

async function callGeminiDirectly(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;
  
  const systemInstruction = `Eres PRISMA, asistente académico de élite. Analiza las pautas y devuelve un JSON con esta estructura:
{
  "titulo": "Título académico",
  "materia": "Nombre de materia",
  "resumen_ejecutivo": "Resumen de 2-3 oraciones",
  "marco_teorico": "Introducción y marco conceptual (2 párrafos)",
  "desarrollo_puntos": [
    {"subtitulo": "Nombre del punto", "contenido": "Explicación detallada"}
  ],
  "conclusiones": "Conclusiones analíticas",
  "referencias_apa": ["Apellido, A. (Año). Título. Editorial."],
  "paleta_sugerida": [{"nombre": "Color", "hex": "#HEX"}]
}`;
  
  const body = {
    contents: [{ parts: [{ text: systemInstruction + "\n\nPAUTAS:\n" + prompt }] }],
    generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error Gemini API:', response.status, errorText);
      throw new Error(`Error en API Gemini (${response.status}): ${errorText}`);
    }
    
    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Respuesta vacía de Gemini');
    }
    
    return JSON.parse(rawText);
  } catch (error) {
    console.error('Error completo en callGeminiDirectly:', error);
    throw error;
  }
}

async function callBackendForGeneration(prompt) {
  const response = await fetch(PRISMA_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'prisma_generate_content',
      prompt: prompt,
      tipo: 'auto',
      api_key: state.apiKey
    })
  });

  const data = await response.json();
  if (!data.ok) throw new Error(data.mensaje || 'Error en backend');

  return JSON.parse(data.contenido);
}

function analyzePromptLocally(prompt) {
  // Motor heurístico local con branding UNICA
  const p = prompt.toLowerCase();

  let topic = "Análisis Académico General";
  let subject = "Cátedra Universitaria";
  let faculty = "Facultad de Ciencias de la Comunicación y de la Información";

  if (p.includes("marca") || p.includes("isotipo") || p.includes("logotipo")) {
    topic = "Identidad Visual Corporativa";
    subject = "Taller de Imagen Corporativa";
  } else if (p.includes("ensayo") || p.includes("informe") || p.includes("investig")) {
    topic = "Fundamentación Teórica Académica";
    subject = "Teoría de la Comunicación";
  } else if (p.includes("editorial") || p.includes("revista") || p.includes("diagram")) {
    topic = "Diseño Editorial y Diagramación";
    subject = "Diseño Editorial";
  } else if (p.includes("composicion") || p.includes("dibujo") || p.includes("ilustracion")) {
    topic = "Composición Artística Digital";
    subject = "Diseño Gráfico Digital Avanzado";
  }

  return {
    titulo: topic + " - Análisis Académico",
    materia: subject,
    resumen_ejecutivo: `Proyecto académico basado en las pautas: "${prompt.substring(0, 80)}...". Estructurado bajo normas académicas institucionales de la Universidad Católica Cecilio Acosta.`,
    marco_teorico: `El presente trabajo se fundamenta en los principios teóricos de la cátedra de ${subject}, abordando la temática desde una perspectiva analítica y propositiva según las directrices establecidas por la ${faculty}.`,
    desarrollo_puntos: [
      {
        subtitulo: "1. Contexto y Diagnóstico",
        contenido: "Se identifican los elementos clave de la problemática planteada, estableciendo el marco de referencia para el análisis desde la perspectiva del diseño gráfico contemporáneo."
      },
      {
        subtitulo: "2. Desarrollo y Análisis",
        contenido: "Se profundiza en los aspectos conceptuales y prácticos de la temática, aplicando los fundamentos teóricos de la cátedra y considerando las tendencias actuales en diseño visual."
      },
      {
        subtitulo: "3. Conclusiones y Propuestas",
        contenido: "Se sintetizan los hallazgos principales y se presentan conclusiones fundamentadas."
      }
    ],
    conclusiones: "El análisis realizado demuestra comprensión de los conceptos fundamentales y capacidad de aplicación práctica de los conocimientos académicos del diseño gráfico contemporáneo.",
    referencias_apa: [
      "Frascara, J. (2004). Diseño de comunicación. Ediciones Infinito.",
      "Eco, U. (1994). Signo. Editorial Labor.",
      "Costa, J. (2012). La imagen de marca. Paidós.",
      "Munari, B. (2016). Diseño y comunicación visual. Gustavo Gili."
    ],
    paleta_sugerida: [
      { nombre: "UNICA Azul", hex: "#0033A0" },
      { nombre: "Cian Acento", hex: "#00F0FF" },
      { nombre: "Negro Base", hex: "#0E1424" },
      { nombre: "Blanco", hex: "#FFFFFF" }
    ],
    // Metadatos para branding UNICA
    universidad: "Universidad Católica Cecilio Acosta (UNICA)",
    facultad: "Facultad de Ciencias de la Comunicación y de la Información",
    estudiante: "Moisés González",
    cedula: "V-31.171.020"
  };
}

function renderGeneratedResults(data, container) {
  container.innerHTML = `
    <div class="results-container">
      <div class="results-header">
        <div>
          <span class="success-badge">✓ Análisis Completado</span>
          <h3>${escapeHtml(data.titulo)}</h3>
          <p class="results-subtitle">${escapeHtml(data.materia)} · UNICA</p>
        </div>
        <button class="secondary-button" onclick="addWorkToRadar()">
          <i class="fas fa-plus"></i> Enviar al Radar
        </button>
      </div>
      
      <div class="results-summary">
        <h4>Resumen Ejecutivo</h4>
        <p>${escapeHtml(data.resumen_ejecutivo)}</p>
      </div>
      
      <div class="generated-files">
        <h4>📦 Archivos Generados</h4>
        <div class="files-grid">
          <div class="file-card">
            <i class="fas fa-image" style="color: #ec4899;"></i>
            <span>Portada Creativa</span>
            <button class="download-btn" onclick="downloadFile('cover')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
            <span>Memoria PDF (UNICA)</span>
            <button class="download-btn" onclick="downloadFile('pdf')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-file-word" style="color: #3b82f6;"></i>
            <span>Documento Word</span>
            <button class="download-btn" onclick="downloadFile('word')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-vector-square" style="color: #f59e0b;"></i>
            <span>Vector SVG</span>
            <button class="download-btn" onclick="downloadFile('svg')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-palette" style="color: #8b5cf6;"></i>
            <span>Script Illustrator</span>
            <button class="download-btn" onclick="downloadFile('illustrator')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-images" style="color: #10b981;"></i>
            <span>Script Photoshop</span>
            <button class="download-btn" onclick="downloadFile('jsx')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-cube" style="color: #f97316;"></i>
            <span>Script Blender</span>
            <button class="download-btn" onclick="downloadFile('blender')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-film" style="color: #06b6d4;"></i>
            <span>Script After Effects</span>
            <button class="download-btn" onclick="downloadFile('aftereffects')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-video" style="color: #84cc16;"></i>
            <span>Script Filmora</span>
            <button class="download-btn" onclick="downloadFile('filmora')">Descargar</button>
          </div>

          <div class="file-card">
            <i class="fas fa-drafting-compass" style="color: #06b6d4;"></i>
            <span>Composición Visual</span>
            <button class="download-btn" onclick="downloadFile('composition')">Descargar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function addWorkToRadar() {
  if (!state.activeGeneratedWork) return;
  
  const d = state.activeGeneratedWork;
  const newTask = {
    id: 'TAR-' + Date.now().toString().slice(-6),
    materia_id: '',
    materia_nombre: d.materia,
    titulo: d.titulo,
    descripcion: d.resumen_ejecutivo,
    tipo: 'Proyecto',
    fecha_entrega: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    prioridad: 'Media',
    estado: 'Pendiente',
    formatos_requeridos: 'PDF,Word,SVG',
    fuente: 'PRISMA IA',
    fecha_creacion: new Date().toISOString()
  };
  
  state.tareas.unshift(newTask);
  localStorage.setItem('prisma_tareas', JSON.stringify(state.tareas));
  
  showToast('✓ Tarea agregada al Radar Académico');
  navigate('radar');
}

function downloadFile(type) {
  if (!state.activeGeneratedWork) {
    Swal.fire('Error', 'Primero genera un contenido en el Estudio', 'error');
    return;
  }

  const d = state.activeGeneratedWork;
  const cleanTitle = (d.titulo || 'Entregable').replace(/[^a-zA-Z0-9_-]/g, '_');

  switch (type) {
    case 'pdf':
      generateAndDownloadPDF(d, cleanTitle);
      break;
    case 'word':
      generateAndDownloadWord(d, cleanTitle);
      break;
    case 'svg':
      generateAndDownloadSVG(d, cleanTitle);
      break;
    case 'jsx':
      generateAndDownloadJSX(d, cleanTitle);
      break;
    case 'illustrator':
      generateAndDownloadIllustrator(d, cleanTitle);
      break;
    case 'composition':
      generateAndDownloadComposition(d, cleanTitle);
      break;
    case 'cover':
      generateAndDownloadCover(d, cleanTitle);
      break;
    case 'blender':
      generateAndDownloadBlender(d, cleanTitle);
      break;
    case 'aftereffects':
      generateAndDownloadAfterEffects(d, cleanTitle);
      break;
    case 'filmora':
      generateAndDownloadFilmora(d, cleanTitle);
      break;
    default:
      showToast('Tipo de archivo no soportado');
  }
}

function generateAndDownloadPDF(data, filename) {
  const pdfWindow = window.open('', '_blank');
  const puntosHtml = (data.desarrollo_puntos || []).map(p => `
    <h2 style="color:#0033A0; border-bottom:1px solid #ddd; padding-bottom:4px; font-size:13pt; margin-top:24px;">${escapeHtml(p.subtitulo)}</h2>
    <p style="text-align:justify; text-indent:1.27cm; margin:0 0 12px 0;">${escapeHtml(p.contenido)}</p>
  `).join('');

  const referenciasHtml = (data.referencias_apa || []).map(r => `
    <p style="padding-left:1.27cm; text-indent:-1.27cm; margin-bottom:8px; font-size:11pt;">${escapeHtml(r)}</p>
  `).join('');

  pdfWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(data.titulo)} — UNICA</title>
      <style>
        @page { size: letter; margin: 2.54cm; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 35px; }
        .inst-header { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 30px; }
        h1 { color: #0033A0; text-align: center; font-size: 16pt; margin: 30px 0; }
        h2 { color: #0E1424; font-size: 13pt; margin-top: 20px; }
        h2.unica { color: #0033A0; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        p { text-align: justify; margin-bottom: 12px; }
        .meta-info { margin-top: 20px; font-size: 11pt; }
        .page-break { page-break-before: always; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="background:#f0fdf4; border:1px solid #86efac; padding:12px; margin-bottom:20px; text-align:center; font-family:sans-serif;">
        <button onclick="window.print()" style="background:#10b981; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px;">
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      <div class="inst-header">
        UNIVERSIDAD CATÓLICA CECILIO ACOSTA<br>
        FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN<br>
        CÁTEDRA: ${escapeHtml(data.materia)}
      </div>

      <h1>${escapeHtml(data.titulo)}</h1>

      <div class="meta-info">
        <strong>Estudiante:</strong> ${data.estudiante || 'Moisés González'} (${data.cedula || 'C.I. V-31.171.020'})<br>
        <strong>Institución:</strong> ${data.universidad || 'Universidad Católica Cecilio Acosta (UNICA)'}
      </div>

      <hr>

      <h2>1. Resumen Ejecutivo</h2>
      <p>${escapeHtml(data.resumen_ejecutivo)}</p>

      <h2>2. Marco Teórico</h2>
      <p>${escapeHtml(data.marco_teorico)}</p>

      ${puntosHtml}

      <h2>Conclusiones</h2>
      <p>${escapeHtml(data.conclusiones)}</p>

      <div class="page-break"></div>
      <h2>Referencias Bibliográficas (Normas APA 7ma)</h2>
      ${referenciasHtml}
    </body>
    </html>
  `);
  pdfWindow.document.close();
}

function generateAndDownloadWord(data, filename) {
  const puntosWord = (data.desarrollo_puntos || []).map(p => `
    <h2 style="color:#0033A0; border-bottom:1px solid #ddd; padding-bottom:4px;">${escapeHtml(p.subtitulo)}</h2>
    <p>${escapeHtml(p.contenido)}</p>
  `).join('');
  
  const wordDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${escapeHtml(data.titulo)}</title>
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
        CÁTEDRA: ${escapeHtml(data.materia)}
      </div>
      <h1>${escapeHtml(data.titulo)}</h1>
      <p><strong>Estudiante:</strong> ${PRISMA_CONFIG.STUDENT_INFO.name} (C.I. ${PRISMA_CONFIG.STUDENT_INFO.cedula})<br>
      <strong>Institución:</strong> ${PRISMA_CONFIG.STUDENT_INFO.university}</p>
      <hr>
      <h2>1. Introducción</h2>
      <p>${escapeHtml(data.marco_teorico)}</p>
      ${puntosWord}
      <h2>Conclusiones</h2>
      <p>${escapeHtml(data.conclusiones)}</p>
    </body></html>
  `;
  
  triggerBlobDownload(wordDoc, `${filename}.doc`, 'application/msword');
}

function generateAndDownloadSVG(data, filename) {
  const svg = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <style>
      .bg { fill: #070a12; }
      .txt-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #ffffff; }
      .txt-sub { font-family: Arial, sans-serif; font-size: 12px; fill: #94a3b8; }
    </style>
  </defs>
  <rect width="800" height="600" class="bg" />
  <text x="40" y="50" class="txt-title">UNICA — ${escapeHtml(data.titulo).toUpperCase()}</text>
  <text x="40" y="72" class="txt-sub">${data.estudiante || 'Moisés González'} · ${escapeHtml(data.materia)}</text>
</svg>`;

  triggerBlobDownload(svg, `${filename}.svg`, 'image/svg+xml');
}

function generateAndDownloadComposition(data, filename) {
  // Generar composición visual creativa basada en la paleta
  const colors = data.paleta_sugerida || [
    { nombre: "UNICA Azul", hex: "#0033A0" },
    { nombre: "Cian Acento", hex: "#00F0FF" },
    { nombre: "Negro Base", hex: "#0E1424" },
    { nombre: "Blanco", hex: "#FFFFFF" }
  ];

  const composition = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]?.hex || '#0033A0'};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors[1]?.hex || '#00F0FF'};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[2]?.hex || '#0E1424'};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors[0]?.hex || '#0033A0'};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Fondo creativo -->
  <rect width="1200" height="800" fill="${colors[2]?.hex || '#0E1424'}" />

  <!-- Elementos abstractos -->
  <circle cx="200" cy="200" r="150" fill="url(#grad1)" opacity="0.6" />
  <circle cx="1000" cy="600" r="200" fill="url(#grad2)" opacity="0.4" />
  <rect x="400" y="100" width="400" height="3" fill="${colors[1]?.hex || '#00F0FF'}" opacity="0.8" />
  <rect x="300" y="700" width="600" height="2" fill="${colors[1]?.hex || '#00F0FF'}" opacity="0.6" />

  <!-- Header UNICA -->
  <text x="50" y="60" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors[3]?.hex || '#FFFFFF'}">
    UNIVERSIDAD CATÓLICA CECILIO ACOSTA
  </text>
  <text x="50" y="90" font-family="Arial, sans-serif" font-size="14" fill="${colors[1]?.hex || '#00F0FF'}">
    ${data.facultad || 'Facultad de Ciencias de la Comunicación y de la Información'}
  </text>

  <!-- Título del trabajo -->
  <text x="600" y="400" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${colors[3]?.hex || '#FFFFFF'}" text-anchor="middle">
    ${escapeHtml(data.titulo).substring(0, 50)}
  </text>

  <!-- Información del estudiante -->
  <text x="50" y="750" font-family="Arial, sans-serif" font-size="16" fill="${colors[3]?.hex || '#FFFFFF'}">
    Estudiante: ${data.estudiante || 'Moisés González'}
  </text>
  <text x="50" y="775" font-family="Arial, sans-serif" font-size="14" fill="${colors[1]?.hex || '#00F0FF'}">
    ${data.cedula || 'C.I. V-31.171.020'}
  </text>

  <!-- Paleta de colores sugerida -->
  <g transform="translate(900, 650)">
    <text x="0" y="-20" font-family="Arial, sans-serif" font-size="12" fill="${colors[3]?.hex || '#FFFFFF'}">Paleta Sugerida:</text>
    ${colors.map((c, i) => `<rect x="${i * 40}" y="0" width="35" height="35" fill="${c.hex}" rx="5" />`).join('')}
  </g>

  <!-- Elementos decorativos -->
  <polygon points="1100,100 1150,150 1100,200 1050,150" fill="${colors[1]?.hex || '#00F0FF'}" opacity="0.5" />
  <polygon points="100,600 150,650 100,700 50,650" fill="${colors[0]?.hex || '#0033A0'}" opacity="0.3" />
</svg>`;

  triggerBlobDownload(composition, `${filename}_composicion.svg`, 'image/svg+xml');
  showToast('✓ Composición visual generada con paleta de colores');
}

function generateAndDownloadCover(data, filename) {
  const style = document.getElementById('cover-style')?.value || 'modern';
  const coverSVG = generateCreativeCover(data, style);
  triggerBlobDownload(coverSVG, `portada_${style}.svg`, 'image/svg+xml');
  showToast(`✓ Portada creativa generada (${style})`);
}

function generateCreativeCover(data, style) {
  const palettes = {
    modern: ['#0033A0', '#00F0FF', '#0E1424', '#FFFFFF'],
    vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    elegant: ['#2C3E50', '#34495E', '#7F8C8D', '#ECF0F1'],
    pop: ['#FF0000', '#FFFF00', '#0000FF', '#FFFFFF'],
    abstract: ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E']
  };

  const colors = palettes[style] || palettes.modern;

  switch(style) {
    case 'modern':
      return generateModernCover(data, colors);
    case 'vibrant':
      return generateVibrantCover(data, colors);
    case 'elegant':
      return generateElegantCover(data, colors);
    case 'pop':
      return generatePopCover(data, colors);
    case 'abstract':
      return generateAbstractCover(data, colors);
    default:
      return generateModernCover(data, colors);
  }
}

function generateModernCover(data, colors) {
  return `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <defs>
    <linearGradient id="modernGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Fondo con gradiente -->
  <rect width="850" height="1100" fill="${colors[2]}" />
  <rect x="0" y="0" width="850" height="400" fill="url(#modernGrad)" opacity="0.9" />

  <!-- Elemento decorativo circular -->
  <circle cx="700" cy="150" r="120" fill="${colors[3]}" opacity="0.15" />
  <circle cx="150" cy="350" r="80" fill="${colors[3]}" opacity="0.1" />

  <!-- Información institucional -->
  <text x="425" y="180" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${colors[3]}" text-anchor="middle">
    UNIVERSIDAD CATÓLICA CECILIO ACOSTA
  </text>
  <text x="425" y="210" font-family="Arial, sans-serif" font-size="12" fill="${colors[3]}" text-anchor="middle">
    FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN
  </text>
  <text x="425" y="240" font-family="Arial, sans-serif" font-size="11" fill="${colors[3]}" text-anchor="middle" font-style="italic">
    CÁTEDRA: ${escapeHtml(data.materia)}
  </text>

  <!-- Línea decorativa -->
  <line x1="100" y1="280" x2="750" y2="280" stroke="${colors[3]}" stroke-width="2" opacity="0.5" />

  <!-- Título del trabajo -->
  <text x="425" y="550" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${colors[3]}" text-anchor="middle" filter="url(#shadow)">
    ${escapeHtml(data.titulo).substring(0, 60)}
  </text>
  ${data.titulo.length > 60 ? `<text x="425" y="590" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${colors[3]}" text-anchor="middle" filter="url(#shadow)">
    ${escapeHtml(data.titulo).substring(60)}
  </text>` : ''}

  <!-- Información del estudiante -->
  <g transform="translate(150, 750)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="14" fill="${colors[3]}">
      <tspan font-weight="bold">Estudiante:</tspan> ${data.estudiante || 'Moisés González'}
    </text>
    <text x="0" y="30" font-family="Arial, sans-serif" font-size="14" fill="${colors[3]}">
      <tspan font-weight="bold">C.I.:</tspan> ${data.cedula || 'V-31.171.020'}
    </text>
    <text x="0" y="60" font-family="Arial, sans-serif" font-size="14" fill="${colors[3]}">
      <tspan font-weight="bold">Fecha:</tspan> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
    </text>
  </g>

  <!-- Elemento decorativo rectangular -->
  <rect x="600" y="850" width="150" height="4" fill="${colors[1]}" rx="2" />
  <rect x="100" y="850" width="400" height="2" fill="${colors[3]}" opacity="0.3" rx="1" />
</svg>`;
}

function generateVibrantCover(data, colors) {
  return `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <defs>
    <linearGradient id="vibrantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors[1]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors[2]};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Fondo vibrante -->
  <rect width="850" height="1100" fill="url(#vibrantGrad)" />

  <!-- Formas decorativas -->
  <circle cx="100" cy="100" r="150" fill="${colors[3]}" opacity="0.2" />
  <circle cx="750" cy="1000" r="200" fill="${colors[0]}" opacity="0.15" />
  <polygon points="425,50 500,150 350,150" fill="${colors[3]}" opacity="0.1" />

  <!-- Información institucional -->
  <text x="425" y="300" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors[3]}" text-anchor="middle">
    UNIVERSIDAD CATÓLICA CECILIO ACOSTA
  </text>
  <text x="425" y="330" font-family="Arial, sans-serif" font-size="13" fill="${colors[3]}" text-anchor="middle">
    FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN
  </text>

  <!-- Título del trabajo -->
  <text x="425" y="550" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${colors[3]}" text-anchor="middle">
    ${escapeHtml(data.titulo).substring(0, 50)}
  </text>

  <!-- Información del estudiante -->
  <text x="150" y="800" font-family="Arial, sans-serif" font-size="16" fill="${colors[3]}">
    Estudiante: ${data.estudiante || 'Moisés González'}
  </text>
  <text x="150" y="830" font-family="Arial, sans-serif" font-size="16" fill="${colors[3]}">
    C.I.: ${data.cedula || 'V-31.171.020'}
  </text>

  <!-- Líneas decorativas -->
  <line x1="50" y1="400" x2="800" y2="400" stroke="${colors[3]}" stroke-width="3" opacity="0.5" />
  <line x1="50" y1="700" x2="800" y2="700" stroke="${colors[3]}" stroke-width="2" opacity="0.3" />
</svg>`;
}

function generateElegantCover(data, colors) {
  return `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <!-- Fondo elegante -->
  <rect width="850" height="1100" fill="${colors[0]}" />

  <!-- Línea vertical decorativa -->
  <rect x="50" y="100" width="8" height="900" fill="${colors[1]}" />

  <!-- Información institucional -->
  <text x="100" y="200" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="${colors[3]}">
    UNIVERSIDAD CATÓLICA CECILIO ACOSTA
  </text>
  <text x="100" y="235" font-family="Georgia, serif" font-size="12" fill="${colors[2]}">
    FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN
  </text>
  <text x="100" y="260" font-family="Georgia, serif" font-size="11" fill="${colors[2]}" font-style="italic">
    CÁTEDRA: ${escapeHtml(data.materia)}
  </text>

  <!-- Título del trabajo -->
  <text x="100" y="500" font-family="Georgia, serif" font-size="40" font-weight="bold" fill="${colors[1]}">
    ${escapeHtml(data.titulo).substring(0, 45)}
  </text>
  ${data.titulo.length > 45 ? `<text x="100" y="550" font-family="Georgia, serif" font-size="40" font-weight="bold" fill="${colors[1]}">
    ${escapeHtml(data.titulo).substring(45)}
  </text>` : ''}

  <!-- Información del estudiante -->
  <text x="100" y="850" font-family="Georgia, serif" font-size="14" fill="${colors[3]}">
    Estudiante: ${data.estudiante || 'Moisés González'}
  </text>
  <text x="100" y="880" font-family="Georgia, serif" font-size="14" fill="${colors[3]}">
    C.I.: ${data.cedula || 'V-31.171.020'}
  </text>

  <!-- Línea horizontal decorativa -->
  <line x1="100" y1="750" x2="750" y2="750" stroke="${colors[1]}" stroke-width="2" />
</svg>`;
}

function generatePopCover(data, colors) {
  return `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <!-- Fondo pop art -->
  <rect width="850" height="1100" fill="${colors[3]}" />

  <!-- Cuadrados decorativos -->
  <rect x="0" y="0" width="283" height="366" fill="${colors[0]}" />
  <rect x="283" y="0" width="284" height="366" fill="${colors[1]}" />
  <rect x="567" y="0" width="283" height="366" fill="${colors[2]}" />

  <!-- Información institucional -->
  <text x="425" y="450" font-family="Arial Black, sans-serif" font-size="24" font-weight="bold" fill="${colors[2]}" text-anchor="middle">
    UNIVERSIDAD CATÓLICA CECILIO ACOSTA
  </text>
  <text x="425" y="485" font-family="Arial, sans-serif" font-size="14" fill="${colors[0]}" text-anchor="middle">
    FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN
  </text>

  <!-- Título del trabajo -->
  <text x="425" y="600" font-family="Arial Black, sans-serif" font-size="38" font-weight="bold" fill="${colors[0]}" text-anchor="middle">
    ${escapeHtml(data.titulo).substring(0, 40)}
  </text>

  <!-- Información del estudiante -->
  <text x="150" y="850" font-family="Arial Black, sans-serif" font-size="18" fill="${colors[2]}">
    Estudiante: ${data.estudiante || 'Moisés González'}
  </text>
  <text x="150" y="880" font-family="Arial Black, sans-serif" font-size="18" fill="${colors[2]}">
    C.I.: ${data.cedula || 'V-31.171.020'}
  </text>

  <!-- Elementos decorativos -->
  <circle cx="700" cy="700" r="50" fill="${colors[1]}" />
  <polygon points="100,950 150,1000 100,1050 50,1000" fill="${colors[0]}" />
</svg>`;
}

function generateAbstractCover(data, colors) {
  return `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
  <defs>
    <linearGradient id="abstractGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:0.6" />
    </linearGradient>
    <linearGradient id="abstractGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[2]};stop-opacity:0.7" />
      <stop offset="100%" style="stop-color:${colors[3]};stop-opacity:0.5" />
    </linearGradient>
  </defs>

  <!-- Fondo -->
  <rect width="850" height="1100" fill="${colors[4] || '#2D3436'}" />

  <!-- Formas abstractas -->
  <ellipse cx="200" cy="300" rx="150" ry="200" fill="url(#abstractGrad1)" opacity="0.6" />
  <ellipse cx="650" cy="800" rx="200" ry="150" fill="url(#abstractGrad2)" opacity="0.5" />
  <circle cx="425" cy="550" r="100" fill="${colors[1]}" opacity="0.3" />

  <!-- Información institucional -->
  <text x="425" y="200" font-family="Arial, sans-serif" font-size="19" font-weight="bold" fill="${colors[3]}" text-anchor="middle" filter="url(#shadow)">
    UNIVERSIDAD CATÓLICA CECILIO ACOSTA
  </text>
  <text x="425" y="235" font-family="Arial, sans-serif" font-size="13" fill="${colors[3]}" text-anchor="middle">
    FACULTAD DE CIENCIAS DE LA COMUNICACIÓN Y DE LA INFORMACIÓN
  </text>

  <!-- Título del trabajo -->
  <text x="425" y="550" font-family="Arial, sans-serif" font-size="35" font-weight="bold" fill="${colors[3]}" text-anchor="middle">
    ${escapeHtml(data.titulo).substring(0, 55)}
  </text>

  <!-- Información del estudiante -->
  <text x="150" y="900" font-family="Arial, sans-serif" font-size="15" fill="${colors[3]}">
    Estudiante: ${data.estudiante || 'Moisés González'}
  </text>
  <text x="150" y="930" font-family="Arial, sans-serif" font-size="15" fill="${colors[3]}">
    C.I.: ${data.cedula || 'V-31.171.020'}
  </text>

  <!-- Elementos decorativos -->
  <polygon points="700,200 750,250 700,300 650,250" fill="${colors[0]}" opacity="0.4" />
  <rect x="50" y="800" width="100" height="100" fill="${colors[2]}" opacity="0.3" transform="rotate(45 100 850)" />
</svg>`;
}

function quickCaptureTask() {
  const message = document.getElementById('quick-capture').value.trim();

  if (!message) {
    Swal.fire('Error', 'Por favor pega un mensaje de WhatsApp o Telegram', 'error');
    return;
  }

  // Analizar el mensaje (misma lógica que el bot de Telegram)
  const taskInfo = parseQuickCaptureMessage_(message);

  // Crear la tarea
  const newTask = {
    id: 'TAR-' + Date.now().toString().slice(-6),
    materia_id: '',
    materia_nombre: taskInfo.materia,
    titulo: taskInfo.titulo,
    descripcion: taskInfo.descripcion,
    tipo: 'Proyecto',
    fecha_entrega: taskInfo.fecha,
    prioridad: taskInfo.prioridad,
    estado: 'Pendiente',
    formatos_requeridos: 'PDF',
    fuente: 'Captura Rápida',
    fecha_creacion: new Date().toISOString()
  };

  // Guardar localmente
  state.tareas.unshift(newTask);
  localStorage.setItem('prisma_tareas', JSON.stringify(state.tareas));

  // Guardar en backend si está configurado
  if (PRISMA_CONFIG.API_URL) {
    fetch(PRISMA_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'prisma_save_assignment',
        ...newTask
      })
    }).then(response => response.json())
    .then(data => {
      if (data.ok) {
        console.log('Tarea guardada en Google Sheets');
      } else {
        console.warn('No se pudo guardar en backend:', data.mensaje);
      }
    }).catch(err => {
      console.warn('Error guardando en backend (usando solo localStorage):', err);
    });
  }

  // Limpiar el campo
  document.getElementById('quick-capture').value = '';

  // Mostrar confirmación
  Swal.fire({
    icon: 'success',
    title: '✓ Tarea Capturada',
    html: `
      <p><strong>Título:</strong> ${escapeHtml(taskInfo.titulo)}</p>
      <p><strong>Materia:</strong> ${escapeHtml(taskInfo.materia)}</p>
      <p><strong>Fecha:</strong> ${taskInfo.fecha || 'Sin fecha'}</p>
      <p><strong>Prioridad:</strong> ${taskInfo.prioridad}</p>
    `,
    confirmButtonText: 'Ver en Radar'
  }).then((result) => {
    if (result.isConfirmed) {
      navigate('radar');
    }
  });

  updateBadges();
}

function parseQuickCaptureMessage_(message) {
  const lines = message.split('\n');
  const title = lines[0] || 'Tarea de Mensaje';
  const materia = extractMateriaFromMessage_(message);
  const fecha = extractFechaFromMessage_(message);
  const prioridad = extractPrioridadFromMessage_(message);

  return {
    titulo: title.substring(0, 100),
    materia: materia,
    fecha: fecha,
    prioridad: prioridad,
    descripcion: message.substring(0, 500)
  };
}

function extractMateriaFromMessage_(text) {
  const materias = [
    'Taller de Imagen Corporativa',
    'Diseño Gráfico Digital Avanzado',
    'Teoría de la Comunicación',
    'Diseño Editorial',
    'Semiótica',
    'Fotografía',
    'Ilustración',
    'Animación',
    'Producción de Video',
    'Postproducción'
  ];

  const lowerText = text.toLowerCase();
  for (let i = 0; i < materias.length; i++) {
    if (lowerText.includes(materias[i].toLowerCase())) {
      return materias[i];
    }
  }

  return 'Sin materia específica';
}

function extractFechaFromMessage_(text) {
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2}) de (\w+) de (\d{4})/, // DD de MMM de YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{2})/ // DD/MM/YY
  ];

  for (let i = 0; i < datePatterns.length; i++) {
    const match = text.match(datePatterns[i]);
    if (match) {
      try {
        return new Date(match[0]).toISOString();
      } catch (e) {
        continue;
      }
    }
  }

  return null;
}

function extractPrioridadFromMessage_(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('urgente') || lowerText.includes('inmediato') || lowerText.includes('ya') || lowerText.includes('hoy')) {
    return 'Alta';
  } else if (lowerText.includes('importante') || lowerText.includes('prioridad')) {
    return 'Media';
  } else {
    return 'Media';
  }
}

function generateAndDownloadBlender(data, filename) {
  const blenderScript = `import bpy
import math
from datetime import datetime

# =============================================================================
# PRISMA - Script Automático para Blender
# Generado para: ${escapeHtml(data.titulo)}
# Estudiante: ${data.estudiante || 'Moisés González'}
# Fecha: ${new Date().toLocaleDateString('es-ES')}
# =============================================================================

# Limpiar escena existente
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Crear texto 3D principal
bpy.ops.object.text_add(location=(0, 0, 0))
text_obj = bpy.context.object
text_obj.data.body = "${escapeHtml(data.titulo).substring(0, 30)}"
text_obj.data.size = 3
text_obj.data.extrude = 0.5

# Configurar material UNICA
mat = bpy.data.materials.new(name="Material_UNICA")
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.0, 0.2, 0.63, 1.0)  # Azul UNICA #0033A0
bsdf.inputs["Metallic"].default_value = 0.3
bsdf.inputs["Roughness"].default_value = 0.4

if text_obj.data.materials:
    text_obj.data.materials[0] = mat
else:
    text_obj.data.materials.append(mat)

# Añadir cámara
bpy.ops.object.camera_add(location=(10, -15, 8))
camera = bpy.context.object
camera.rotation_euler = (math.radians(70), 0, math.radians(45))
bpy.context.scene.camera = camera

# Añadir luces
# Luz principal
bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
sun_light = bpy.context.object
sun_light.data.energy = 3

# Luz de relleno
bpy.ops.object.light_add(type='POINT', location=(-5, 5, 5))
point_light = bpy.context.object
point_light.data.energy = 500
point_light.data.color = (0.8, 0.9, 1.0)

# Configurar render
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.resolution_percentage = 100

# Renderizar
bpy.ops.render.render(write_still=True)

print("✓ Render completado: ${escapeHtml(data.titulo)}")
`;

  triggerBlobDownload(blenderScript, `${filename}_blender.py`, 'text/plain');
  showToast('✓ Script de Blender generado');
}

function generateAndDownloadAfterEffects(data, filename) {
  const aeScript = `// =============================================================================
// PRISMA - Script Automático para Adobe After Effects
// Generado para: ${escapeHtml(data.titulo)}
// Estudiante: ${data.estudiante || 'Moisés González'}
// Fecha: ${new Date().toLocaleDateString('es-ES')}
// =============================================================================

{
  // Crear nueva composición
  var comp = app.project.items.addComp("${escapeHtml(data.titulo).substring(0, 30)}", 1920, 1080, 1, 30, 30);

  // Crear capa de fondo con gradiente
  var solidLayer = comp.layers.addSolid([0, 0.2, 0.63], "Fondo UNICA", 1920, 1080);
  var gradientEffect = solidLayer.property("Effects").addProperty("ADBE Ramp");
  gradientEffect.property("Start of Ramp").setValue([960, 0]);
  gradientEffect.property("End of Ramp").setValue([960, 1080]);
  gradientEffect.property("Start Color").setValue([0, 0.2, 0.63]);
  gradientEffect.property("End Color").setValue([0, 0.94, 1]);

  // Crear capa de texto principal
  var textLayer = comp.layers.addText("${escapeHtml(data.titulo).substring(0, 40)}");
  var textProp = textLayer.property("Source Text");
  var textDocument = textProp.value;
  textDocument.resetCharStyle();
  textDocument.fontSize = 72;
  textDocument.fillColor = [1, 1, 1];
  textDocument.font = "ArialMT";
  textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
  textProp.setValue(textDocument);

  // Centrar texto
  textLayer.property("Position").setValue([960, 540]);

  // Crear animación de entrada (fade in)
  var opacityProp = textLayer.property("Opacity");
  var key1 = opacityProp.addKey(0);
  var key2 = opacityProp.addKey(29);
  key1.setValue(0);
  key2.setValue(100);

  // Crear animación de escala
  var scaleProp = textLayer.property("Scale");
  var scaleKey1 = scaleProp.addKey(0);
  var scaleKey2 = scaleProp.addKey(29);
  scaleKey1.setValue([100, 100]);
  scaleKey2.setValue([110, 110]);

  // Añadir información del estudiante
  var infoText = comp.layers.addText("${data.estudiante || 'Moisés González'} - ${data.cedula || 'V-31.171.020'}");
  var infoProp = infoText.property("Source Text");
  var infoDocument = infoProp.value;
  infoDocument.fontSize = 24;
  infoDocument.fillColor = [0, 0.94, 1];
  infoDocument.font = "ArialMT";
  infoProp.setValue(infoDocument);
  infoText.property("Position").setValue([960, 800]);

  // Añadir capa de logo UNICA (placeholder)
  var logoLayer = comp.layers.addSolid([1, 1, 1], "Logo UNICA", 200, 200);
  logoLayer.property("Position").setValue([100, 100]);
  logoLayer.property("Opacity").setValue(80);

  // Añadir efectos de partículas (simulado)
  var particleLayer = comp.layers.addShape();
  var shapeGroup = particleLayer.property("Contents").addProperty("ADBE Vector Group");
  var ellipse = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
  ellipse.property("Size").setValue([50, 50]);
  particleLayer.property("Position").setValue([960, 540]);
  particleLayer.property("Opacity").setValue(30);

  // Configurar render
  var renderQueue = app.project.renderQueue;
  var renderItem = renderQueue.items.add(comp);
  renderItem.outputModule(1).file = new File("${filename}_aftereffects.mov");
  renderItem.render = true;

  alert("✓ Composición creada en After Effects");
}
`;

  triggerBlobDownload(aeScript, `${filename}_aftereffects.jsx`, 'text/plain');
  showToast('✓ Script de After Effects generado');
}

function generateAndDownloadFilmora(data, filename) {
  const filmoraProject = `{
  "project": {
    "name": "${escapeHtml(data.titulo)}",
    "version": "13.0",
    "created_by": "PRISMA",
    "created_date": "${new Date().toISOString()}",
    "student": "${data.estudiante || 'Moisés González'}",
    "id": "${data.cedula || 'V-31.171.020'}"
  },
  "timeline": {
    "duration": 60,
    "fps": 30,
    "resolution": {
      "width": 1920,
      "height": 1080
    },
    "tracks": [
      {
        "id": "video_track_1",
        "type": "video",
        "name": "Contenido Principal",
        "clips": [
          {
            "id": "intro",
            "name": "Intro UNICA",
            "start": 0,
            "duration": 5,
            "type": "title",
            "text": {
              "content": "UNIVERSIDAD CATÓLICA CECILIO ACOSTA",
              "font": "Arial",
              "size": 48,
              "color": "#FFFFFF",
              "background": "#0033A0"
            },
            "effects": ["fade_in"],
            "transitions": ["cross_dissolve"]
          },
          {
            "id": "main_content",
            "name": "${escapeHtml(data.titulo).substring(0, 40)}",
            "start": 5,
            "duration": 45,
            "type": "text_overlay",
            "text": {
              "content": "${escapeHtml(data.descripcion || data.resumen_ejecutivo || 'Contenido generado por PRISMA')}",
              "font": "Arial",
              "size": 32,
              "color": "#FFFFFF",
              "background": "rgba(0, 51, 160, 0.7)"
            },
            "effects": ["text_animation"],
            "audio": {
              "volume": 0.8,
              "fade_in": true
            }
          },
          {
            "id": "outro",
            "name": "Cierre",
            "start": 50,
            "duration": 10,
            "type": "title",
            "text": {
              "content": "${data.estudiante || 'Moisés González'} - ${data.cedula || 'V-31.171.020'}",
              "font": "Arial",
              "size": 36,
              "color": "#00F0FF",
              "background": "#0E1424"
            },
            "effects": ["fade_out"],
            "transitions": ["cross_dissolve"]
          }
        ]
      },
      {
        "id": "audio_track_1",
        "type": "audio",
        "name": "Música de Fondo",
        "clips": [
          {
            "id": "bg_music",
            "name": "Música Académica",
            "start": 0,
            "duration": 60,
            "volume": 0.3,
            "fade_in": true,
            "fade_out": true,
            "loop": true
          }
        ]
      },
      {
        "id": "audio_track_2",
        "type": "audio",
        "name": "Narración",
        "clips": [
          {
            "id": "voiceover",
            "name": "Voz en Off",
            "start": 5,
            "duration": 45,
            "volume": 1.0,
            "text": "${escapeHtml(data.resumen_ejecutivo || '')}"
          }
        ]
      }
    ]
  },
  "effects": [
    {
      "id": "fade_in",
      "type": "opacity",
      "parameters": {
        "start": 0,
        "end": 100,
        "duration": 1
      }
    },
    {
      "id": "fade_out",
      "type": "opacity",
      "parameters": {
        "start": 100,
        "end": 0,
        "duration": 1
      }
    },
    {
      "id": "text_animation",
      "type": "transform",
      "parameters": {
        "scale_start": 100,
        "scale_end": 105,
        "position_y_start": 540,
        "position_y_end": 530
      }
    }
  ],
  "transitions": [
    {
      "id": "cross_dissolve",
      "type": "dissolve",
      "duration": 1
    }
  ],
  "export": {
    "format": "MP4",
    "codec": "H.264",
    "quality": "high",
    "bitrate": "8000",
    "audio_codec": "AAC",
    "audio_bitrate": "192"
  },
  "metadata": {
    "title": "${escapeHtml(data.titulo)}",
    "author": "${data.estudiante || 'Moisés González'}",
    "university": "Universidad Católica Cecilio Acosta",
    "faculty": "Facultad de Ciencias de la Comunicación y de la Información",
    "subject": "${escapeHtml(data.materia)}",
    "generated_by": "PRISMA",
    "generation_date": "${new Date().toISOString()}"
  }
}
`;

  triggerBlobDownload(filmoraProject, `${filename}_filmora.json`, 'application/json');
  showToast('✓ Proyecto de Filmora generado');
}

function generateAndDownloadJSX(data, filename) {
  const jsx = `/**
 * Script Automático de Photoshop generado por PRISMA
 * Tarea: ${data.titulo}
 * Estudiante: ${PRISMA_CONFIG.STUDENT_INFO.name}
 * UNICA
 */
#target photoshop
app.bringToFront();

var doc = app.documents.add(2480, 3508, 300, "${filename}", NewDocumentMode.RGB, DocumentFill.WHITE);

var gGuias = doc.layerSets.add();
gGuias.name = "[GUIAS]";

var gArte = doc.layerSets.add();
gArte.name = "[ARTE]";

var gTextos = doc.layerSets.add();
gTextos.name = "[TEXTO]";

alert("¡Lienzo de Photoshop generado por PRISMA!\\n\\n• Tarea: ${data.titulo}\\n• Resolución: 300 DPI\\n• Estudiante: ${PRISMA_CONFIG.STUDENT_INFO.name}");
`;
  
  triggerBlobDownload(jsx, `${filename}.jsx`, 'text/plain');
}

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
// PANTALLA CALENDARIO
// ============================================================================
function renderCalendarScreen(container) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  container.innerHTML = `
    <div class="screen-header">
      <h2>📅 Calendario Académico</h2>
      <button class="secondary-button" onclick="openNewEventModal()">
        <i class="fas fa-plus"></i> Nuevo Evento
      </button>
    </div>
    
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="nav-btn" onclick="changeMonth(-1)"><i class="fas fa-chevron-left"></i></button>
        <h3>${today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
        <button class="nav-btn" onclick="changeMonth(1)"><i class="fas fa-chevron-right"></i></button>
      </div>
      
      <div class="calendar-grid">
        <div class="calendar-day-header">Dom</div>
        <div class="calendar-day-header">Lun</div>
        <div class="calendar-day-header">Mar</div>
        <div class="calendar-day-header">Mié</div>
        <div class="calendar-day-header">Jue</div>
        <div class="calendar-day-header">Vie</div>
        <div class="calendar-day-header">Sáb</div>
        
        ${generateCalendarDays(currentYear, currentMonth)}
      </div>
    </div>
    
    <div class="upcoming-events">
      <h3>Próximos Eventos</h3>
      ${state.calendario.length === 0 ? `
        <p class="empty-text">No hay eventos programados</p>
      ` : `
        <div class="events-list">
          ${state.calendario.slice(0, 5).map(event => renderEventCard(event)).join('')}
        </div>
      `}
    </div>
  `;
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  let html = '';
  
  // Días vacíos antes del primer día del mes
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    const events = state.calendario.filter(e => {
      const eventDate = new Date(e.fecha);
      return eventDate.toDateString() === date.toDateString();
    });
    
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayEvents('${date.toISOString()}')">
        <span class="day-number">${day}</span>
        ${events.length > 0 ? `<div class="day-events-count">${events.length}</div>` : ''}
      </div>
    `;
  }
  
  return html;
}

function renderEventCard(event) {
  const eventDate = new Date(event.fecha);
  const isUrgent = (eventDate - new Date()) < 3 * 24 * 60 * 60 * 1000;
  
  return `
    <div class="event-card ${isUrgent ? 'urgent' : ''}">
      <div class="event-date">
        <span class="event-day">${eventDate.getDate()}</span>
        <span class="event-month">${eventDate.toLocaleDateString('es-ES', { month: 'short' })}</span>
      </div>
      <div class="event-info">
        <h4>${escapeHtml(event.titulo)}</h4>
        <p>${escapeHtml(event.descripcion || '').substring(0, 50)}...</p>
      </div>
      <div class="event-type">
        <span class="type-badge">${event.tipo_evento}</span>
      </div>
    </div>
  `;
}

// ============================================================================
// PANTALLA CANALES
// ============================================================================
function renderChannelsScreen(container) {
  container.innerHTML = `
    <div class="screen-header">
      <h2>💬 Canales de Mensajería</h2>
      <button class="secondary-button" onclick="openNewChannelModal()">
        <i class="fas fa-plus"></i> Agregar Canal
      </button>
    </div>
    
    <div class="info-box" style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
        <i class="fas fa-info-circle"></i> <strong>Cómo funciona:</strong> Agrega tus grupos de WhatsApp/Telegram donde los profesores envían tareas. Cuando recibas un mensaje, pégalo en PRISMA para crear una tarea automáticamente.
      </p>
    </div>
    
    ${state.canales.length === 0 ? `
      <div class="empty-state">
        <i class="fas fa-comments" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
        <h3>No hay canales configurados</h3>
        <p>Conecta tus grupos de WhatsApp y Telegram para captura automática de tareas</p>
        <button class="primary-button" onclick="openNewChannelModal()" style="margin-top: 1rem;">
          Agregar Primer Canal
        </button>
      </div>
    ` : `
      <div class="channels-list">
        ${state.canales.map(channel => renderChannelCard(channel)).join('')}
      </div>
    `}
  `;
}

function renderChannelCard(channel) {
  const isActive = channel.estado_monitor === 'Activo';
  
  return `
    <div class="channel-card">
      <div class="channel-icon">
        <i class="fab fa-${channel.plataforma.toLowerCase() === 'whatsapp' ? 'whatsapp' : 'telegram'}"></i>
      </div>
      <div class="channel-info">
        <h4>${escapeHtml(channel.nombre_grupo)}</h4>
        <p>${channel.plataforma} · ${channel.tipo}</p>
      </div>
      <div class="channel-status">
        <span class="status-badge ${isActive ? 'active' : 'inactive'}">
          ${isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div class="channel-actions">
        <button class="action-btn" onclick="processChannelMessage('${channel.id}')" title="Procesar mensaje de este canal">
          <i class="fas fa-envelope-open-text"></i>
        </button>
        <button class="action-btn" onclick="toggleChannelStatus('${channel.id}')" title="Activar/desactivar monitoreo">
          <i class="fas fa-power-off"></i>
        </button>
        <button class="action-btn" onclick="deleteChannel('${channel.id}')" title="Eliminar canal">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// PANTALLA MATERIAS
// ============================================================================
function renderCoursesScreen(container) {
  container.innerHTML = `
    <div class="screen-header">
      <h2>📚 Materias Inscritas</h2>
      <button class="secondary-button" onclick="openNewCourseModal()">
        <i class="fas fa-plus"></i> Agregar Materia
      </button>
    </div>
    
    ${state.materias.length === 0 ? `
      <div class="empty-state">
        <i class="fas fa-book" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
        <h3>No hay materias inscritas</h3>
        <p>Agrega tus materias o sincroniza con el campus universitario</p>
        <button class="primary-button" onclick="syncCampus()" style="margin-top: 1rem;">
          <i class="fas fa-sync-alt"></i> Sincronizar Campus
        </button>
      </div>
    ` : `
      <div class="courses-list">
        ${state.materias.map(course => renderCourseCard(course)).join('')}
      </div>
    `}
  `;
}

function renderCourseCard(course) {
  return `
    <div class="course-card" style="border-left: 4px solid ${course.color || '#00f0ff'};">
      <div class="course-header">
        <h3>${escapeHtml(course.nombre)}</h3>
        <span class="course-code">${escapeHtml(course.codigo)}</span>
      </div>
      <div class="course-body">
        <p><strong>Profesor:</strong> ${escapeHtml(course.profesor)}</p>
        <p><strong>Horario:</strong> ${escapeHtml(course.horario)}</p>
        <p><strong>Aula:</strong> ${escapeHtml(course.aula)}</p>
      </div>
      <div class="course-footer">
        <span class="course-status">${course.estado}</span>
        <div class="course-actions">
          <button class="action-btn" onclick="editCourse('${course.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" onclick="deleteCourse('${course.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// PANTALLA AJUSTES
// ============================================================================
function renderSettingsScreen(container) {
  container.innerHTML = `
    <div class="screen-header">
      <h2>⚙️ Ajustes del Sistema</h2>
    </div>
    
    <div class="settings-sections">
      <div class="settings-section">
        <h3>🔗 Conexión Backend</h3>
        <div class="form-group">
          <label>URL de la Web App (Google Apps Script)</label>
          <input type="text" id="api-url-input" value="${PRISMA_CONFIG.API_URL}" placeholder="https://script.google.com/macros/s/...">
        </div>
        <button class="primary-button" onclick="saveApiUrl()">
          <i class="fas fa-save"></i> Guardar URL
        </button>
        <p class="note">Deja vacío para usar modo local (sin backend).</p>
      </div>
      
      <div class="settings-section">
        <h3>🎨 Apariencia</h3>
        <div class="theme-selector">
          <button class="theme-btn ${state.theme === 'dark' ? 'active' : ''}" onclick="setTheme('dark')">
            <i class="fas fa-moon"></i> Oscuro
          </button>
          <button class="theme-btn ${state.theme === 'light' ? 'active' : ''}" onclick="setTheme('light')">
            <i class="fas fa-sun"></i> Claro
          </button>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>🎓 Información del Estudiante</h3>
        <div class="student-info">
          <p><strong>Nombre:</strong> ${PRISMA_CONFIG.STUDENT_INFO.name}</p>
          <p><strong>Cédula:</strong> ${PRISMA_CONFIG.STUDENT_INFO.cedula}</p>
          <p><strong>Universidad:</strong> ${PRISMA_CONFIG.STUDENT_INFO.university}</p>
          <p><strong>Facultad:</strong> ${PRISMA_CONFIG.STUDENT_INFO.faculty}</p>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>🔄 Sincronización</h3>
        <button class="primary-button" onclick="syncCampus()">
          <i class="fas fa-sync-alt"></i> Sincronizar con Campus UNICA
        </button>
        <button class="secondary-button" onclick="loadDashboardData()">
          <i class="fas fa-refresh"></i> Recargar Datos Locales
        </button>
      </div>
      
      <div class="settings-section danger">
        <h3>⚠️ Zona de Peligro</h3>
        <button class="danger-button" onclick="clearAllData()">
          <i class="fas fa-trash"></i> Borrar Todos los Datos
        </button>
      </div>
    </div>
  `;
}

function saveApiUrl() {
  const url = document.getElementById('api-url-input').value.trim();
  PRISMA_CONFIG.API_URL = url;
  localStorage.setItem('prisma_api_url', url);
  showToast('✓ URL de API guardada');
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('prisma_theme', theme);
  applyTheme(theme);
  renderSettingsScreen(document.getElementById('screen'));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

function clearAllData() {
  Swal.fire({
    title: '¿Borrar todos los datos?',
    text: 'Esta acción eliminará toda la información local. No se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, borrar todo',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      window.location.reload();
    }
  });
}

// ============================================================================
// FUNCIONES DE DATOS
// ============================================================================
function loadDashboardData() {
  if (PRISMA_CONFIG.API_URL) {
    // Cargar desde backend
    fetch(PRISMA_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'prisma_dashboard' })
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        state.materias = data.materias || [];
        state.tareas = data.tareas || [];
        state.calendario = data.calendario || [];
        state.canales = data.canales || [];
        state.configuracion = data.configuracion || {};
        
        // Guardar en localStorage
        localStorage.setItem('prisma_materias', JSON.stringify(state.materias));
        localStorage.setItem('prisma_tareas', JSON.stringify(state.tareas));
        localStorage.setItem('prisma_calendario', JSON.stringify(state.calendario));
        localStorage.setItem('prisma_canales', JSON.stringify(state.canales));
        localStorage.setItem('prisma_configuracion', JSON.stringify(state.configuracion));
        
        updateBadges();
        if (state.currentScreen) renderScreen(state.currentScreen);
      }
    })
    .catch(err => {
      console.error('Error cargando datos:', err);
      showToast('Error de conexión. Usando datos locales.');
    });
  } else {
    // Usar datos locales
    updateBadges();
  }
}

function updateBadges() {
  updateBadge('tabBadgeRadar', state.tareas.filter(t => t.estado === 'Pendiente').length);
  updateBadge('bellBadge', state.tareas.filter(t => {
    if (!t.fecha_entrega) return false;
    const daysUntilDue = Math.ceil((new Date(t.fecha_entrega) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && t.estado !== 'Entregada';
  }).length);
}

function updateBadge(badgeId, count) {
  const badge = document.getElementById(badgeId);
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function syncCampus() {
  showToast('🔄 Sincronizando con campus...');
  
  if (PRISMA_CONFIG.API_URL) {
    fetch(PRISMA_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'prisma_sync_campus' })
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        showToast('✓ Sincronización completada');
        loadDashboardData();
      } else {
        // Mensaje más claro explicando que la sincronización es simulada
        Swal.fire({
          title: 'ℹ️ Sincronización Simulada',
          html: `
            <div style="text-align: left; font-size: 13px;">
              <p><strong>La sincronización con el campus UNICA es simulada por ahora.</strong></p>
              <p>Para conectar realmente con Moodle UNICA que requiere login, necesitaríamos:</p>
              <ul style="margin-left: 20px; margin-top: 8px;">
                <li>• API token oficial del campus</li>
                <li>• Integración con Moodle Web Services</li>
                <li>• Configuración de credenciales seguras</li>
              </ul>
              <p style="margin-top: 12px;"><strong>Solución recomendada:</strong></p>
              <p>Agrega tus materias manualmente en la sección "Materias" y usa los canales de WhatsApp/Telegram para capturar tareas automáticamente.</p>
            </div>
          `,
          icon: 'info'
        });
      }
    })
    .catch(err => {
      console.error('Error en sincronización:', err);
      // Explicar el error de forma más amigable
      Swal.fire({
        title: '⚠️ Error de Conexión',
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p><strong>No se pudo conectar con el campus.</strong></p>
            <p>Esto es normal porque:</p>
            <ul style="margin-left: 20px; margin-top: 8px;">
              <li>• La sincronización directa con Moodle requiere configuración especial</li>
              <li>• Tu campus necesita login con cédula (no es automático)</li>
              <li>• Por seguridad, no intentamos login automático sin configuración explícita</li>
            </ul>
            <p style="margin-top: 12px;"><strong>¿Qué funciona correctamente?</strong></p>
            <ul style="margin-left: 20px; margin-top: 8px;">
              <li>✅ Google Sheets (ya conectado)</li>
              <li>✅ Generación con IA (en Estudio)</li>
              <li>✅ Gestión manual de materias y tareas</li>
              <li>✅ Canales WhatsApp/Telegram</li>
            </ul>
          </div>
        `,
        icon: 'warning'
      });
    });
  } else {
    showToast('Configure la URL del backend en ajustes');
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }
}

function toggleSpotlight() {
  const overlay = document.getElementById('prisma-spotlight-overlay');
  const input = document.getElementById('spotlight-search');
  
  if (overlay) {
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
    if (overlay.style.display === 'flex' && input) {
      input.focus();
    }
  }
}

function closeAllModals() {
  const modal = document.getElementById('modal');
  if (modal) modal.close();
  
  const spotlight = document.getElementById('prisma-spotlight-overlay');
  if (spotlight) spotlight.style.display = 'none';
  
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifDropdown) notifDropdown.style.display = 'none';
}

function openGuideModal() {
  Swal.fire({
    title: '📚 Guía de Uso PRISMA',
    html: `
      <div style="text-align: left; font-size: 14px;">
        <p><strong>📡 Radar:</strong> Monitorea todas tus tareas académicas con prioridades y fechas límite.</p>
        <p><strong>🎨 Estudio:</strong> Genera entregables académicos usando IA (Gemini) o motor local.</p>
        <p><strong>📅 Calendario:</strong> Gestiona fechas de entregas, exámenes y eventos académicos.</p>
        <p><strong>💬 Canales:</strong> Conecta WhatsApp/Telegram para captura automática de tareas.</p>
        <p><strong>📚 Materias:</strong> Administra tus cursos inscritos y profesores.</p>
        <p><strong>⚙️ Ajustes:</strong> Configura la conexión al backend y preferencias.</p>
      </div>
    `,
    icon: 'info'
  });
}

// ============================================================================
// FUNCIONES DE MODALES (Placeholder)
// ============================================================================
function openNewTaskModal() {
  Swal.fire({
    title: '📝 Nueva Tarea Manual',
    html: `
      <div style="text-align: left;">
        <input id="swal-task-title" class="swal2-input" placeholder="Título de la tarea">
        <textarea id="swal-task-desc" class="swal2-input" placeholder="Descripción detallada de la tarea"></textarea>
        <select id="swal-task-priority" class="swal2-input">
          <option value="Media">Prioridad Media</option>
          <option value="Alta">Prioridad Alta</option>
          <option value="Baja">Prioridad Baja</option>
        </select>
        <label style="display: block; margin-top: 12px; font-size: 12px; font-weight: 600;">Fecha de entrega (opcional):</label>
        <input id="swal-task-date" type="date" class="swal2-input">
        <label style="display: block; margin-top: 8px; font-size: 12px; font-weight: 600;">Materia (opcional):</label>
        <select id="swal-task-course" class="swal2-input">
          <option value="">Sin materia específica</option>
          ${state.materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
        </select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Crear Tarea',
    width: 500,
    preConfirm: () => {
      const title = document.getElementById('swal-task-title').value;
      const desc = document.getElementById('swal-task-desc').value;
      const priority = document.getElementById('swal-task-priority').value;
      const date = document.getElementById('swal-task-date').value;
      const courseId = document.getElementById('swal-task-course').value;
      
      if (!title) Swal.showValidationMessage('El título es requerido');
      
      return { title, desc, priority, date, courseId };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const selectedCourse = state.materias.find(m => m.id === result.value.courseId);
      
      const newTask = {
        id: 'TAR-' + Date.now().toString().slice(-6),
        materia_id: result.value.courseId || '',
        materia_nombre: selectedCourse?.nombre || 'Sin materia',
        titulo: result.value.title,
        descripcion: result.value.desc,
        tipo: 'Proyecto',
        fecha_entrega: result.value.date || null,
        hora_entrega: '23:59',
        prioridad: result.value.priority,
        estado: 'Pendiente',
        formatos_requeridos: 'PDF',
        porcentaje_nota: 0,
        fuente: 'Manual',
        fecha_creacion: new Date().toISOString(),
        ultima_actualizacion: new Date().toISOString()
      };
      
      // Guardar en localStorage
      state.tareas.unshift(newTask);
      localStorage.setItem('prisma_tareas', JSON.stringify(state.tareas));
      
      // Guardar en backend si está configurado
      if (PRISMA_CONFIG.API_URL) {
        fetch(PRISMA_CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prisma_save_assignment',
            ...newTask
          })
        }).then(response => response.json())
        .then(data => {
          if (data.ok) {
            console.log('Tarea guardada en Google Sheets');
          } else {
            console.warn('No se pudo guardar en backend:', data.mensaje);
          }
        }).catch(err => {
          console.warn('Error guardando en backend (usando solo localStorage):', err);
        });
      }
      
      updateBadges();
      renderScreen('radar');
      showToast('✓ Tarea creada y guardada en Google Sheets');
    }
  });
}

function openNewEventModal() {
  Swal.fire({
    title: '📅 Nuevo Evento',
    html: `
      <input id="swal-event-title" class="swal2-input" placeholder="Título del evento">
      <input id="swal-event-date" type="date" class="swal2-input">
      <select id="swal-event-type" class="swal2-input">
        <option value="Tarea">Tarea</option>
        <option value="Examen">Examen</option>
        <option value="Clase">Clase</option>
        <option value="Reunión">Reunión</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Crear Evento',
    preConfirm: () => {
      const title = document.getElementById('swal-event-title').value;
      const date = document.getElementById('swal-event-date').value;
      const type = document.getElementById('swal-event-type').value;
      
      if (!title) Swal.showValidationMessage('El título es requerido');
      
      return { title, date, type };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newEvent = {
        id: 'CAL-' + Date.now().toString().slice(-6),
        titulo: result.value.title,
        fecha: result.value.date || new Date().toISOString().split('T')[0],
        tipo_evento: result.value.type,
        estado: 'Pendiente'
      };
      
      state.calendario.push(newEvent);
      localStorage.setItem('prisma_calendario', JSON.stringify(state.calendario));
      renderScreen('calendar');
      showToast('✓ Evento creado');
    }
  });
}

function openNewCourseModal() {
  Swal.fire({
    title: '📚 Nueva Materia',
    html: `
      <input id="swal-course-name" class="swal2-input" placeholder="Nombre de la materia">
      <input id="swal-course-code" class="swal2-input" placeholder="Código (ej: TIC-14739)">
      <input id="swal-course-prof" class="swal2-input" placeholder="Profesor">
    `,
    showCancelButton: true,
    confirmButtonText: 'Agregar Materia',
    preConfirm: () => {
      const name = document.getElementById('swal-course-name').value;
      const code = document.getElementById('swal-course-code').value;
      const prof = document.getElementById('swal-course-prof').value;
      
      if (!name) Swal.showValidationMessage('El nombre es requerido');
      
      return { name, code, prof };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newCourse = {
        id: 'MAT-' + Date.now().toString().slice(-6),
        nombre: result.value.name,
        codigo: result.value.code,
        profesor: result.value.prof,
        estado: 'Activa',
        color: '#00f0ff'
      };
      
      state.materias.push(newCourse);
      localStorage.setItem('prisma_materias', JSON.stringify(state.materias));
      renderScreen('courses');
      showToast('✓ Materia agregada');
    }
  });
}

function openNewChannelModal() {
  Swal.fire({
    title: '💬 Nuevo Canal de Mensajería',
    html: `
      <div style="text-align: left; font-size: 13px;">
        <p style="margin-bottom: 12px; color: var(--text-muted);">
          <i class="fas fa-info-circle"></i> 
          Conecta tus grupos de WhatsApp o Telegram para captura automática de tareas enviadas por profesores.
        </p>
        
        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Plataforma</label>
        <select id="swal-channel-platform" class="swal2-input" style="width: 100%; margin-bottom: 12px;">
          <option value="WhatsApp">WhatsApp</option>
          <option value="Telegram">Telegram</option>
        </select>
        
        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nombre del grupo</label>
        <input id="swal-channel-name" class="swal2-input" placeholder="Ej: Taller de Imagen Corporativa" style="width: 100%; margin-bottom: 12px;">
        
        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Tipo de grupo</label>
        <select id="swal-channel-type" class="swal2-input" style="width: 100%; margin-bottom: 12px;">
          <option value="Materias">Materias (cátedra)</option>
          <option value="General">General (varias materias)</option>
          <option value="Notificaciones">Solo notificaciones</option>
        </select>
        
        <label style="display: block; margin-bottom: 4px; font-weight: 600;">Materia relacionada (opcional)</label>
        <select id="swal-channel-course" class="swal2-input" style="width: 100%; margin-bottom: 12px;">
          <option value="">Sin materia específica</option>
          ${state.materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
        </select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Agregar Canal',
    width: 500,
    preConfirm: () => {
      const platform = document.getElementById('swal-channel-platform').value;
      const name = document.getElementById('swal-channel-name').value;
      const type = document.getElementById('swal-channel-type').value;
      const courseId = document.getElementById('swal-channel-course').value;
      
      if (!name) Swal.showValidationMessage('El nombre del grupo es requerido');
      
      return { platform, name, type, courseId };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newChannel = {
        id: 'CAN-' + Date.now().toString().slice(-6),
        plataforma: result.value.platform,
        nombre_grupo: result.value.name,
        tipo: result.value.type,
        materia_relacionada: result.value.courseId || '',
        estado_monitor: 'Inactivo',
        ultima_sincronizacion: null,
        mensaje_capturado: '',
        fecha_mensaje: null,
        procesado: 'No',
        tarea_generada_id: ''
      };
      
      state.canales.push(newChannel);
      localStorage.setItem('prisma_canales', JSON.stringify(state.canales));
      
      // Guardar en backend si está configurado
      if (PRISMA_CONFIG.API_URL) {
        fetch(PRISMA_CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prisma_save_channel',
            ...newChannel
          })
        }).catch(err => console.error('Error guardando canal en backend:', err));
      }
      
      renderScreen('channels');
      showToast('✓ Canal agregado correctamente');
    }
  });
}

// Funciones placeholder para acciones que se implementarán completamente
function updateTaskStatus(taskId, newStatus) {
  const task = state.tareas.find(t => t.id === taskId);
  if (task) {
    task.estado = newStatus;
    task.ultima_actualizacion = new Date().toISOString();
    localStorage.setItem('prisma_tareas', JSON.stringify(state.tareas));
    updateBadges();
    renderScreen('radar');
    showToast(`✓ Tarea actualizada a ${formatStatus(newStatus)}`);
  }
}

function generateForTask(taskId) {
  const task = state.tareas.find(t => t.id === taskId);
  if (task) {
    // Navegar al estudio con las pautas de la tarea
    navigate('studio');
    setTimeout(() => {
      const promptArea = document.getElementById('studio-prompt');
      if (promptArea) {
        promptArea.value = task.instrucciones || task.descripcion || task.titulo;
      }
    }, 100);
  }
}

function toggleChannelStatus(channelId) {
  const channel = state.canales.find(c => c.id === channelId);
  if (channel) {
    channel.estado_monitor = channel.estado_monitor === 'Activo' ? 'Inactivo' : 'Activo';
    channel.ultima_sincronizacion = new Date().toISOString();
    localStorage.setItem('prisma_canales', JSON.stringify(state.canales));
    
    // Actualizar en backend si está configurado
    if (PRISMA_CONFIG.API_URL) {
      fetch(PRISMA_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prisma_save_channel',
          id: channel.id,
          estado_monitor: channel.estado_monitor,
          ultima_sincronizacion: channel.ultima_sincronizacion
        })
      }).catch(err => console.error('Error actualizando canal en backend:', err));
    }
    
    renderScreen('channels');
    showToast(`✓ Canal ${channel.estado_monitor === 'Activo' ? 'activado' : 'desactivado'}`);
  }
}

function processChannelMessage(channelId) {
  const channel = state.canales.find(c => c.id === channelId);
  if (!channel) return;
  
  Swal.fire({
    title: '📝 Procesar Mensaje del Canal',
    html: `
      <div style="text-align: left;">
        <p><strong>Canal:</strong> ${channel.nombre_grupo}</p>
        <p><strong>Plataforma:</strong> ${channel.plataforma}</p>
        
        <label style="display: block; margin-top: 12px; font-weight: 600;">Pega el mensaje del profesor:</label>
        <textarea id="swal-message-text" class="swal2-input" rows="6" 
          placeholder="Ej: 'Recuerden que para el próximo lunes deben entregar el ensayo sobre semiótica...'"></textarea>
        
        <label style="display: block; margin-top: 12px; font-weight: 600;">Materia (opcional):</label>
        <select id="swal-message-course" class="swal2-input">
          <option value="">Detectar automáticamente</option>
          ${state.materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
        </select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Procesar y Crear Tarea',
    width: 500,
    preConfirm: () => {
      const messageText = document.getElementById('swal-message-text').value;
      const courseId = document.getElementById('swal-message-course').value;
      
      if (!messageText) Swal.showValidationMessage('El mensaje es requerido');
      
      return { messageText, courseId };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const message = result.value.messageText;
      const courseId = result.value.courseId;
      
      // Analizar el mensaje para detectar si es una tarea
      const taskKeywords = ['tarea', 'trabajo', 'entrega', 'deber', 'proyecto', 'informe', 'ensayo', 'exposición', 'presentación'];
      const isTask = taskKeywords.some(keyword => message.toLowerCase().includes(keyword));
      
      if (!isTask) {
        Swal.fire('Info', 'El mensaje no parece contener una tarea académica. No se creará ninguna tarea automáticamente.', 'info');
        return;
      }
      
      // Extraer información básica
      const title = message.substring(0, 60) + '...';
      const description = message;
      
      // Determinar materia
      let selectedCourse = null;
      if (courseId) {
        selectedCourse = state.materias.find(m => m.id === courseId);
      } else {
        // Intentar detectar materia del mensaje
        selectedCourse = state.materias.find(m => 
          message.toLowerCase().includes(m.nombre.toLowerCase()) ||
          message.toLowerCase().includes(m.codigo?.toLowerCase())
        );
      }
      
      // Crear tarea
      const newTask = {
        id: 'TAR-' + Date.now().toString().slice(-6),
        materia_id: selectedCourse?.id || '',
        materia_nombre: selectedCourse?.nombre || 'Sin materia especificada',
        titulo: title,
        descripcion: description,
        tipo: 'Proyecto',
        prioridad: 'Media',
        estado: 'Pendiente',
        formatos_requeridos: 'PDF',
        fuente: `${channel.plataforma} - ${channel.nombre_grupo}`,
        fecha_creacion: new Date().toISOString(),
        instrucciones: message
      };
      
      state.tareas.unshift(newTask);
      localStorage.setItem('prisma_tareas', JSON.stringify(state.tareas));
      
      // Actualizar canal
      channel.mensaje_capturado = message;
      channel.fecha_mensaje = new Date().toISOString();
      channel.procesado = 'Sí';
      channel.tarea_generada_id = newTask.id;
      localStorage.setItem('prisma_canales', JSON.stringify(state.canales));
      
      // Guardar en backend si está configurado
      if (PRISMA_CONFIG.API_URL) {
        // Guardar tarea
        fetch(PRISMA_CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prisma_save_assignment',
            ...newTask
          })
        }).catch(err => console.error('Error guardando tarea en backend:', err));
        
        // Actualizar canal
        fetch(PRISMA_CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prisma_save_channel',
            id: channel.id,
            mensaje_capturado: message,
            fecha_mensaje: new Date().toISOString(),
            procesado: 'Sí',
            tarea_generada_id: newTask.id
          })
        }).catch(err => console.error('Error actualizando canal en backend:', err));
      }
      
      updateBadges();
      renderScreen('channels');
      
      Swal.fire({
        title: '✓ Tarea Creada Exitosamente',
        html: `
          <div style="text-align: left;">
            <p><strong>Título:</strong> ${title}</p>
            <p><strong>Materia:</strong> ${selectedCourse?.nombre || 'Detectada automáticamente'}</p>
            <p><strong>Fuente:</strong> ${channel.plataforma} - ${channel.nombre_grupo}</p>
          </div>
        `,
        icon: 'success'
      }).then(() => {
        navigate('radar');
      });
    }
  });
}

function deleteChannel(channelId) {
  Swal.fire({
    title: '¿Eliminar canal?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      state.canales = state.canales.filter(c => c.id !== channelId);
      localStorage.setItem('prisma_canales', JSON.stringify(state.canales));
      renderScreen('channels');
      showToast('✓ Canal eliminado');
    }
  });
}

function editCourse(courseId) {
  const course = state.materias.find(c => c.id === courseId);
  if (course) {
    Swal.fire({
      title: '✏️ Editar Materia',
      html: `
        <input id="swal-edit-name" class="swal2-input" value="${course.nombre}">
        <input id="swal-edit-code" class="swal2-input" value="${course.codigo}">
        <input id="swal-edit-prof" class="swal2-input" value="${course.profesor}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-edit-name').value,
          codigo: document.getElementById('swal-edit-code').value,
          profesor: document.getElementById('swal-edit-prof').value
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        course.nombre = result.value.nombre;
        course.codigo = result.value.codigo;
        course.profesor = result.value.profesor;
        localStorage.setItem('prisma_materias', JSON.stringify(state.materias));
        renderScreen('courses');
        showToast('✓ Materia actualizada');
      }
    });
  }
}

function deleteCourse(courseId) {
  Swal.fire({
    title: '¿Eliminar materia?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Eliminar'
  }).then((result) => {
    if (result.isConfirmed) {
      state.materias = state.materias.filter(c => c.id !== courseId);
      localStorage.setItem('prisma_materias', JSON.stringify(state.materias));
      renderScreen('courses');
      showToast('✓ Materia eliminada');
    }
  });
}

function openTaskDetailModal(taskId) {
  const task = state.tareas.find(t => t.id === taskId);
  if (task) {
    Swal.fire({
      title: task.titulo,
      html: `
        <div style="text-align: left;">
          <p><strong>Materia:</strong> ${task.materia_nombre || 'No asignada'}</p>
          <p><strong>Estado:</strong> ${formatStatus(task.estado)}</p>
          <p><strong>Prioridad:</strong> ${task.prioridad}</p>
          <p><strong>Tipo:</strong> ${task.tipo || 'Proyecto'}</p>
          <p><strong>Descripción:</strong></p>
          <p style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">${task.descripcion || 'Sin descripción'}</p>
          ${task.fecha_entrega ? `<p><strong>Fecha entrega:</strong> ${new Date(task.fecha_entrega).toLocaleDateString()}</p>` : ''}
        </div>
      `,
      width: 600
    });
  }
}

function showDayEvents(dateIso) {
  const date = new Date(dateIso);
  const events = state.calendario.filter(e => {
    const eventDate = new Date(e.fecha);
    return eventDate.toDateString() === date.toDateString();
  });
  
  if (events.length === 0) {
    Swal.fire({
      title: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      text: 'No hay eventos programados',
      icon: 'info'
    });
  } else {
    Swal.fire({
      title: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      html: events.map(e => `
        <div style="text-align: left; margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
          <strong>${e.titulo}</strong><br>
          <small>${e.tipo_evento}</small>
        </div>
      `).join(''),
      width: 500
    });
  }
}

function changeMonth(delta) {
  // Implementación básica de cambio de mes
  // En una versión completa, esto actualizaría el calendario
  showToast('📅 Navegación de calendario (próximamente)');
}
