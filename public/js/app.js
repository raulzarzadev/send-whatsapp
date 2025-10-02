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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkApiStatus()
  loadSessions()

  // Auto-refresh every 10 seconds
  setInterval(() => {
    loadSessions()
    checkApiStatus()
  }, 10000)
})

// Close modal on outside click
document.getElementById('qr-modal').addEventListener('click', (e) => {
  if (e.target.id === 'qr-modal') {
    closeQRModal()
  }
})
