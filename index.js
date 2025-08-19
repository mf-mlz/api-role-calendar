/* Modules [env, mysql, express] */
const dotenv = require("dotenv");
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();
const { random } = require("lodash");
const cors = require("cors");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda");

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
  id: 100,
  name: "NoAplica",
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
/* Si faltan menos o igual a 10 días => Agarramos el mes siguiente */
month = daysUntilLastSunday <= 10 ? month + 1 : month;

const numberOfDaysInMonth = new Date(currentYear, month, 0).getDate();
const sundaysAndThursdayInMonth = [];
const dateCurrently = new Date().toISOString().split(".")[0];

const months = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};


for (let day = 1; day <= numberOfDaysInMonth; day++) {
  const date = new Date(currentYear, month - 1, day);
  let obj = {};
  if (date.getDay() === 0 || date.getDay() === 4) {
    obj.dayWeek = date.getDay();
    obj.day = day;
    sundaysAndThursdayInMonth.push(obj);
  }
}

sundaysAndThursdayInMonth.sort((a, b) => {
  if (a.dayWeek !== b.dayWeek) {
    return a.dayWeek - b.dayWeek;
  }
  return a.day - b.day;
});

const countSundays = sundaysAndThursdayInMonth.filter(
  (d) => d.dayWeek === 0
).length;
const countThursdays = sundaysAndThursdayInMonth.filter(
  (d) => d.dayWeek === 4
).length;

/* Function Get Last Sunday of Month */
function getLastSundayOfMonth(year, month) {
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const lastSunday = new Date(lastDayOfMonth);
  lastSunday.setDate(lastDayOfMonth.getDate() - lastDayOfWeek);

  return lastSunday.getDate();
}

function getRandomNumbersNoConsecutive(count, min, max) {
  const result = [];
  let lastNumber = null;

  for (let i = 0; i < count; i++) {
    let num;
    do {
      num = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (num === lastNumber);

    result.push(num);
    lastNumber = num;
  }

  return result;
}

/* Module API REST [GET] */

app.get("/birthdaysNotify", async (req, res) => {
  birthdaysNotify(res);
});

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

//Get Roles Bienvenida Niños to currently month => year
app.get("/rolesbn", async (req, res) => {
  generateRoles(res, "rolesbn", "usersbn");
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

/* Get birthdays */
app.get("/birthdays", async (req, res) => {
  try {
    const db = await connection.getConnection();

    const monthSelected = req.query.month || month;

    const sql = "SELECT * FROM `birthdays` WHERE month = ?";
    const [rows] = await db.execute(sql, [monthSelected]);

    res.status(200).send(rows);
    db.release();
  } catch (err) {
    res.status(500).send(err);
  }
});

/* Function Notify Birthdays */
async function birthdaysNotify(res) {
  let conn;
  try {
    conn = await connection.getConnection();

    const [rows] = await conn.execute(
      "SELECT day, name, month FROM birthdays WHERE day = DAY(CURDATE()) AND month = MONTH(CURDATE())"
    );

    let mensaje = "";
    if (rows.length > 0) {
      rows.forEach((r) => {
        mensaje += `\n🥳🎂 *-${encodeURIComponent(r.name.toUpperCase())}*\n Link de Descarga: https://calendar-role-mfmlz.netlify.app/generateImg/${r.name}/${r.day}/${months[r.month]}/${currentYear} \n`;
      });
    } else {
      mensaje = "Hoy no hay cumpleaños.";
    }
    res.send({ message: mensaje });
  } catch (err) {
    console.error("Error en birthdaysNotify:", err.message);
    if (!res.headersSent) {
      res.status(500).send({ success: false, error: err.message });
    }
  } finally {
    if (conn) await conn.release();
  }
}

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
      /* Usuarios Activos de ese Rol */
      const sql =
        "SELECT * FROM " +
        nameUser +
        " WHERE status = 1 AND (sunday = 1 OR thursday = 1)";
      const [rows, fields] = await db.execute(sql);
      let usersRole = [];
      let cantNumbers = getRandomNumbersNoConsecutive(
        sundaysAndThursdayInMonth.length,
        0,
        rows.length - 1
      );

      /* Si es el Rol de Bienvenida => primero es un niño ya los demas es normal */
      if (nameRol === "rolesb") {
        const sqlChildren =
          "SELECT * FROM usersbn WHERE status = 1 AND sunday = 1 ORDER BY RAND() LIMIT 1;";
        const [rowsChildren] = await db.execute(sqlChildren);

        if (rowsChildren.length > 0) {
          usersRole.push(rowsChildren[0]);
        }

        for (let j = 0; j < cantNumbers.length; j++) {
          if (rows[cantNumbers[j]]) {
            usersRole.push(rows[cantNumbers[j]]);
          }
        }
      } else if (nameRol === "rolessc") {
        usersRole.push(rows[Math.floor(Math.random() * rows.length)]);
      } else {
        /* Para los Demás Roles Obtenemos (n) Usuarios al azar para formar nuestro arreglo al azar */
        for (let j = 0; j < cantNumbers.length; j++) {
          if (rows[cantNumbers[j]]) {
            usersRole.push(rows[cantNumbers[j]]);
          }
        }
      }

      /* Armamos el Arreglo Final */
      const arrUsersFinal = [];
      let lastUserName = null;

      for (let j = 0; j < sundaysAndThursdayInMonth.length; j++) {
        const dayInfo = sundaysAndThursdayInMonth[j];
        let objUser = [];
        let possibleUsers = [];

        if (dayInfo.dayWeek === 0)
          possibleUsers = usersRole.filter((u) => u.sunday === 1);
        if (dayInfo.dayWeek === 4)
          possibleUsers = usersRole.filter((u) => u.thursday === 1);

        let randomUser;
        if (nameRol === "rolesb" && j === 0) {
          randomUser = possibleUsers[0];
        } else if (possibleUsers.length > 0) {
          do {
            randomUser =
              possibleUsers[Math.floor(Math.random() * possibleUsers.length)];
          } while (
            randomUser.name === lastUserName &&
            possibleUsers.length > 1
          );
        }

        if (randomUser) {
          objUser = [randomUser.name, dayInfo.day, month, currentYear];
          lastUserName = randomUser.name;
 
          if (nameRol === "rolesn" && dayInfo.dayWeek !== 0) {
            continue;
          }

          if (nameRol === "rolessc" && arrUsersFinal.length > 0) {
            break;
          }

          arrUsersFinal.push(objUser);
        }
      }

      let count = 0;
      for (const userData of arrUsersFinal) {
        const insertSql = `INSERT INTO ${nameRol} (name_user, day, month, year, created_at)  VALUES (?, ?, ?, ?, ?)`;

        const [name, day, monthValue, yearValue] = userData;
        const createdAt = new Date();

        await db.execute(insertSql, [
          name,
          day,
          monthValue,
          yearValue,
          createdAt,
        ]);

        count++;
      }

      /* Regresamos los registros de los roles */
      const [rowsRolsB, fieldsRolsB] = await db.execute(sqlVerify, [
        month,
        currentYear,
      ]);
      res.status(200).send(rowsRolsB);
      db.release();
    } else {
      res.status(200).send(rowsVerify);
    }
  } catch (err) {
    res.status(500).send(err);
  }
}

const port = process.env.port || 4000;
app.listen(port, () => console.log("Escuchando en el puerto " + port));
