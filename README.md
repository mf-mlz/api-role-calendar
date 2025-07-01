# api-role-calendar

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v16-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)

---

## 📅 Descripción

**api-role-calendar** es la API oficial para la gestión de roles mensuales en la iglesia **LCDC** (La Casa de Dios en Cristo). Desarrollada con **Node.js** y respaldada por una base de datos **MySQL**, esta API permite administrar los roles asignados a los miembros por mes, facilitando la organización y el control del calendario de actividades eclesiásticas.

---

## 🔗 Repositorio

El proyecto está disponible en GitHub:  
[https://github.com/mf-mlz/api-role-calendar](https://github.com/mf-mlz/api-role-calendar)

---

## ⚙️ Tecnologías

- Node.js
- Express.js
- MySQL
- dotenv
- Otros módulos listados en `package.json`

---

## 🚀 Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/mf-mlz/api-role-calendar.git
   cd api-role-calendar

   ```

2. Instala las dependencias:

   ```bash
   npm install

   ```

3. Configura las variables de entorno:

   ```bash
   DB_HOST=host
   DB_USER=user
   DB_PASSWORD=password
   DB_DATABASE=namedatabase
   DB_PORT=3306

   ```

4. Inicializa la base de datos (No se comparte).

5. Levanta el servidor:
   ```bash
   npm start
   nodemon index.js
   ```

📚 Uso
Endpoints principales
| Método | Ruta | Descripción |
|--------|--------------------|------------------------------------------------|
| GET    | /rolesb            | Obtener los roles de Bienvenida                |
| GET    | /rolesbn           | Obtener los roles de Bienvenida de los Niños   |
| GET    | /rolessc           | Obtener los roles de la Santa Cena             |
| GET    | /rolesl            | Obtener los roles de limpieza                  |
| GET    | /events            | Obtener los eventos del mes                    |

📄 Licencia
Este proyecto está bajo licencia MIT. Consulta el archivo LICENSE para más detalles.

👤 Autor
María Fernanda Martínez Labra – GitHub mf-mlz – maryfermtzlb@gmail.com