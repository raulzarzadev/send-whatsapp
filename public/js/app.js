// Configuration
const API_BASE_URL = window.location.origin + '/api'

// Get API Key from sessionStorage (más seguro que localStorage)
function getApiKey() {
  const key = sessionStorage.getItem('whatsapp_api_key')
  // Si no hay key en sessionStorage, redirigir a configuración
  if (!key && !window.location.pathname.includes('config.html')) {
    window.location.href = '/config.html'
    return ''
  }

  return key || 'change-me-in-production-use-a-strong-secret-key'
}

// Utility Functions
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast')
  const bgColor =
    type === 'success'
      ? 'bg-green-600'
      : type === 'error'
      ? 'bg-red-600'
      : 'bg-blue-600'
  const icon =
    type === 'success'
      ? 'fa-check-circle'
      : type === 'error'
      ? 'fa-exclamation-circle'
      : 'fa-info-circle'

  toast.innerHTML = `
        <div class="${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 fade-in">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `
  toast.classList.remove('hidden')

  setTimeout(() => {
    toast.classList.add('hidden')
  }, 3000)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('es-MX')
}

function getStatusBadge(status) {
  const statusConfig = {
    connecting: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: 'fa-circle-notch fa-spin',
      text: 'Conectando'
    },
    qr: {
      color: 'bg-blue-100 text-blue-800',
      icon: 'fa-qrcode',
      text: 'Esperando QR'
    },
    connected: {
      color: 'bg-green-100 text-green-800',
      icon: 'fa-check-circle',
      text: 'Conectado'
    },
    disconnected: {
      color: 'bg-red-100 text-red-800',
      icon: 'fa-times-circle',
      text: 'Desconectado'
    }
  }

  const config = statusConfig[status] || statusConfig.disconnected
  return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}">
            <i class="fas ${config.icon} mr-2"></i>
            ${config.text}
        </span>
    `
}

function formatErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

// API Functions
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey()
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)

    // Si hay error 401, redirigir a configuración
    if (error.message && error.message.includes('Unauthorized')) {
      if (!window.location.pathname.includes('config.html')) {
        showToast('API Key inválida. Redirigiendo a configuración...', 'error')
        setTimeout(() => {
          window.location.href = '/config.html'
        }, 2000)
      }
    }

    throw error
  }
}

// Check API Status
async function checkApiStatus() {
  try {
    await apiRequest('/health')
    document.getElementById('api-status').innerHTML =
      '<i class="fas fa-check-circle text-green-300"></i> Conectado'
  } catch (error) {
    document.getElementById('api-status').innerHTML =
      '<i class="fas fa-times-circle text-red-300"></i> Desconectado'
  }
}

// Load Sessions
async function loadSessions() {
  try {
    const response = await apiRequest('/sessions')
    const sessions = response.data

    updateStats(sessions)
    renderSessions(sessions)
    updateSessionSelect(sessions)
  } catch (error) {
    showToast('Error al cargar sesiones: ' + error.message, 'error')
  }
}

function updateStats(sessions) {
  const total = sessions.length
  const connected = sessions.filter((s) => s.status === 'connected').length
  const qr = sessions.filter((s) => s.status === 'qr').length
  const disconnected = sessions.filter(
    (s) => s.status === 'disconnected'
  ).length

  document.getElementById('total-sessions').textContent = total
  document.getElementById('connected-sessions').textContent = connected
  document.getElementById('qr-sessions').textContent = qr
  document.getElementById('disconnected-sessions').textContent = disconnected
}

function renderSessions(sessions) {
  const container = document.getElementById('sessions-container')

  if (sessions.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-inbox text-6xl mb-4"></i>
                <p class="text-lg">No hay sesiones aún</p>
                <p class="text-sm">Crea tu primera sesión para comenzar</p>
            </div>
        `
    return
  }

  container.innerHTML = sessions
    .map(
      (session) => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <h3 class="font-semibold text-gray-800">
                            <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                            ${session.clientId}
                        </h3>
                        ${getStatusBadge(session.status)}
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div>
                            <i class="fas fa-fingerprint text-gray-400 w-5"></i>
                            <span class="font-mono text-xs">${
                              session.sessionId
                            }</span>
                        </div>
                        ${
                          session.phone
                            ? `
                            <div>
                                <i class="fas fa-phone text-gray-400 w-5"></i>
                                ${session.phone}
                            </div>
                        `
                            : ''
                        }
                        <div>
                            <i class="fas fa-clock text-gray-400 w-5"></i>
                            ${formatDate(session.createdAt)}
                        </div>
                        <div>
                            <i class="fas fa-heartbeat text-gray-400 w-5"></i>
                            ${formatDate(session.lastActivity)}
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        ${
                          session.status === 'qr' ||
                          session.status === 'connecting'
                            ? `
                            <button 
                                onclick="showQRCode('${session.sessionId}')"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition duration-200 flex items-center space-x-1"
                            >
                                <i class="fas fa-qrcode"></i>
                                <span>Ver QR</span>
                            </button>
                        `
                            : ''
                        }
                        
                        <button 
                            onclick="deleteSession('${session.sessionId}')"
                            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition duration-200 flex items-center space-x-1"
                        >
                            <i class="fas fa-trash"></i>
                            <span>Eliminar</span>
                        </button>
                        
                        <button 
                            onclick="refreshSession('${session.sessionId}')"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition duration-200 flex items-center space-x-1"
                        >
                            <i class="fas fa-sync-alt"></i>
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join('')
}

