# 🌍 Plataforma de Monitoreo Ambiental IoT (OpenAQ V3)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

Plataforma analítica avanzada para el monitoreo de calidad del aire en tiempo real. Este dashboard interactivo consume datos telemétricos globales a través de la API REST de OpenAQ y gestiona la autenticación de usuarios mediante Firebase de Google. 

El proyecto cuenta con un diseño UI/UX de grado industrial inspirado en el Dark Mode de GitHub, arquitectura responsiva (Mobile-First) y visualización geoespacial de sensores ambientales.

## Características Principales

*   **Autenticación Segura (Firebase Auth):** Sistema de registro/inicio de sesión con validación de contraseñas de alta seguridad y acceso OAuth (Google Sign-In).
*   **Mapeo Geoespacial (Google Maps API):** Visualización interactiva de nodos y estaciones de monitoreo a nivel global.
*   **Búsqueda Espacial (Bounding Box):** Herramienta de trazado de cuadrantes en el mapa para extraer telemetría específica por área geográfica.
*   **Analítica de Datos (Chart.js):** Renderizado reactivo de gráficos de líneas y barras para evaluar mediciones de sensores y patrones históricos.
*   **Arquitectura Escalable:** Estructura de carpetas modularizada (`components`, `pages`, `services`) con protección de rutas privadas mediante `react-router-dom`.
*   **Diseño Responsivo:** Interfaz adaptable con barra lateral colapsable dinámica según el tamaño del dispositivo.

## Stack Tecnológico

*   **Frontend:** React (Hooks: `useState`, `useEffect`, `useMemo`)
*   **Build Tool:** Vite
*   **Routing:** React Router DOM
*   **Backend / BaaS:** Firebase (Authentication, Realtime Database)
*   **Peticiones HTTP:** Axios
*   **Visualización:** React Google Maps API (`@react-google-maps/api`)
*   **Gráficos:** Chart.js (`react-chartjs-2`)
*   **Estilos:** Bootstrap Grid + CSS Custom (GitHub Dark Theme)

## Estructura del Proyecto

El repositorio sigue una arquitectura de componentes y servicios organizada para maximizar la escalabilidad:

```text
DASHBOARD-NUEVO/
├── public/                  # Recursos estáticos públicos
├── src/                     # Código fuente principal
│   ├── assets/              # Imágenes y recursos multimedia
│   ├── components/          # Componentes modulares y de UI
│   │   ├── AlertasActivas.jsx
│   │   ├── BusquedaPorArea.jsx
│   │   ├── GraficosEnLinea.jsx
│   │   ├── TablaDatos.jsx
│   │   └── TarjetasIoT.jsx
│   ├── pages/               # Vistas orquestadas por el Router
│   │   ├── Auth.jsx
│   │   └── Landing.jsx
│   ├── services/            # Lógica de consumo de APIs externas
│   ├── App.css              # Estilos principales de la aplicación
│   ├── App.jsx              # Orquestador principal y protección de rutas
│   ├── firebase.js          # Configuración y conexión con Google Firebase
│   ├── index.css            # Estilos globales
│   └── main.jsx             # Punto de entrada de React
├── .env                     # Variables de entorno (Oculto en repositorio)
├── .gitattributes           # Configuración de atributos de Git
├── .gitignore               # Archivos ignorados por el control de versiones
├── eslint.config.js         # Reglas de validación de código (Linter)
├── index.html               # Plantilla principal HTML5
├── package-lock.json        # Árbol de dependencias bloqueado
├── package.json             # Manifiesto del proyecto y scripts
├── README.md                # Documentación del proyecto
├── vercel.json              # Configuración de despliegue en Vercel
└── vite.config.js           # Configuración del empaquetador Vite