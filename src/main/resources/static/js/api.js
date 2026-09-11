/**
 * RYA Tech - Cliente API REST Centralizado
 * Conecta el Frontend (HTML/JS) con el Backend (Spring Boot REST API)
 * Incluye normalización de DTOs, manejo de fallbacks offline y sincronización en vivo.
 */

(function (global) {
  'use strict';

  // Configuración de la URL base del Backend
  function resolveBaseUrl() {
    if (typeof window !== 'undefined') {
      if (window.RYA_API_URL) return window.RYA_API_URL;
      const stored = localStorage.getItem('rya_api_base_url');
      if (stored) return stored;

      // Si la página se está sirviendo desde el backend en puerto 8080
      if (window.location.port === '8080' || window.location.hostname === 'localhost' && window.location.port === '') {
        return '/api';
      }

      // Si la página se abre mediante file:// o Live Server (ej. 127.0.0.1:5500)
      return 'http://localhost:8080/api';
    }
    return 'http://localhost:8080/api';
  }

  const API_BASE_URL = resolveBaseUrl();

  /**
   * Transforma un DTO del backend (ProductoResponseDto) al formato unificado del frontend.
   */
  function normalizarProductoBackend(p) {
    if (!p) return null;

    const atributos = {};
    let fabricante = 'RYA';

    if (p.especificaciones && Array.isArray(p.especificaciones)) {
      p.especificaciones.forEach(e => {
        if (!e || !e.clave) return;
        atributos[e.clave] = e.valor;
        if (e.clave.toLowerCase() === 'fabricante' || e.clave.toLowerCase() === 'marca') {
          fabricante = e.valor;
        }
      });
    }

    // Si no se especificó fabricante en specs, inferir del nombre
    if (fabricante === 'RYA' && p.nombre) {
      const primerToken = p.nombre.split(' ')[0];
      const marcasComunes = [
        'ASUS', 'MSI', 'Gigabyte', 'Intel', 'AMD', 'Corsair', 'EVGA', 'Kingston',
        'Logitech', 'Razer', 'Samsung', 'LG', 'Crucial', 'NZXT', 'Lian Li', 'Noctua',
        'Thermaltake', 'HyperX', 'SteelSeries', 'Creative', 'JBL', 'Western Digital',
        'Seagate', 'TP-Link', 'G.Skill', 'Sapphire', 'Microsoft'
      ];
      if (marcasComunes.includes(primerToken)) {
        fabricante = primerToken;
      }
    }

    return {
      id: p.id,
      sku: p.sku || '',
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      categoria: p.subcategoriaNombre || (p.categoria && p.categoria.nombre) || 'Hardware',
      subcategoriaId: p.subcategoriaId || (p.categoria && p.categoria.id) || null,
      fabricante: fabricante,
      precio: Number(p.precioBase !== undefined ? p.precioBase : (p.precio || 0)),
      stock: p.stock !== undefined ? p.stock : 25,
      activo: p.activo !== false,
      imagenUrl: p.imagenUrl || p.imagen_url || '',
      atributos: atributos,
      especificaciones: p.especificaciones || [],
      tipoProducto: p.tipoProducto || 'HARDWARE'
    };
  }

  /**
   * Helper genérico para realizar peticiones HTTP con timeout y control de errores.
   */
  async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (_) {}

        const error = new Error(errorData?.mensaje || `Error HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // =========================================================================
  // SERVICIOS DE PRODUCTOS
  // =========================================================================

  /**
   * Obtiene la lista completa de productos desde el backend (/api/productos).
   * Refleja exactamente los productos registrados en la base de datos Supabase.
   */
  async function obtenerProductos(subcategoriaId = null) {
    try {
      const endpoint = subcategoriaId ? `/productos?categoriaId=${subcategoriaId}` : '/productos';
      const data = await request(endpoint);
      if (Array.isArray(data)) {
        return data.map(normalizarProductoBackend);
      }
    } catch (error) {
      console.warn('Backend no disponible o error al conectar con /api/productos:', error.message);
    }

    // Si el backend responde vacío o falla, retorna lista vacía (sin productos falsos)
    return [];
  }

  /**
   * Obtiene un producto individual por su ID (soporta UUIDs del backend e IDs numéricos).
   */
  async function obtenerProductoPorId(id) {
    if (!id) return null;

    // 1. Si es formato UUID, intentar endpoint directo
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      try {
        const prodBackend = await request(`/productos/${id}`);
        if (prodBackend) return normalizarProductoBackend(prodBackend);
      } catch (err) {
        console.warn(`No se pudo obtener producto ${id} por endpoint directo:`, err.message);
      }
    }

    // 2. Buscar en la lista de productos
    const productos = await obtenerProductos();
    return productos.find(p => String(p.id) === String(id)) || null;
  }

  /**
   * Obtiene los productos correspondientes a una categoría con límite opcional.
   */
  async function obtenerProductosPorCategoria(categoriaNombre, limite = 6) {
    const todos = await obtenerProductos();
    const filtrados = todos.filter(p => p.categoria === categoriaNombre);
    return limite ? filtrados.slice(0, limite) : filtrados;
  }

  // =========================================================================
  // SERVICIOS DE CATEGORÍAS
  // =========================================================================

  /**
   * Obtiene la jerarquía de categorías desde el backend (/api/categorias).
   */
  async function obtenerCategorias(soloRaices = false) {
    try {
      const endpoint = soloRaices ? '/categorias?soloRaices=true' : '/categorias';
      return await request(endpoint);
    } catch (err) {
      console.warn('Error al obtener categorías del backend:', err.message);
      return null;
    }
  }

  // =========================================================================
  // SERVICIOS DE USUARIOS
  // =========================================================================

  /**
   * Busca un usuario por email en el backend (/api/usuarios/email).
   */
  async function obtenerUsuarioPorEmail(email) {
    try {
      return await request(`/usuarios/email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  /**
   * Registra un nuevo usuario en el backend (/api/usuarios).
   */
  async function crearUsuario(usuarioDto) {
    return await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nombre: usuarioDto.nombre,
        email: usuarioDto.email,
        telefono: usuarioDto.telefono || '',
        password: usuarioDto.password || 'Password123!',
        rol: usuarioDto.rol || 'CLIENTE'
      })
    });
  }

  /**
   * Registra o reutiliza un usuario existente por email de manera transparente.
   */
  async function registrarOObtenerUsuario(cliente) {
    if (!cliente || !cliente.email) {
      throw new Error('El correo del cliente es requerido.');
    }

    try {
      const usuarioExistente = await obtenerUsuarioPorEmail(cliente.email);
      if (usuarioExistente && usuarioExistente.id) {
        return usuarioExistente;
      }
    } catch (err) {
      console.warn('Error buscando usuario existente:', err.message);
    }

    // Crear nuevo usuario si no existe
    try {
      return await crearUsuario({
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        password: 'Password123!',
        rol: 'CLIENTE'
      });
    } catch (createErr) {
      console.warn('No se pudo registrar usuario en el backend:', createErr.message);
      return null;
    }
  }

  // =========================================================================
  // SERVICIOS DE PEDIDOS (ÓRDENES DE COMPRA)
  // =========================================================================

  /**
   * Registra un pedido real en el backend (/api/pedidos).
   * @param {Object} pedidoPayload - { usuarioId, metodoPago, detalles: [{ productoId, cantidad }] }
   */
  async function crearPedido(pedidoPayload) {
    return await request('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedidoPayload)
    });
  }

  /**
   * Obtiene el detalle de un pedido por su UUID (/api/pedidos/{id}).
   */
  async function obtenerPedidoPorId(id) {
    return await request(`/pedidos/${id}`);
  }

  /**
   * Verifica el estado de conexión con el backend.
   */
  async function verificarConexionBackend() {
    try {
      const response = await fetch(`${API_BASE_URL}/productos`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      return {
        online: response.ok,
        status: response.status,
        url: API_BASE_URL
      };
    } catch (err) {
      return {
        online: false,
        status: 0,
        url: API_BASE_URL,
        error: err.message
      };
    }
  }

  // Objeto unificado del cliente API
  const RyaApi = {
    BASE_URL: API_BASE_URL,
    obtenerProductos,
    obtenerProductoPorId,
    obtenerProductosPorCategoria,
    obtenerCategorias,
    obtenerUsuarioPorEmail,
    crearUsuario,
    registrarOObtenerUsuario,
    crearPedido,
    obtenerPedidoPorId,
    verificarConexionBackend
  };

  // Exportaciones globales para compatibilidad total con el frontend
  global.RyaApi = RyaApi;
  global.api = RyaApi;
  global.obtenerProductosPorCategoria = obtenerProductosPorCategoria;
  global.obtenerProductos = obtenerProductos;
  global.obtenerProductoPorId = obtenerProductoPorId;
  global.crearPedidoApi = crearPedido;
  global.registrarOObtenerUsuarioApi = registrarOObtenerUsuario;
  global.verificarConexionBackend = verificarConexionBackend;

})(typeof window !== 'undefined' ? window : this);