function updateSessionSelect(sessions) {
  const select = document.getElementById('message-session-id')
  const connectedSessions = sessions.filter((s) => s.status === 'connected')

  // Guardar la selección actual
  const currentValue = select.value

  // Crear el nuevo HTML
  const newHTML =
    '<option value="">Selecciona una sesión</option>' +
    connectedSessions
      .map(
        (session) => `
            <option value="${session.sessionId}">
                ${session.clientId} - ${session.phone || session.sessionId}
            </option>
        `
      )
      .join('')

  // Solo actualizar si el contenido cambió (para no perder el foco)
  if (select.innerHTML !== newHTML) {
    select.innerHTML = newHTML

    // Restaurar la selección si todavía existe
    if (
      currentValue &&
      connectedSessions.some((s) => s.sessionId === currentValue)
    ) {
      select.value = currentValue
    }
  }
}

// Create Session
document
  .getElementById('create-session-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault()

    const clientId = document.getElementById('client-id').value
    const sessionId = document.getElementById('session-id').value

    try {
      const body = { clientId }
      if (sessionId) body.sessionId = sessionId

      const response = await apiRequest('/sessions', 'POST', body)
      showToast('Sesión creada exitosamente', 'success')

      document.getElementById('create-session-form').reset()
      await loadSessions()

      // Auto-show QR if available
      setTimeout(() => showQRCode(response.data.sessionId), 1000)
    } catch (error) {
      showToast('Error al crear sesión: ' + error.message, 'error')
    }
  })

// Send Message
document
  .getElementById('send-message-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault()

    const sessionId = document.getElementById('message-session-id').value
    const to = document.getElementById('message-to').value
    const message = document.getElementById('message-text').value

    try {
      await apiRequest('/messages/send', 'POST', { sessionId, to, message })
      showToast('Mensaje enviado exitosamente', 'success')
      document.getElementById('send-message-form').reset()
    } catch (error) {
      showToast('Error al enviar mensaje: ' + error.message, 'error')
    }
  })

