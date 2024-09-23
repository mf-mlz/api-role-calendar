/* Modules [env, mysql, express] */
const dotenv = require("dotenv");
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();
const { random } = require("lodash");
const cors = require("cors");

app.use(cors());

/* Module [Config, Connection] */
dotenv.config();

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.use(express.json());

/* Day => Month => Year */
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
let month = currentMonth + 1;
const currentYear = currentDate.getFullYear();
/* Global User => No Aplica */
const userNotApplied = {
  id: 10,
  name: "No Aplica",
  status: 1,
  created_at: "2024-09-23T01:23:11.997Z",
  updated_at: "2024-09-23T01:23:11.997Z",
};

const lastSundayOfMonth = getLastSundayOfMonth(
  currentYear,
  currentDate.getMonth()
);
/* Num. Days for last sunday of the month */
const daysUntilLastSunday = lastSundayOfMonth - currentDate.getDate();
/* Si faltan menos o igual a 7 días => Agarramos el mes siguiente */
month = daysUntilLastSunday <= 7 ? month + 1 : month;

const numberOfDaysInMonth = new Date(currentYear, month, 0).getDate();
const sundaysInMonth = [];
const dateCurrently = new Date().toISOString().split(".")[0];

for (let day = 1; day <= numberOfDaysInMonth; day++) {
  const date = new Date(currentYear, month - 1, day);
  if (date.getDay() === 0) {
    sundaysInMonth.push(day);
  }
}

/* Function Get Last Sunday of Month */
function getLastSundayOfMonth(year, month) {
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const lastSunday = new Date(lastDayOfMonth);
  lastSunday.setDate(lastDayOfMonth.getDate() - lastDayOfWeek);

  return lastSunday.getDate();
}

/* Module API REST [GET] */

//Get Roles Bienvenida to currently month => year
app.get("/rolesb", async (req, res) => {
  generateRoles(res, "rolesb", "usersb");
});

//Get Roles Limpieza to currently month => year
app.get("/rolesl", async (req, res) => {
  generateRoles(res, "rolesl", "usersl");
});

//Get Roles Oración to currently month => year
app.get("/roleso", async (req, res) => {
  generateRoles(res, "roleso", "userso");
});

//Get Roles Niños to currently month => year
app.get("/rolesn", async (req, res) => {
  generateRoles(res, "rolesn", "usersn");
});

//Get Roles Domingo Oración to currently month => year
app.get("/rolesdo", async (req, res) => {
  generateRoles(res, "rolesdo", "usersdo");
});

//Get Roles Santa Cena to currently month => year
app.get("/rolessc", async (req, res) => {
  generateRoles(res, "rolessc", "userssc");
});

//Get Events
app.get("/events", async (req, res) => {
  try {
    const db = await connection.getConnection();

    /*  Obtener los roles del Mes */
    const sql = "SELECT * FROM `events` WHERE month = ? AND year = ?";
    const [rows, fields] = await db.execute(sql, [month, currentYear]);
    res.status(200).send(rows);
    db.release();
  } catch (err) {
    res.status(500).send(err);
  }
});

/* Function Add or Select Querys */
async function generateRoles(res, nameRol, nameUser) {
  try {
    const db = await connection.getConnection();

    /* Por seguridad que no se dupliquen los datos, verificamos si en la Tabla roles  ya exiten registros les año y mes actual, de ser así, ya no ejectamos ninguna inserción  */
    const sqlVerify =
      "SELECT * FROM `" + nameRol + "` WHERE month = ? AND year = ?";
    const [rowsVerify, fieldsVerify] = await db.execute(sqlVerify, [
      month,
      currentYear,
    ]);

    if (rowsVerify.length === 0) {
      const sql = "SELECT * FROM " + nameUser + " WHERE status = 1";
      const [rows, fields] = await db.execute(sql);

      const randomUsers = [];

      /* Si es RolesO => Sólo hay 2 por el momento */
      if (nameRol === "rolesl") {
        for (let index = 0; index < sundaysInMonth.length; index++) {
          const selectedUser = userNotApplied;
          randomUsers.push(selectedUser);
        }
        /* Si el rol es sc => Sólo poner el primer Domingo */
      } else if (nameRol === "rolessc") {
        for (let index = 0; index < sundaysInMonth.length; index++) {
          if (index == 0) {
            const randomIndex = random(0, rows.length - 1);
            const selectedUser = rows.splice(randomIndex, 1)[0];
            randomUsers.push(selectedUser);
          } else {
            selectedUser = userNotApplied;
            randomUsers.push(selectedUser);
          }
        }
      } else {
        /* Para los Demás Roles Obtenemos (n) Usuarios al azar para formar nuestro arreglo al azar, borrando el usuario Seleccionado para evitar duplicar */
        for (let index = 0; index < sundaysInMonth.length; index++) {
          const randomIndex = random(0, rows.length - 1);
          const selectedUser = rows.splice(randomIndex, 1)[0];
          if (selectedUser) {
            randomUsers.push(selectedUser);
          }
        }
      }

      /* Si no hay suficientes usuarios para el rol debemos duplicar el arreglo hasta obtener el (N) número de Domingos para completar el mes */
      if (randomUsers.length < sundaysInMonth.length) {
        const numUserMissing =
          parseInt(sundaysInMonth.length) - parseInt(randomUsers.length);
        for (let index = 0; index < numUserMissing; index++) {
          const randomIndex = random(0, randomUsers.length - 1);
          const selectedUserMissing = randomUsers[randomIndex];
          if (selectedUserMissing) {
            randomUsers.push(selectedUserMissing);
          }
        }
      }

      /* Los insertamos en la BD en la Tabla [roles]  */
      let count = 0;
      for (const user of randomUsers) {
        const insertSql =
          "INSERT INTO " +
          nameRol +
          " (name_user, day, month, year, created_at) VALUES (?, ?, ?, ?, ?)";
        await db.execute(insertSql, [
          user.name,
          sundaysInMonth[count],
          month,
          currentYear,
          dateCurrently,
        ]);
        count++;
      }

      /* Regresamos los registros de los roles */
      const [rowsRolsB, fieldsRolsB] = await db.execute(sqlVerify, [
        month,
        currentYear,
      ]);
      res.status(200).send(rowsRolsB);
    } else {
      res.status(200).send(rowsVerify);
    }

    db.release();
  } catch (err) {
    res.status(500).send(err);
  }
}

const port = process.env.port || 4000;
app.listen(port, () => console.log("Escuchando en el puerto " + port));
