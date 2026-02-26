# QMX - Qwen Multi-agent eXtension

> Capa de orquestación multi-agente para Qwen Code CLI

[![npm version](https://img.shields.io/npm/v/qmx.svg)](https://www.npmjs.com/package/qmx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[English](README.md)** | [简体中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | **Español**

## 🚀 Inicio Rápido

```bash
# Instalar globalmente
npm install -g qmx

# Configurar proyecto
qmx setup

# Verificar instalación
qmx doctor

# Iniciar QMX
qmx
```

## ✨ Características

### 🎭 Agentes Especializados (30+)

Accede a agentes especializados vía `/prompts:name`:

- `/prompts:architect` - Diseño y revisión de arquitectura
- `/prompts:planner` - Descomposición de tareas
- `/prompts:executor` - Implementación y generación de código
- `/prompts:debugger` - Depuración y corrección
- `/prompts:reviewer` - Revisión de código
- `/prompts:security` - Auditoría de seguridad

### ⚡ Habilidades de Flujo de Trabajo (40+)

Ejecuta habilidades con sintaxis `$name`:

- `$plan` - Descomponer tareas complejas
- `$team` - Lanzar equipos paralelos
- `$review` - Revisión completa de código
- `$test` - Generar pruebas
- `$refactor` - Refactorización segura

### 🏢 Orquestación de Equipos

```bash
# Desde terminal
qmx team 4:executor "Paralelizar refactorización"
qmx team status my-team
qmx team shutdown my-team

# En Qwen Code
$team 3:reviewer "Revisar cambios del PR"
```

## 📦 Instalación

### Requisitos

- **SO:** macOS, Linux, o Windows (vía WSL2)
- **Node.js:** >= 20.0.0
- **Qwen Code CLI:** Instalado y autenticado
- **tmux:** Requerido para modo equipo (v3.0+)

### Instalación Rápida

```bash
npm install -g qmx
qmx setup
qmx doctor
```

## 📖 Uso

### Comandos de Lanzamiento

```bash
# Estándar
qmx

# Con esfuerzo de razonamiento
qmx --high        # Alto
qmx --xhigh       # Extra alto

# Modo YOLO (sin aprobaciones)
qmx --yolo
```

### En Qwen Code

```bash
# Usar agentes especializados
/prompts:architect "Analizar límites de autenticación"
/prompts:executor "Implementar validación de entrada"

# Ejecutar habilidades
$plan "Publicar callback OAuth de forma segura"
$team 3:executor "Corregir errores de TypeScript"
```

## 🤝 Contribuyendo

¡Las contribuciones son bienvenidas! Ver [CONTRIBUTING.md](CONTRIBUTING.md) para directrices.

## 📄 Licencia

Licencia MIT - Ver [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- Inspirado por [oh-my-claudecode](https://github.com/oh-my-claudecode/oh-my-claudecode)
- Construido para la comunidad de Qwen Code

---

**Hecho con ❤️ para la comunidad de Qwen Code**
