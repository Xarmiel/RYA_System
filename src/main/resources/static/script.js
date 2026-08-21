document.addEventListener('DOMContentLoaded', () => {

  // Escuchar botones desde afuera (Opcional, si tienes botones en el HTML)
  document.querySelectorAll('[data-categoria]').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.categoriaActual = btn.dataset.categoria;
      estado.filtrosSeleccionados = {};
      cargarProductos();
    });
  });

  /* ==========================================
     1. LÓGICA DINÁMICA DE CARRUSELES
     ========================================== */
  function inicializarCarruseles() {
    // Buscamos todas las secciones que funcionarán como carrusel
    const seccionesCarrusel = document.querySelectorAll('.carousel-section');

    seccionesCarrusel.forEach(seccion => {
      // Buscamos los elementos pero SOLO dentro de esta sección específica
      const track = seccion.querySelector('.carousel-track');
      const btnPrev = seccion.querySelector('.btn-prev');
      const btnNext = seccion.querySelector('.btn-next');

      // Si la sección tiene todo lo necesario, aplicamos la lógica
      if (track && btnPrev && btnNext) {
        
        // Evitamos agregar eventos múltiples si la función se llama varias veces
        if (track.dataset.inicializado === "true") return; 
        track.dataset.inicializado = "true";

        const getScrollAmount = () => {
          const item = track.querySelector('.carousel-item');
          if (!item) return 0;
          const style = window.getComputedStyle(track);
          const gap = parseFloat(style.gap) || 24; 
          return item.offsetWidth + gap; 
        };

        btnNext.addEventListener('click', () => {
          track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        btnPrev.addEventListener('click', () => {
          track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
      }
    });
  }

  // Ejecutamos la función al cargar la página
  inicializarCarruseles();

  /* ==========================================
     2. LÓGICA DEL MENÚ LATERAL (DRAWER)
     ========================================== */
  const btnOpenFilters = document.getElementById('btnOpenFilters');
  const btnCloseFilters = document.getElementById('btnCloseFilters');
  const filterSidebar = document.getElementById('filterSidebar');
  const filterOverlay = document.getElementById('filterOverlay');

  const toggleFilters = (show) => {
    if(filterSidebar && filterOverlay) {
      filterSidebar.classList.toggle('active', show);
      filterOverlay.classList.toggle('active', show);
    }
  };

  btnOpenFilters?.addEventListener('click', () => toggleFilters(true));
  btnCloseFilters?.addEventListener('click', () => toggleFilters(false));
  filterOverlay?.addEventListener('click', () => toggleFilters(false));
  document.getElementById('btnApplyFilters')?.addEventListener('click', () => toggleFilters(false));
  
  /* ==========================================
     3. MOTOR DE FILTROS (PREPARADO PARA BD POSTGRESQL / API JAVA)
     ========================================== */

  const REGLAS_DE_DEPENDENCIA = {
    "Placas Madre": { activa: ["socket_placa", "chipset_gama", "formato_placa", "tipo_ram_placa", "conectividad_placa", "generacion_pcie_placa"] },
    "Procesadores": { activa: ["gama_cpu", "linea_cpu", "socket_cpu", "tecnologia_cpu", "presupuesto_cpu"] },
    "Tarjetas Gráficas": { activa: ["chipset_gpu", "gama_resolucion", "memoria_vram", "serie_gpu", "ensamblador_gpu", "enfriamiento_gpu", "conector_energia_gpu"] },
    "Almacenamiento": { activa: ["tipo_almacenamiento", "capacidad_disco", "interfaz_disco", "velocidad_lectura_disco", "formato_disco", "caracteristicas_disco"] },
    "Memoria RAM": { activa: ["generacion_ram", "capacidad_ram", "configuracion_ram", "velocidad_ram", "estetica_ram", "perfiles_ram"] },
    "Fuentes de Poder": { activa: ["potencia_psu", "certificacion_psu", "modularidad_psu", "estandar_psu", "formato_psu", "estetica_psu"] },
    "Gabinetes": { activa: ["tamaño_gabinete", "compatibilidad_aio_gabinete", "diseno_gabinete", "ventiladores_incluidos", "iluminacion_gabinete", "color_gabinete"] },
    "Enfriamiento Líquido": { activa: ["tamaño_radiador", "socket_aio", "pantalla_aio", "estetica_aio", "color_aio", "conectividad_aio"] },
    "Ventiladores y Disipadores": { activa: ["tamaño_ventilador", "iluminacion_fan", "formato_venta_fan", "conexion_fan", "color_fan"] },
    "Tarjetas de Red": { activa: ["interfaz_red", "conectividad_red", "generacion_wifi", "velocidad_lan", "antenas_red", "perfil_red"] },
    "Monitores": { activa: ["tamaño_monitor", "resolucion_monitor", "tasa_refresco", "panel_monitor", "forma_monitor", "sincronizacion_monitor"] },
    "Teclados": { activa: ["tipo_teclado", "formato_teclado", "tipo_switch", "conectividad_teclado", "iluminacion_teclado", "idioma_teclado"] },
    "Ratones": { activa: ["conectividad_mouse", "peso_mouse", "botones_mouse", "sensor_mouse", "diseno_mouse", "iluminacion_mouse"] },
    "Auriculares": { activa: ["conectividad_headset", "formato_headset", "sonido_headset", "microfono_headset", "plataforma_headset", "iluminacion_headset"] },
    "Bocinas": { activa: ["tipo_audio_bocina", "conectividad_bocina", "subwoofer_bocina", "alimentacion_bocina", "iluminacion_bocina"] },
    "Cámaras Web": { activa: ["resolucion_webcam", "fps_webcam", "enfoque_webcam", "iluminacion_webcam", "privacidad_webcam", "conectividad_webcam"] },
    "Micrófonos USB": { activa: ["patron_polar_mic", "calidad_audio_mic", "controles_mic", "accesorios_mic", "iluminacion_mic"] },
    "Discos Duros Externos": { activa: ["tipo_disco_externo", "capacidad_externo", "formato_externo", "conectividad_externo", "consola_externo", "proteccion_externo"] },
    "Hubs y Estaciones": { activa: ["tipo_hub", "puertos_entrada_hub", "puertos_salida_hub", "energia_hub", "alimentacion_hub", "mandos_hub"] },
    "Mousepads": { activa: ["tamaño_mousepad", "superficie_mousepad", "material_mousepad", "iluminacion_mousepad", "grosor_mousepad", "caracteristicas_mousepad"] }
  };

  const FILTROS_GLOBALES = ["fabricante"];

  const NOMBRES_LEGIBLES = {
    "fabricante": "Fabricante",
    "socket_placa": "Socket / Procesador", "chipset_gama": "Chipset (Gama)", "formato_placa": "Formato (Tamaño)", "tipo_ram_placa": "Tipo de Memoria RAM", "conectividad_placa": "Conectividad Integrada", "generacion_pcie_placa": "Generación PCIe",
    "gama_cpu": "Gama de Rendimiento", "linea_cpu": "Línea de Producto", "socket_cpu": "Socket", "tecnologia_cpu": "Tecnología Gaming", "presupuesto_cpu": "Presupuesto",
    "chipset_gpu": "Marca del Chipset", "gama_resolucion": "Resolución Ideal", "memoria_vram": "Memoria (VRAM)", "serie_gpu": "Serie o Generación", "ensamblador_gpu": "Ensamblador", "enfriamiento_gpu": "Tamaño y Enfriamiento", "conector_energia_gpu": "Conectores de Energía",
    "tipo_almacenamiento": "Tipo de Tecnología", "capacidad_disco": "Capacidad", "interfaz_disco": "Interfaz / Conexión", "velocidad_lectura_disco": "Velocidad de Lectura", "formato_disco": "Formato y Diseño", "caracteristicas_disco": "Características",
    "generacion_ram": "Generación (Tipo)", "capacidad_ram": "Capacidad Total", "configuracion_ram": "Configuración de Módulos", "velocidad_ram": "Velocidad (Frecuencia)", "estetica_ram": "Estética y Diseño", "perfiles_ram": "Perfiles (Overclock)",
    "potencia_psu": "Potencia (Vataje)", "certificacion_psu": "Certificación (80 Plus)", "modularidad_psu": "Modularidad", "estandar_psu": "Estándar", "formato_psu": "Formato", "estetica_psu": "Estética",
    "tamaño_gabinete": "Tamaño / Formato", "compatibilidad_aio_gabinete": "Compatibilidad Líquida", "diseno_gabinete": "Diseño", "ventiladores_incluidos": "Ventiladores Incluidos", "iluminacion_gabinete": "Iluminación de Fábrica", "color_gabinete": "Color",
    "tamaño_radiador": "Tamaño del Radiador", "socket_aio": "Compatibilidad de Socket", "pantalla_aio": "Pantalla", "estetica_aio": "Estética", "color_aio": "Color", "conectividad_aio": "Gestión",
    "tamaño_ventilador": "Tamaño", "iluminacion_fan": "Iluminación", "formato_venta_fan": "Formato de Venta", "conexion_fan": "Conexión", "color_fan": "Color",
    "interfaz_red": "Interfaz", "conectividad_red": "Conectividad", "generacion_wifi": "Generación de Wi-Fi", "velocidad_lan": "Velocidad LAN", "antenas_red": "Antenas", "perfil_red": "Perfil",
    "tamaño_monitor": "Tamaño de Pantalla", "resolucion_monitor": "Resolución", "tasa_refresco": "Tasa de Refresco", "panel_monitor": "Panel", "forma_monitor": "Forma", "sincronizacion_monitor": "Sincronización",
    "tipo_teclado": "Tipo", "formato_teclado": "Formato", "tipo_switch": "Switch", "conectividad_teclado": "Conectividad", "iluminacion_teclado": "Iluminación", "idioma_teclado": "Idioma",
    "conectividad_mouse": "Conectividad", "peso_mouse": "Peso", "botones_mouse": "Botones", "sensor_mouse": "Sensor", "diseno_mouse": "Diseño", "iluminacion_mouse": "Iluminación",
    "conectividad_headset": "Conectividad", "formato_headset": "Formato", "sonido_headset": "Tipo de Sonido", "microfono_headset": "Micrófono", "plataforma_headset": "Compatibilidad", "iluminacion_headset": "Iluminación",
    "tipo_audio_bocina": "Tipo de Audio", "conectividad_bocina": "Conectividad", "subwoofer_bocina": "Subwoofer", "alimentacion_bocina": "Alimentación", "iluminacion_bocina": "Iluminación",
    "resolucion_webcam": "Resolución", "fps_webcam": "FPS", "enfoque_webcam": "Enfoque", "iluminacion_webcam": "Iluminación", "privacidad_webcam": "Privacidad", "conectividad_webcam": "Conectividad",
    "patron_polar_mic": "Patrón Polar", "calidad_audio_mic": "Calidad de Audio", "controles_mic": "Controles", "accesorios_mic": "Accesorios", "iluminacion_mic": "Iluminación",
    "tipo_disco_externo": "Tipo", "capacidad_externo": "Capacidad", "formato_externo": "Formato", "conectividad_externo": "Conectividad", "consola_externo": "Compatibilidad Consolas", "proteccion_externo": "Protección",
    "tipo_hub": "Tipo de Producto", "puertos_entrada_hub": "Entradas", "puertos_salida_hub": "Salidas", "energia_hub": "Entrega de Energía", "alimentacion_hub": "Alimentación", "mandos_hub": "Mandos",
    "tamaño_mousepad": "Tamaño", "superficie_mousepad": "Superficie", "material_mousepad": "Material", "iluminacion_mousepad": "Iluminación", "grosor_mousepad": "Grosor", "caracteristicas_mousepad": "Características"
  };

  const JERARQUIA_CATEGORIAS = {
    "Hardware": [
      "Placas Madre", "Procesadores", "Tarjetas Gráficas", "Almacenamiento", "Memoria RAM",
      "Fuentes de Poder", "Gabinetes", "Enfriamiento Líquido", "Ventiladores y Disipadores", "Tarjetas de Red"
    ],
    "Periféricos y Accesorios": [
      "Monitores", "Teclados", "Ratones", "Auriculares", "Bocinas",
      "Cámaras Web", "Micrófonos USB", "Discos Duros Externos", "Hubs y Estaciones", "Mousepads"
    ]
  };

  let productosBase = []; 
  let estado = {
    categoriaActual: null,
    filtrosSeleccionados: {}
  };

  const container = document.getElementById('dynamicFilterContainer');
  const filterCountLabel = document.getElementById('filterCount');

  async function cargarProductos() {
    try {
      productosBase = [
              // ============================================================
              // 1. PLACAS MADRE (MOTHERBOARDS) - 5 productos
              // ============================================================
              { id: 1,  categoria: "Placas Madre", fabricante: "ASUS",      precio: 850,  atributos: { socket_placa: "Para Intel LGA1700", chipset_gama: "Gama Alta (Intel Z / AMD X)", formato_placa: "ATX (Estándar)", tipo_ram_placa: "DDR5", conectividad_placa: "Con Wi-Fi y Bluetooth", generacion_pcie_placa: "PCIe 5.0 (Ready)" } },
              { id: 2,  categoria: "Placas Madre", fabricante: "MSI",       precio: 650,  atributos: { socket_placa: "Para AMD AM5", chipset_gama: "Gama Media (Intel B / AMD B)", formato_placa: "Micro-ATX (Compacto)", tipo_ram_placa: "DDR5", conectividad_placa: "Solo Ethernet (Cable)", generacion_pcie_placa: "PCIe 4.0" } },
              { id: 3,  categoria: "Placas Madre", fabricante: "Gigabyte",  precio: 1200, atributos: { socket_placa: "Para Intel LGA1851", chipset_gama: "Gama Alta (Intel Z / AMD X)", formato_placa: "ATX (Estándar)", tipo_ram_placa: "DDR5", conectividad_placa: "Con Wi-Fi y Bluetooth", generacion_pcie_placa: "PCIe 5.0 (Ready)" } },
              { id: 4,  categoria: "Placas Madre", fabricante: "ASUS",      precio: 400,  atributos: { socket_placa: "Para AMD AM4", chipset_gama: "Gama Entrada (Intel H / AMD A)", formato_placa: "Micro-ATX (Compacto)", tipo_ram_placa: "DDR4", conectividad_placa: "Solo Ethernet (Cable)", generacion_pcie_placa: "PCIe 4.0" } },
              { id: 5,  categoria: "Placas Madre", fabricante: "MSI",       precio: 950,  atributos: { socket_placa: "Para Intel LGA1700", chipset_gama: "Gama Media (Intel B / AMD B)", formato_placa: "ATX (Estándar)", tipo_ram_placa: "DDR5", conectividad_placa: "Con Wi-Fi y Bluetooth", generacion_pcie_placa: "PCIe 4.0" } },

              // ============================================================
              // 2. PROCESADORES (CPU) - 5 productos
              // ============================================================
              { id: 6,  categoria: "Procesadores", fabricante: "Intel",   precio: 1850, atributos: { gama_cpu: "Gama Alta", linea_cpu: "Intel Core i9 / AMD Ryzen 9", socket_cpu: "Intel LGA1700", tecnologia_cpu: "Desbloqueado (Overclock)", presupuesto_cpu: "Rango de precio" } },
              { id: 7,  categoria: "Procesadores", fabricante: "AMD",     precio: 2100, atributos: { gama_cpu: "Gama Entusiasta", linea_cpu: "Intel Core i9 / AMD Ryzen 9", socket_cpu: "AMD AM5", tecnologia_cpu: "Con Caché 3D (AMD X3D)", presupuesto_cpu: "Rango de precio" } },
              { id: 8,  categoria: "Procesadores", fabricante: "Intel",   precio: 1250, atributos: { gama_cpu: "Gama Media", linea_cpu: "Intel Core i7 / AMD Ryzen 7", socket_cpu: "Intel LGA1700", tecnologia_cpu: "Desbloqueado (Overclock)", presupuesto_cpu: "Rango de precio" } },
              { id: 9,  categoria: "Procesadores", fabricante: "AMD",     precio: 1650, atributos: { gama_cpu: "Gama Alta", linea_cpu: "Intel Core i7 / AMD Ryzen 7", socket_cpu: "AMD AM5", tecnologia_cpu: "Con Caché 3D (AMD X3D)", presupuesto_cpu: "En Oferta" } },
              { id: 10, categoria: "Procesadores", fabricante: "Intel",   precio: 950,  atributos: { gama_cpu: "Gama Media", linea_cpu: "Intel Core i5 / AMD Ryzen 5", socket_cpu: "Intel LGA1700", tecnologia_cpu: "Requiere Gráfica Dedicada", presupuesto_cpu: "En Combo (CPU + Placa)" } },

              // ============================================================
              // 3. TARJETAS GRÁFICAS (GPU) - 5 productos
              // ============================================================
              { id: 11, categoria: "Tarjetas Gráficas", fabricante: "ASUS",     precio: 2900, atributos: { chipset_gpu: "NVIDIA GeForce", gama_resolucion: "4K Ultra / VR", memoria_vram: "16 GB", serie_gpu: "NVIDIA RTX Serie 50", ensamblador_gpu: "ASUS", enfriamiento_gpu: "3 Ventiladores (Gama Alta / Grande)", conector_energia_gpu: "Conector Nuevo" } },
              { id: 12, categoria: "Tarjetas Gráficas", fabricante: "MSI",      precio: 1550, atributos: { chipset_gpu: "AMD Radeon", gama_resolucion: "1440p Competitivo / 4K", memoria_vram: "12 GB", serie_gpu: "AMD Radeon RX Serie 7000", ensamblador_gpu: "MSI", enfriamiento_gpu: "2 Ventiladores (Estándar)", conector_energia_gpu: "Estándar PCIe" } },
              { id: 13, categoria: "Tarjetas Gráficas", fabricante: "EVGA",     precio: 780,  atributos: { chipset_gpu: "NVIDIA GeForce", gama_resolucion: "1080p Ultra / 1440p", memoria_vram: "8 GB", serie_gpu: "NVIDIA RTX Serie 40", ensamblador_gpu: "EVGA / Zotac / PNY", enfriamiento_gpu: "2 Ventiladores (Estándar)", conector_energia_gpu: "Estándar PCIe" } },
              { id: 14, categoria: "Tarjetas Gráficas", fabricante: "Gigabyte", precio: 620,  atributos: { chipset_gpu: "NVIDIA GeForce", gama_resolucion: "Competitivo / 1080p", memoria_vram: "6 GB o menos", serie_gpu: "NVIDIA RTX Serie 40", ensamblador_gpu: "Gigabyte", enfriamiento_gpu: "1 Ventilador (ITX / Compacto)", conector_energia_gpu: "Estándar PCIe" } },
              { id: 15, categoria: "Tarjetas Gráficas", fabricante: "Sapphire", precio: 3400, atributos: { chipset_gpu: "AMD Radeon", gama_resolucion: "4K Ultra / VR", memoria_vram: "24 GB o más", serie_gpu: "AMD Radeon RX Serie 7000", ensamblador_gpu: "ASUS", enfriamiento_gpu: "Enfriamiento Líquido (AIO)", conector_energia_gpu: "Conector Nuevo" } },

              // ============================================================
              // 4. ALMACENAMIENTO (SSD/HDD) - 5 productos
              // ============================================================
              { id: 16, categoria: "Almacenamiento", fabricante: "Samsung",        precio: 850,  atributos: { tipo_almacenamiento: "M.2 NVMe", capacidad_disco: "1 TB", interfaz_disco: "PCIe Gen 4.0", velocidad_lectura_disco: "Hasta 7,500 MB/s", formato_disco: "M.2 2280", caracteristicas_disco: "Con Disipador de Calor Integrado" } },
              { id: 17, categoria: "Almacenamiento", fabricante: "Western Digital", precio: 1200, atributos: { tipo_almacenamiento: "M.2 NVMe", capacidad_disco: "2 TB", interfaz_disco: "PCIe Gen 5.0", velocidad_lectura_disco: "Más de 10,000 MB/s", formato_disco: "M.2 2280", caracteristicas_disco: "Compatible con PlayStation 5" } },
              { id: 18, categoria: "Almacenamiento", fabricante: "Crucial",        precio: 350,  atributos: { tipo_almacenamiento: "SSD SATA", capacidad_disco: "500 GB o menos", interfaz_disco: "SATA III", velocidad_lectura_disco: "Hasta 3,500 MB/s", formato_disco: "2.5 Pulgadas", caracteristicas_disco: "Ninguna" } },
              { id: 19, categoria: "Almacenamiento", fabricante: "Seagate",        precio: 280,  atributos: { tipo_almacenamiento: "HDD Mecánico", capacidad_disco: "4 TB o más", interfaz_disco: "SATA III", velocidad_lectura_disco: "Hasta 3,500 MB/s", formato_disco: "3.5 Pulgadas", caracteristicas_disco: "Ninguna" } },
              { id: 20, categoria: "Almacenamiento", fabricante: "Kingston",       precio: 650,  atributos: { tipo_almacenamiento: "M.2 NVMe", capacidad_disco: "1 TB", interfaz_disco: "PCIe Gen 4.0", velocidad_lectura_disco: "Hasta 7,500 MB/s", formato_disco: "M.2 2280", caracteristicas_disco: "Con Disipador de Calor Integrado" } },

              // ============================================================
              // 5. MEMORIA RAM - 5 productos
              // ============================================================
              { id: 21, categoria: "Memoria RAM", fabricante: "Kingston",  precio: 480,  atributos: { generacion_ram: "DDR5", capacidad_ram: "32 GB", configuracion_ram: "2 Módulos (Dual Channel)", velocidad_ram: "5200 MHz a 6000 MHz (Estándar DDR5)", estetica_ram: "Con Iluminación RGB", perfiles_ram: "Compatible con Intel XMP" } },
              { id: 22, categoria: "Memoria RAM", fabricante: "Corsair",   precio: 350,  atributos: { generacion_ram: "DDR5", capacidad_ram: "16 GB", configuracion_ram: "2 Módulos (Dual Channel)", velocidad_ram: "5200 MHz a 6000 MHz (Estándar DDR5)", estetica_ram: "Sin RGB (Diseño discreto / Negro)", perfiles_ram: "Compatible con AMD EXPO" } },
              { id: 23, categoria: "Memoria RAM", fabricante: "G.Skill",   precio: 680,  atributos: { generacion_ram: "DDR5", capacidad_ram: "64 GB", configuracion_ram: "4 Módulos (Quad Channel)", velocidad_ram: "Más de 6400 MHz (Gama Alta DDR5)", estetica_ram: "Con Iluminación RGB", perfiles_ram: "Compatible con Intel XMP" } },
              { id: 24, categoria: "Memoria RAM", fabricante: "Crucial",   precio: 210,  atributos: { generacion_ram: "DDR4", capacidad_ram: "16 GB", configuracion_ram: "1 Módulo (Single Channel)", velocidad_ram: "Hasta 3200 MHz (Estándar DDR4)", estetica_ram: "Sin RGB (Diseño discreto / Negro)", perfiles_ram: "Ninguno" } },
              { id: 25, categoria: "Memoria RAM", fabricante: "Kingston",  precio: 280,  atributos: { generacion_ram: "DDR4", capacidad_ram: "32 GB", configuracion_ram: "2 Módulos (Dual Channel)", velocidad_ram: "3600 MHz a 4000 MHz (Alto rendimiento DDR4)", estetica_ram: "Perfil Bajo", perfiles_ram: "Ninguno" } },

              // ============================================================
              // 6. FUENTES DE PODER (PSU) - 5 productos
              // ============================================================
              { id: 26, categoria: "Fuentes de Poder", fabricante: "Corsair",      precio: 450,  atributos: { potencia_psu: "850W a 1000W (Gama Alta)", certificacion_psu: "80 Plus Gold", modularidad_psu: "Full Modular (Cables 100% desmontables)", estandar_psu: "ATX 3.0 / 3.1 PCIe 5.0 Ready", formato_psu: "ATX (Estándar para gabinetes normales)", estetica_psu: "Color Negro" } },
              { id: 27, categoria: "Fuentes de Poder", fabricante: "EVGA",         precio: 320,  atributos: { potencia_psu: "650W a 750W (Gama Media)", certificacion_psu: "80 Plus Bronze", modularidad_psu: "Semimodular (Solo cables básicos fijos)", estandar_psu: "ATX 2.0 tradicional", formato_psu: "ATX (Estándar para gabinetes normales)", estetica_psu: "Color Negro" } },
              { id: 28, categoria: "Fuentes de Poder", fabricante: "Thermaltake",  precio: 580,  atributos: { potencia_psu: "850W a 1000W (Gama Alta)", certificacion_psu: "80 Plus Platinum", modularidad_psu: "Full Modular (Cables 100% desmontables)", estandar_psu: "ATX 3.0 / 3.1 PCIe 5.0 Ready", formato_psu: "ATX (Estándar para gabinetes normales)", estetica_psu: "Color Blanco" } },
              { id: 29, categoria: "Fuentes de Poder", fabricante: "Cooler Master", precio: 200,  atributos: { potencia_psu: "550W o menos (Gama Entrada)", certificacion_psu: "80 Plus White", modularidad_psu: "No Modular (Todos los cables fijos)", estandar_psu: "ATX 2.0 tradicional", formato_psu: "ATX (Estándar para gabinetes normales)", estetica_psu: "Color Negro" } },
              { id: 30, categoria: "Fuentes de Poder", fabricante: "Corsair",      precio: 780,  atributos: { potencia_psu: "Más de 1200W (Gama Entusiasta)", certificacion_psu: "80 Plus Titanium", modularidad_psu: "Full Modular (Cables 100% desmontables)", estandar_psu: "ATX 3.0 / 3.1 PCIe 5.0 Ready", formato_psu: "ATX (Estándar para gabinetes normales)", estetica_psu: "Color Blanco" } },

              // ============================================================
              // 7. GABINETES (CASES) - 5 productos
              // ============================================================
              { id: 31, categoria: "Gabinetes", fabricante: "NZXT",           precio: 450, atributos: { tamaño_gabinete: "Mid Tower", compatibilidad_aio_gabinete: "Soporta hasta 360mm / 420mm", diseno_gabinete: "Frente de Malla", ventiladores_incluidos: "3 a 4 ventiladores", iluminacion_gabinete: "Sin Iluminación", color_gabinete: "Negro" } },
              { id: 32, categoria: "Gabinetes", fabricante: "Corsair",        precio: 380, atributos: { tamaño_gabinete: "Mid Tower", compatibilidad_aio_gabinete: "Soporta hasta 240mm / 280mm", diseno_gabinete: "Con Vidrio Templado Lateral", ventiladores_incluidos: "1 a 2 ventiladores", iluminacion_gabinete: "Con Ventiladores ARGB / RGB", color_gabinete: "Blanco" } },
              { id: 33, categoria: "Gabinetes", fabricante: "Lian Li",        precio: 650, atributos: { tamaño_gabinete: "Full Tower", compatibilidad_aio_gabinete: "Soporta hasta 360mm / 420mm", diseno_gabinete: "Tipo Pecera", ventiladores_incluidos: "Más de 4 ventiladores", iluminacion_gabinete: "Con Ventiladores ARGB / RGB", color_gabinete: "Negro" } },
              { id: 34, categoria: "Gabinetes", fabricante: "Cooler Master",  precio: 280, atributos: { tamaño_gabinete: "Micro-ATX Tower", compatibilidad_aio_gabinete: "Soporta hasta 120mm / 140mm", diseno_gabinete: "Estilo Minimalista / Cerrado", ventiladores_incluidos: "Sin ventiladores", iluminacion_gabinete: "Sin Iluminación", color_gabinete: "Negro" } },
              { id: 35, categoria: "Gabinetes", fabricante: "Thermaltake",    precio: 520, atributos: { tamaño_gabinete: "Mid Tower", compatibilidad_aio_gabinete: "Soporta hasta 280mm", diseno_gabinete: "Frente de Malla", ventiladores_incluidos: "3 a 4 ventiladores", iluminacion_gabinete: "Con Ventiladores ARGB / RGB", color_gabinete: "Blanco" } },

              // ============================================================
              // 8. ENFRIAMIENTO LÍQUIDO (AIO) - 5 productos
              // ============================================================
              { id: 36, categoria: "Enfriamiento Líquido", fabricante: "Corsair",    precio: 350, atributos: { tamaño_radiador: "360 mm (3 ventiladores de 120mm)", socket_aio: "Intel LGA1700 / LGA1851", pantalla_aio: "Con Pantalla LCD personalizable", estetica_aio: "Ventiladores ARGB", color_aio: "Completamente Negro", conectividad_aio: "Conexión por Cable Único" } },
              { id: 37, categoria: "Enfriamiento Líquido", fabricante: "NZXT",       precio: 420, atributos: { tamaño_radiador: "280 mm (2 ventiladores de 140mm)", socket_aio: "AMD AM5", pantalla_aio: "Con Pantalla Digital básica", estetica_aio: "Ventiladores ARGB", color_aio: "Completamente Negro", conectividad_aio: "Conexión Tradicional" } },
              { id: 38, categoria: "Enfriamiento Líquido", fabricante: "Cooler Master", precio: 250, atributos: { tamaño_radiador: "240 mm (2 ventiladores de 120mm)", socket_aio: "Intel LGA1200 / 115X", pantalla_aio: "Sin Pantalla", estetica_aio: "Ventiladores RGB Estáticos", color_aio: "Completamente Negro", conectividad_aio: "Conexión Tradicional" } },
              { id: 39, categoria: "Enfriamiento Líquido", fabricante: "Thermaltake", precio: 380, atributos: { tamaño_radiador: "360 mm (3 ventiladores de 120mm)", socket_aio: "AMD AM4", pantalla_aio: "Sin Pantalla", estetica_aio: "Ventiladores ARGB", color_aio: "Completamente Blanco", conectividad_aio: "Conexión por Cable Único" } },
              { id: 40, categoria: "Enfriamiento Líquido", fabricante: "ASUS",       precio: 580, atributos: { tamaño_radiador: "420 mm (3 ventiladores de 140mm)", socket_aio: "Intel LGA1851", pantalla_aio: "Con Pantalla LCD personalizable", estetica_aio: "Ventiladores ARGB", color_aio: "Completamente Negro", conectividad_aio: "Conexión por Cable Único" } },

              // ============================================================
              // 9. VENTILADORES Y DISIPADORES - 5 productos
              // ============================================================
              { id: 41, categoria: "Ventiladores y Disipadores", fabricante: "Corsair",    precio: 90, atributos: { tamaño_ventilador: "120 mm", iluminacion_fan: "ARGB", formato_venta_fan: "Kit de 3 Ventiladores", conexion_fan: "PWM de 4 pines", color_fan: "Negro" } },
              { id: 42, categoria: "Ventiladores y Disipadores", fabricante: "Noctua",     precio: 120, atributos: { tamaño_ventilador: "140 mm", iluminacion_fan: "Sin LED", formato_venta_fan: "Ventilador Individual", conexion_fan: "PWM de 4 pines", color_fan: "Negro" } },
              { id: 43, categoria: "Ventiladores y Disipadores", fabricante: "Cooler Master", precio: 70, atributos: { tamaño_ventilador: "120 mm", iluminacion_fan: "RGB Fijo / Monocromático", formato_venta_fan: "Kit de 2 Ventiladores", conexion_fan: "Molex / 3 pines", color_fan: "Blanco" } },
              { id: 44, categoria: "Ventiladores y Disipadores", fabricante: "Lian Li",    precio: 150, atributos: { tamaño_ventilador: "140 mm", iluminacion_fan: "ARGB", formato_venta_fan: "Kit de 3 Ventiladores", conexion_fan: "Conexión Magnética / Cadena", color_fan: "Blanco" } },
              { id: 45, categoria: "Ventiladores y Disipadores", fabricante: "Thermaltake", precio: 60, atributos: { tamaño_ventilador: "120 mm", iluminacion_fan: "Sin LED", formato_venta_fan: "Ventilador Individual", conexion_fan: "PWM de 4 pines", color_fan: "Negro" } },

              // ============================================================
              // 10. TARJETAS DE RED E INTERFACES - 5 productos
              // ============================================================
              { id: 46, categoria: "Tarjetas de Red", fabricante: "ASUS",        precio: 180, atributos: { interfaz_red: "PCIe", conectividad_red: "Wi-Fi + Bluetooth", generacion_wifi: "Wi-Fi 6E / 6", velocidad_lan: "2.5 Gbps", antenas_red: "Con Antena Externa Base", perfil_red: "Perfil Alto" } },
              { id: 47, categoria: "Tarjetas de Red", fabricante: "TP-Link",     precio: 120, atributos: { interfaz_red: "USB", conectividad_red: "Wi-Fi + Bluetooth", generacion_wifi: "Wi-Fi 7", velocidad_lan: "1 Gbps", antenas_red: "Con Antenas Directas", perfil_red: "Perfil Alto" } },
              { id: 48, categoria: "Tarjetas de Red", fabricante: "Intel",       precio: 250, atributos: { interfaz_red: "PCIe", conectividad_red: "Solo Wi-Fi", generacion_wifi: "Wi-Fi 7", velocidad_lan: "10 Gbps", antenas_red: "Con Antena Externa Base", perfil_red: "Perfil Bajo" } },
              { id: 49, categoria: "Tarjetas de Red", fabricante: "MSI",         precio: 80,  atributos: { interfaz_red: "M.2 Key E", conectividad_red: "Solo Bluetooth", generacion_wifi: "Wi-Fi 5", velocidad_lan: "1 Gbps", antenas_red: "Nano / Sin Antena Externa", perfil_red: "Perfil Bajo" } },
              { id: 50, categoria: "Tarjetas de Red", fabricante: "Gigabyte",    precio: 140, atributos: { interfaz_red: "PCIe", conectividad_red: "Ethernet", generacion_wifi: "Wi-Fi 6E / 6", velocidad_lan: "2.5 Gbps", antenas_red: "Con Antenas Directas", perfil_red: "Perfil Alto" } },

              // ============================================================
              // 11. MONITORES (PANTALLAS) - 5 productos
              // ============================================================
              { id: 51, categoria: "Monitores", fabricante: "LG",        precio: 1150, atributos: { tamaño_monitor: "27 pulgadas", resolucion_monitor: "Quad HD (1440p / 2K)", tasa_refresco: "165Hz - 180Hz", panel_monitor: "IPS (Colores precisos)", forma_monitor: "Plana", sincronizacion_monitor: "AMD FreeSync (Premium)" } },
              { id: 52, categoria: "Monitores", fabricante: "Samsung",   precio: 750,  atributos: { tamaño_monitor: "24 pulgadas o menos", resolucion_monitor: "Full HD (1080p)", tasa_refresco: "165Hz - 180Hz", panel_monitor: "VA (Mejor contraste)", forma_monitor: "Curva", sincronizacion_monitor: "AMD FreeSync (Premium)" } },
              { id: 53, categoria: "Monitores", fabricante: "ASUS",      precio: 1800, atributos: { tamaño_monitor: "32 pulgadas", resolucion_monitor: "4K Ultra HD", tasa_refresco: "100Hz - 144Hz", panel_monitor: "IPS (Colores precisos)", forma_monitor: "Plana", sincronizacion_monitor: "NVIDIA G-Sync (Compatible)" } },
              { id: 54, categoria: "Monitores", fabricante: "MSI",       precio: 1250, atributos: { tamaño_monitor: "27 pulgadas", resolucion_monitor: "Quad HD (1440p / 2K)", tasa_refresco: "240Hz", panel_monitor: "VA (Mejor contraste)", forma_monitor: "Curva", sincronizacion_monitor: "AMD FreeSync (Premium)" } },
              { id: 55, categoria: "Monitores", fabricante: "Gigabyte",  precio: 1450, atributos: { tamaño_monitor: "27 pulgadas", resolucion_monitor: "Quad HD (1440p / 2K)", tasa_refresco: "165Hz - 180Hz", panel_monitor: "IPS (Colores precisos)", forma_monitor: "Plana", sincronizacion_monitor: "NVIDIA G-Sync (Compatible)" } },

              // ============================================================
              // 12. TECLADOS - 5 productos
              // ============================================================
              { id: 56, categoria: "Teclados", fabricante: "Logitech",    precio: 330, atributos: { tipo_teclado: "Mecánico", formato_teclado: "Completo (100% / Con teclado numérico)", tipo_switch: "Switch Brown (Táctil / Intermedio)", conectividad_teclado: "Inalámbrico 2.4 GHz (Dongle USB / Sin retraso)", iluminacion_teclado: "RGB Zona / Fijo", idioma_teclado: "Español (Con tecla Ñ)" } },
              { id: 57, categoria: "Teclados", fabricante: "Razer",       precio: 480, atributos: { tipo_teclado: "Mecánico", formato_teclado: "TKL (80% / Sin teclado numérico)", tipo_switch: "Switch Green", conectividad_teclado: "Alámbrico (Cable USB)", iluminacion_teclado: "ARGB / RGB Per-Key (Tecla por tecla)", idioma_teclado: "Inglés (US Layout)" } },
              { id: 58, categoria: "Teclados", fabricante: "Corsair",     precio: 550, atributos: { tipo_teclado: "Óptico", formato_teclado: "Completo (100% / Con teclado numérico)", tipo_switch: "Switch Red (Lineal / Silencioso)", conectividad_teclado: "Alámbrico (Cable USB)", iluminacion_teclado: "ARGB / RGB Per-Key (Tecla por tecla)", idioma_teclado: "Español (Con tecla Ñ)" } },
              { id: 59, categoria: "Teclados", fabricante: "HyperX",      precio: 290, atributos: { tipo_teclado: "Semi-mecánico", formato_teclado: "Completo (100% / Con teclado numérico)", tipo_switch: "Switch Red (Lineal / Silencioso)", conectividad_teclado: "Inalámbrico 2.4 GHz (Dongle USB / Sin retraso)", iluminacion_teclado: "RGB Zona / Fijo", idioma_teclado: "Español (Con tecla Ñ)" } },
              { id: 60, categoria: "Teclados", fabricante: "SteelSeries", precio: 410, atributos: { tipo_teclado: "Mecánico", formato_teclado: "75% / 65% (Compacto con flechas)", tipo_switch: "Switch Brown (Táctil / Intermedio)", conectividad_teclado: "Bluetooth (Multidispositivo)", iluminacion_teclado: "ARGB / RGB Per-Key (Tecla por tecla)", idioma_teclado: "Inglés (US Layout)" } },

              // ============================================================
              // 13. RATONES (MOUSES) - 5 productos
              // ============================================================
              { id: 61, categoria: "Ratones", fabricante: "Logitech",   precio: 450, atributos: { conectividad_mouse: "Inalámbrico (2.4 GHz sin retraso)", peso_mouse: "Ligero (60g a 80g)", botones_mouse: "Estándar (5 a 6 botones)", sensor_mouse: "Óptico de Alta Precisión", diseno_mouse: "Para Diestros", iluminacion_mouse: "Sin Iluminación" } },
              { id: 62, categoria: "Ratones", fabricante: "Razer",      precio: 380, atributos: { conectividad_mouse: "Inalámbrico (2.4 GHz sin retraso)", peso_mouse: "Ultra Ligero (Menos de 60g)", botones_mouse: "Estándar (5 a 6 botones)", sensor_mouse: "Óptico de Alta Precisión", diseno_mouse: "Ambidextro / Simétrico", iluminacion_mouse: "RGB Direccionable (ARGB)" } },
              { id: 63, categoria: "Ratones", fabricante: "SteelSeries", precio: 320, atributos: { conectividad_mouse: "Alámbrico (Cable USB)", peso_mouse: "Estándar / Pesado (Más de 80g)", botones_mouse: "Multi-botón / MOBA-MMO (9 a 12+ botones)", sensor_mouse: "Láser", diseno_mouse: "Ergonómico Vertical", iluminacion_mouse: "RGB Fijo" } },
              { id: 64, categoria: "Ratones", fabricante: "Corsair",    precio: 290, atributos: { conectividad_mouse: "Alámbrico (Cable USB)", peso_mouse: "Ligero (60g a 80g)", botones_mouse: "Estándar (5 a 6 botones)", sensor_mouse: "Óptico de Alta Precisión", diseno_mouse: "Para Diestros", iluminacion_mouse: "RGB Direccionable (ARGB)" } },
              { id: 65, categoria: "Ratones", fabricante: "Logitech",   precio: 620, atributos: { conectividad_mouse: "Bluetooth (Oficina / Multidispositivo)", peso_mouse: "Ultra Ligero (Menos de 60g)", botones_mouse: "Estándar (5 a 6 botones)", sensor_mouse: "Óptico de Alta Precisión", diseno_mouse: "Ambidextro / Simétrico", iluminacion_mouse: "Sin Iluminación" } },

              // ============================================================
              // 14. AURICULARES Y DIADEMAS (HEADSETS) - 5 productos
              // ============================================================
              { id: 66, categoria: "Auriculares", fabricante: "Logitech",   precio: 280, atributos: { conectividad_headset: "Inalámbrico (2.4 GHz sin retraso)", formato_headset: "Over-Ear (Circumaural / Cubre toda la oreja)", sonido_headset: "Sonido Envolvente Virtual (7.1 Surround)", microfono_headset: "Micrófono Retráctil / Abatible", plataforma_headset: "PC / Mac", iluminacion_headset: "Con Iluminación RGB" } },
              { id: 67, categoria: "Auriculares", fabricante: "Razer",      precio: 350, atributos: { conectividad_headset: "Alámbrico (Jack 3.5mm / USB)", formato_headset: "Over-Ear (Circumaural / Cubre toda la oreja)", sonido_headset: "Sonido Estéreo (2.0)", microfono_headset: "Con Cancelación de Ruido (ENC)", plataforma_headset: "PlayStation (PS4 / PS5)", iluminacion_headset: "Con Iluminación RGB" } },
              { id: 68, categoria: "Auriculares", fabricante: "HyperX",     precio: 220, atributos: { conectividad_headset: "Alámbrico (Jack 3.5mm / USB)", formato_headset: "Over-Ear (Circumaural / Cubre toda la oreja)", sonido_headset: "Sonido Estéreo (2.0)", microfono_headset: "Micrófono Desmontable", plataforma_headset: "Xbox (One / Series X|S)", iluminacion_headset: "Sin Iluminación" } },
              { id: 69, categoria: "Auriculares", fabricante: "SteelSeries", precio: 420, atributos: { conectividad_headset: "Bluetooth (Consolas portátiles / Celular)", formato_headset: "On-Ear (Supraural / Se apoya en la oreja)", sonido_headset: "Sonido Envolvente Virtual (7.1 Surround)", microfono_headset: "Micrófono Retráctil / Abatible", plataforma_headset: "Nintendo Switch", iluminacion_headset: "Ediciones Especiales" } },
              { id: 70, categoria: "Auriculares", fabricante: "Corsair",    precio: 310, atributos: { conectividad_headset: "Inalámbrico (2.4 GHz sin retraso)", formato_headset: "Over-Ear (Circumaural / Cubre toda la oreja)", sonido_headset: "Sonido Envolvente Virtual (7.1 Surround)", microfono_headset: "Con Cancelación de Ruido (ENC)", plataforma_headset: "PC / Mac", iluminacion_headset: "Con Iluminación RGB" } },

              // ============================================================
              // 15. BOCINAS Y BARRAS DE SONIDO - 5 productos
              // ============================================================
              { id: 71, categoria: "Bocinas", fabricante: "Logitech",   precio: 180, atributos: { tipo_audio_bocina: "Bocinas Estándar (Sistema 2.0 / 2.1)", conectividad_bocina: "Alámbrico (Auxiliar 3.5mm / USB / Óptico)", subwoofer_bocina: "Con Subwoofer Externo (Inalámbrico / Alámbrico)", alimentacion_bocina: "Corriente Alterna (Enchufe de pared)", iluminacion_bocina: "Con Iluminación RGB" } },
              { id: 72, categoria: "Bocinas", fabricante: "Razer",      precio: 250, atributos: { tipo_audio_bocina: "Barra de Sonido (Diseño Horizontal)", conectividad_bocina: "Inalámbrico (Bluetooth)", subwoofer_bocina: "Con Subwoofer Integrado", alimentacion_bocina: "Por USB", iluminacion_bocina: "Sin Iluminación" } },
              { id: 73, categoria: "Bocinas", fabricante: "Creative",   precio: 380, atributos: { tipo_audio_bocina: "Sonido Envolvente (Sistema 5.1 o superior)", conectividad_bocina: "Alámbrico (Auxiliar 3.5mm / USB / Óptico)", subwoofer_bocina: "Con Subwoofer Externo (Inalámbrico / Alámbrico)", alimentacion_bocina: "Corriente Alterna (Enchufe de pared)", iluminacion_bocina: "Con Iluminación RGB" } },
              { id: 74, categoria: "Bocinas", fabricante: "Samsung",    precio: 450, atributos: { tipo_audio_bocina: "Barra de Sonido (Diseño Horizontal)", conectividad_bocina: "Inalámbrico (Bluetooth)", subwoofer_bocina: "Con Subwoofer Externo (Inalámbrico / Alámbrico)", alimentacion_bocina: "Batería Recargable (Portátil)", iluminacion_bocina: "Sin Iluminación" } },
              { id: 75, categoria: "Bocinas", fabricante: "JBL",        precio: 120, atributos: { tipo_audio_bocina: "Bocinas Estándar (Sistema 2.0 / 2.1)", conectividad_bocina: "Inalámbrico (Bluetooth)", subwoofer_bocina: "Sin Subwoofer", alimentacion_bocina: "Batería Recargable (Portátil)", iluminacion_bocina: "Sin Iluminación" } },

              // ============================================================
              // 16. CÁMARAS WEB (WEBCAMS) - 5 productos
              // ============================================================
              { id: 76, categoria: "Cámaras Web", fabricante: "Logitech",  precio: 380, atributos: { resolucion_webcam: "4K Ultra HD (Streaming profesional)", fps_webcam: "60 FPS o más", enfoque_webcam: "Enfoque Automático", iluminacion_webcam: "Sin Iluminación", privacidad_webcam: "Con Cubierta de Privacidad", conectividad_webcam: "Cable USB-C" } },
              { id: 77, categoria: "Cámaras Web", fabricante: "Razer",     precio: 280, atributos: { resolucion_webcam: "2K / 1440p (Alta definición)", fps_webcam: "60 FPS o más", enfoque_webcam: "Enfoque Automático", iluminacion_webcam: "Con Aro de Luz LED", privacidad_webcam: "Con Cubierta de Privacidad", conectividad_webcam: "Cable USB-A" } },
              { id: 78, categoria: "Cámaras Web", fabricante: "Microsoft", precio: 150, atributos: { resolucion_webcam: "Full HD (1080p / Estándar)", fps_webcam: "30 FPS", enfoque_webcam: "Enfoque Fijo", iluminacion_webcam: "Sin Iluminación", privacidad_webcam: "Compatible con Windows Hello", conectividad_webcam: "Cable USB-A" } },
              { id: 79, categoria: "Cámaras Web", fabricante: "ASUS",      precio: 320, atributos: { resolucion_webcam: "4K Ultra HD (Streaming profesional)", fps_webcam: "60 FPS o más", enfoque_webcam: "Enfoque Automático", iluminacion_webcam: "Con Aro de Luz LED", privacidad_webcam: "Con Cubierta de Privacidad", conectividad_webcam: "Cable USB-C" } },
              { id: 80, categoria: "Cámaras Web", fabricante: "Creative",  precio: 90,  atributos: { resolucion_webcam: "HD (720p / Económico)", fps_webcam: "30 FPS", enfoque_webcam: "Enfoque Fijo", iluminacion_webcam: "Sin Iluminación", privacidad_webcam: "Con Cubierta de Privacidad", conectividad_webcam: "Cable USB-A" } },
          ];
      procesarFiltros();
    } catch (error) {
      console.error("Error al cargar los productos:", error);
    }
  }

  function procesarFiltros() {
    if(!container) return;
    if (!estado.categoriaActual) {
      renderizarUI({});
      return;
    }

    let productosCategoria = productosBase.filter(p => p.categoria === estado.categoriaActual);
    const permitidos = [...FILTROS_GLOBALES, ...(REGLAS_DE_DEPENDENCIA[estado.categoriaActual]?.activa || [])];

    let productosFiltradosFinal = productosCategoria.filter(p => {
      let pasaFiltro = true;
      for (const [clave, valores] of Object.entries(estado.filtrosSeleccionados)) {
        if (valores.length === 0) continue;
        const valorProducto = clave === 'fabricante' ? p[clave] : p.atributos[clave];
        if (!valores.includes(valorProducto)) {
          pasaFiltro = false;
          break;
        }
      }
      return pasaFiltro;
    });

    let opcionesDisponibles = {};
    permitidos.forEach(attr => opcionesDisponibles[attr] = {});

    productosFiltradosFinal.forEach(p => {
      permitidos.forEach(attr => {
        const valor = attr === 'fabricante' ? p[attr] : p.atributos[attr];
        if (valor) {
          opcionesDisponibles[attr][valor] = (opcionesDisponibles[attr][valor] || 0) + 1;
        }
      });
    });

    renderizarUI(opcionesDisponibles);
    actualizarContadorGlobal();
  }

  function renderizarUI(opcionesDisponibles) {
    container.innerHTML = '';

    for (const [macroCategoria, categorias] of Object.entries(JERARQUIA_CATEGORIAS)) {
      
      const macroDetails = document.createElement('details');
      macroDetails.className = 'macro-category-group';
      macroDetails.style.marginBottom = '12px'; // Espaciado macro
      
      if (categorias.includes(estado.categoriaActual)) {
        macroDetails.open = true;
      }

      const macroSummary = document.createElement('summary');
      macroSummary.textContent = macroCategoria;
      macroSummary.style.fontWeight = 'bold';
      macroSummary.style.cursor = 'pointer';
      macroDetails.appendChild(macroSummary);

      const macroContent = document.createElement('div');
      macroContent.style.paddingLeft = '15px'; 

      categorias.forEach(catNombre => {
        const catDetails = document.createElement('details');
        catDetails.className = 'category-group';
        catDetails.style.margin = '2px 0'; // Aquí damos la separación de 2px que pediste
        
        const catSummary = document.createElement('summary');
        catSummary.textContent = catNombre;
        catSummary.style.cursor = 'pointer';
        catSummary.style.padding = '4px 0'; // Para que no se vea tan pegado verticalmente

        catSummary.addEventListener('click', (e) => {
          if (estado.categoriaActual !== catNombre) {
            e.preventDefault();
            estado.categoriaActual = catNombre;
            estado.filtrosSeleccionados = {}; 
            procesarFiltros(); 
          }
        });

        catDetails.appendChild(catSummary);

        if (estado.categoriaActual === catNombre) {
          catDetails.open = true; 
          catSummary.style.color = '#C6FF3D'; 
          catSummary.style.fontWeight = 'bold';

          const filtersContainer = document.createElement('div');
          filtersContainer.style.paddingLeft = '15px'; 
          filtersContainer.style.borderLeft = '2px solid #eee';
          filtersContainer.style.marginTop = '8px';

          Object.keys(opcionesDisponibles).forEach(attrClave => {
            const opcionesMap = opcionesDisponibles[attrClave];
            const opcionesKeys = Object.keys(opcionesMap);

            if (opcionesKeys.length === 0) return;
            opcionesKeys.sort((a, b) => opcionesMap[b] - opcionesMap[a]);

            const titulo = NOMBRES_LEGIBLES[attrClave] || attrClave;

            const filterDetails = document.createElement('details');
            filterDetails.className = 'filter-group';
            filterDetails.open = true;
            filterDetails.style.marginBottom = '8px';

            const filterSummary = document.createElement('summary');
            filterSummary.textContent = titulo;
            filterSummary.style.fontSize = '0.9em';
            filterSummary.style.color = '#555';
            filterDetails.appendChild(filterSummary);

            const divOptions = document.createElement('div');
            divOptions.className = 'filter-options';
            divOptions.style.paddingLeft = '10px';

            opcionesKeys.forEach(valor => {
              const cantidad = opcionesMap[valor];
              const isChecked = estado.filtrosSeleccionados[attrClave]?.includes(valor) || false;

              const label = document.createElement('label');
              label.style.display = 'block';
              label.style.fontSize = '0.85em';
              label.style.marginTop = '2px'; // Los 2px de separación en las opciones
              label.style.marginBottom = '2px';
              
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.value = valor;
              checkbox.checked = isChecked;

              checkbox.addEventListener('change', (e) => {
                if (!estado.filtrosSeleccionados[attrClave]) {
                  estado.filtrosSeleccionados[attrClave] = [];
                }
                if (e.target.checked) {
                  estado.filtrosSeleccionados[attrClave].push(valor);
                } else {
                  estado.filtrosSeleccionados[attrClave] = estado.filtrosSeleccionados[attrClave].filter(v => v !== valor);
                }
                procesarFiltros();
              });

              label.appendChild(checkbox);
              label.appendChild(document.createTextNode(` ${valor} (${cantidad})`));
              divOptions.appendChild(label);
            });

            filterDetails.appendChild(divOptions);
            filtersContainer.appendChild(filterDetails);
          });

          catDetails.appendChild(filtersContainer);
        }

        macroContent.appendChild(catDetails);
      });

      macroDetails.appendChild(macroContent);
      container.appendChild(macroDetails);
    }
  }

  function actualizarContadorGlobal() {
    let totalSeleccionados = 0;
    Object.values(estado.filtrosSeleccionados).forEach(arr => {
      totalSeleccionados += arr.length;
    });
    if (filterCountLabel) {
      filterCountLabel.textContent = `(${totalSeleccionados})`;
    }
  }

  cargarProductos();

  document.getElementById('btnClearFilters')?.addEventListener('click', () => {
    estado.filtrosSeleccionados = {};
    procesarFiltros();
  });

});