// Show QR Code
async function showQRCode(sessionId) {
  const modal = document.getElementById('qr-modal')
  const container = document.getElementById('qr-code-container')

  modal.classList.remove('hidden')
  container.innerHTML = `
        <div class="flex items-center justify-center h-64">
            <i class="fas fa-circle-notch fa-spin text-4xl text-gray-400"></i>
        </div>
    `

  try {
    const response = await apiRequest(`/sessions/${sessionId}/qr`)

    if (response.data.qrCode) {
      // Usar API de QR Code para generar la imagen
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        response.data.qrCode
      )}`

      container.innerHTML = `
                <img src="${qrCodeUrl}" alt="QR Code" class="mx-auto rounded-lg shadow-lg">
                <p class="text-sm text-gray-600 mt-4">Session: ${sessionId}</p>
            `
    } else {
      container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-green-500 text-6xl mb-4"></i>
                    <p class="text-lg text-gray-700">Sesión ya conectada</p>
                </div>
            `
    }
  } catch (error) {
    container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-red-500 text-6xl mb-4"></i>
                <p class="text-lg text-gray-700">Error al obtener QR</p>
                <p class="text-sm text-gray-500 mt-2">${error.message}</p>
            </div>
        `
  }
}

function closeQRModal() {
  document.getElementById('qr-modal').classList.add('hidden')
}

// Delete Session
async function deleteSession(sessionId) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
    return
  }

  try {
    await apiRequest(`/sessions/${sessionId}`, 'DELETE')
    showToast('Sesión eliminada exitosamente', 'success')
    await loadSessions()
  } catch (error) {
    showToast('Error al eliminar sesión: ' + error.message, 'error')
  }
}

// Refresh Single Session
async function refreshSession(sessionId) {
  try {
    const response = await apiRequest(`/sessions/${sessionId}`)
    showToast('Sesión actualizada', 'info')
    await loadSessions()
  } catch (error) {
    showToast('Error al actualizar sesión: ' + error.message, 'error')
  }
}

// Messages Management
let currentPage = 1
const pageSize = 20
let currentFilters = {}

async function loadMessagesStats() {
  try {
    const response = await apiRequest('/messages/stats')
    const data = response.data || response // Manejar ambos formatos
    document.getElementById('messages-total').textContent = data.total || 0
    document.getElementById('messages-sent').textContent = data.sent || 0
    document.getElementById('messages-failed').textContent = data.failed || 0
  } catch (error) {
    console.error('Error loading messages stats:', error)
    // Set default values on error
    document.getElementById('messages-total').textContent = '0'
    document.getElementById('messages-sent').textContent = '0'
    document.getElementById('messages-failed').textContent = '0'
  }
}

async function loadMessages() {
  try {
    const params = new URLSearchParams({
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...currentFilters
    })

    const response = await apiRequest(`/messages/logs?${params}`)
    const logs = response.data || [] // La API devuelve los logs en response.data

    renderMessagesTable(logs)
    document.getElementById('messages-showing').textContent = logs.length

    // Update pagination buttons
    document.getElementById(
      'current-page'
    ).textContent = `Página ${currentPage}`
    document.getElementById('prev-page-btn').disabled = currentPage === 1
    document.getElementById('next-page-btn').disabled = logs.length < pageSize
  } catch (error) {
    console.error('Error loading messages:', error)
    showToast('Error al cargar mensajes', 'error')
    renderMessagesTable([]) // Render empty table on error
  }
}

function renderMessagesTable(messages) {
  const tbody = document.getElementById('messages-table-body')

  // Asegurar que messages es un array
  if (!Array.isArray(messages)) {
    messages = []
  }

  if (messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <p>No hay mensajes para mostrar</p>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = messages
    .map((msg) => {
      const statusBadge =
        msg.status === 'sent'
          ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"><i class="fas fa-check"></i> Enviado</span>'
          : '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"><i class="fas fa-times"></i> Fallido</span>'

      const formattedError = formatErrorMessage(msg.error)
      const errorInfo = formattedError
        ? `
          <div class="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap break-words">
            <i class="fas fa-exclamation-triangle mr-1"></i>${formattedError}
          </div>
        `
        : ''

      return `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm text-gray-500">
          ${formatDate(msg.timestamp)}
        </td>
        <td class="px-4 py-3 text-sm text-gray-900">
          <span class="font-medium">${msg.sessionId}</span>
          ${
            msg.clientId
              ? `<br><small class="text-gray-500">${msg.clientId}</small>`
              : ''
          }
        </td>
        <td class="px-4 py-3 text-sm text-gray-900">
          ${msg.to}
        </td>
        <td class="px-4 py-3 text-sm text-gray-700">
          <div class="max-w-xs truncate" title="${msg.message}">
            ${msg.message}
          </div>
        </td>
        <td class="px-4 py-3 text-sm">
          ${statusBadge}
          ${errorInfo}
        </td>
      </tr>
    `
    })
    .join('')
}

async function populateSessionFilter() {
  try {
    // Obtener todos los mensajes sin límite para extraer las sesiones únicas
    const response = await apiRequest('/messages/logs?limit=1000')
    const logs = response.data || []
    const select = document.getElementById('filter-session')

    // Keep "Todas" option
    select.innerHTML = '<option value="">Todas</option>'

    // Asegurar que logs es un array
    if (Array.isArray(logs) && logs.length > 0) {
      // Extraer sesiones únicas de los mensajes
      const uniqueSessions = new Map()

      logs.forEach((log) => {
        if (log.sessionId && !uniqueSessions.has(log.sessionId)) {
          uniqueSessions.set(log.sessionId, {
            sessionId: log.sessionId,
            clientId: log.clientId
          })
        }
      })

      // Agregar las sesiones únicas al selector
      uniqueSessions.forEach((session) => {
        const option = document.createElement('option')
        option.value = session.sessionId
        option.textContent = `${
          session.clientId ? ` (${session.clientId})` : ''
        } ${session.sessionId}`
        select.appendChild(option)
      })
    }
  } catch (error) {
    console.error('Error populating session filter:', error)
  }
}

function toggleMessagesView() {
  const container = document.getElementById('messages-list-container')
  const btn = document.getElementById('toggle-messages-btn')
  const isHidden = container.classList.contains('hidden')

  if (isHidden) {
    container.classList.remove('hidden')
    btn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Ocultar</span>'
    loadMessages()
    populateSessionFilter()
  } else {
    container.classList.add('hidden')
    btn.innerHTML = '<i class="fas fa-eye"></i><span>Ver Mensajes</span>'
  }
}

function applyFilters() {
  currentFilters = {}

  const sessionId = document.getElementById('filter-session').value
  const status = document.getElementById('filter-status').value
  const to = document.getElementById('filter-to').value

  if (sessionId) currentFilters.sessionId = sessionId
  if (status) currentFilters.status = status
  if (to) currentFilters.to = to

  currentPage = 1
  loadMessages()
}

function nextPage() {
  currentPage++
  loadMessages()
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--
    loadMessages()
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkApiStatus()
  loadSessions()
  loadMessagesStats()

  // Event listeners for messages
  document
    .getElementById('toggle-messages-btn')
    .addEventListener('click', toggleMessagesView)
  document
    .getElementById('apply-filters-btn')
    .addEventListener('click', applyFilters)
  document.getElementById('next-page-btn').addEventListener('click', nextPage)
  document.getElementById('prev-page-btn').addEventListener('click', prevPage)

  // Auto-refresh every 10 seconds
  setInterval(() => {
    loadSessions()
    checkApiStatus()
    loadMessagesStats()
  }, 10000)
})

// Close modal on outside click
document.getElementById('qr-modal').addEventListener('click', (e) => {
  if (e.target.id === 'qr-modal') {
    closeQRModal()
  }
})
