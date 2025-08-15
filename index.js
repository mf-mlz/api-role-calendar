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

function shuffleFair(array, nameRol) {
  const arr = [...array];
  const result = [];

  for (let i = 0; i <= sundaysAndThursdayInMonth.length; i++) {
    const lastId = result.length === 0 ? null : result[result.length - 1].id;
    let choices = lastId === null ? arr : arr.filter((u) => u.id !== lastId);

    if (choices.length === 0) choices = arr;

    const randomIndex = Math.floor(Math.random() * choices.length);
    let selected =
      nameRol === "rolesb" && i === 0 ? arr[0] : choices[randomIndex];

    result.push(selected);

    if (nameRol === "rolesb" && i === 0) {
      arr.shift();
    }
  }

  return result;
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

// Get birthdays
app.get("/birthdays", async (req, res) => {
  try {
    const db = await connection.getConnection();

    /*  Obtener los roles del Mes */
    const sql = "SELECT * FROM `birthdays` WHERE month = ?";
    const [rows, fields] = await db.execute(sql, [month]);
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

    // Obtener los cumpleaños del día
    const [rows] = await conn.execute(
      "SELECT name FROM birthdays WHERE day = DAY(CURDATE()) AND month = MONTH(CURDATE())"
    );

    // Construir mensaje
    let mensaje = "";
    if (rows.length > 0) {
      mensaje =
        "🥳🎂 Hoy hay Cumpleaños de los siguientes hermanos de la Iglesia:\n\n";
      rows.forEach((r) => {
        mensaje += "*- " + r.name.toUpperCase() + "*\n";
      });
    } else {
      mensaje = "❌ Hoy no hay cumpleaños.";
    }

    // Responder inmediatamente
    res.send({
      success: true,
      message: "El envío de WhatsApp se está procesando: \n" + mensaje,
    });

    // Preparar URL de CallMeBot
    const telefono = process.env.phone;
    const apikey = process.env.key;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${telefono}&text=${encodeURIComponent(
      mensaje
    )}&apikey=${apikey}`;

    // Enviar mensaje usando Puppeteer en background
    (async () => {
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await browser.close();
      console.log("Mensaje enviado con Puppeteer + chrome-aws-lambda");
    })();
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
        // Primer domingo: obtener un niño aleatorio
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

        // Filtrado por día
        if (dayInfo.dayWeek === 0)
          possibleUsers = usersRole.filter((u) => u.sunday === 1);
        if (dayInfo.dayWeek === 4)
          possibleUsers = usersRole.filter((u) => u.thursday === 1);

        // --- rolesb: en j === 0 tomar directamente el índice 0 ---
        let randomUser;
        if (nameRol === "rolesb" && j === 0) {
          randomUser = possibleUsers[0]; // primer usuario
        } else if (possibleUsers.length > 0) {
          // elegir random evitando repetir consecutivo
          do {
            randomUser =
              possibleUsers[Math.floor(Math.random() * possibleUsers.length)];
          } while (
            randomUser.name === lastUserName &&
            possibleUsers.length > 1
          );
        }

        // Si se encontró usuario válido
        if (randomUser) {
          objUser = [randomUser.name, dayInfo.day, month, currentYear];
          lastUserName = randomUser.name;

          // rolesn → solo domingos
          if (nameRol === "rolesn" && dayInfo.dayWeek !== 0) {
            continue;
          }

          // rolessc → solo un registro
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
