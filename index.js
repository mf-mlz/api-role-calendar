
/* Modules [env, mysql, express] */
const dotenv = require('dotenv');
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const { random } = require('lodash');


/* Module [Config, Connection] */
dotenv.config();

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});


app.use(express.json());

/* Day => Month => Year */
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const month = currentMonth + 1;
const currentYear = currentDate.getFullYear();
const numberOfDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const sundaysInMonth = [];

for (let day = 1; day <= numberOfDaysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    if (date.getDay() === 0) {
        sundaysInMonth.push(day);
    }
}


/* Module API REST [GET] */

//Get Roles Bienvenida to currently month => year
app.get('/rolesb', async (req, res) => {
    try {
        const db = await connection.getConnection();

        /* Por seguridad que no se dupliquen los datos, verificamos si en la Tabla rolesB 
           ya exiten registros les año y mes actual, de ser así, ya no ejectamos ninguna inserción 
        */
        const sqlVerify = 'SELECT * FROM `rolesb` WHERE month = ? AND year = ?';
        const [rowsVerify, fieldsVerify] = await db.execute(sqlVerify, [month, currentYear]);

        if (rowsVerify.length === 0) {
            const sql = 'SELECT * FROM usersb WHERE status = 1';
            const [rows, fields] = await db.execute(sql);
            const randomUsers = [];

            /* Obtenemos 4 Usuarios al azar para formar nuestro arreglo al azar, borrando el usuario Seleccionado para evitar duplicar */
            for (let index = 0; index < 4; index++) {
                const randomIndex = random(0, rows.length - 1);
                const selectedUser = rows.splice(randomIndex, 1)[0];
                randomUsers.push(selectedUser);

            }

            /* Los insertamos en la BD en la Tabla [rolesb]  */
            let count = 0;
            for (const user of randomUsers) {
                const insertSql = 'INSERT INTO rolesb (name_user, day, month, year, created_at) VALUES (?, ?, ?, ?, ?)';
                await db.execute(insertSql, [user.name, sundaysInMonth[count], currentMonth + 1, currentYear, null]);
                count++;
            }

            /* Regresamos los registros de los rolesB */
            const [rowsRolsB, fieldsRolsB] = await db.execute(sqlVerify, [month, currentYear]);
            res.status(200).send(rowsRolsB);
        } else {
            res.status(200).send(rowsVerify);
        }

        db.release();
    } catch (err) {
        res.status(500).send(err);
    }
});

//Get Roles Limpieza to currently month => year
app.get('/rolesl', async (req, res) => {
    try {
        const db = await connection.getConnection();

        /* Por seguridad que no se dupliquen los datos, verificamos si en la Tabla rolesL 
           ya exiten registros les año y mes actual, de ser así, ya no ejectamos ninguna inserción 
        */
        const sqlVerify = 'SELECT * FROM `rolesl` WHERE month = ? AND year = ?';
        const [rowsVerify, fieldsVerify] = await db.execute(sqlVerify, [month, currentYear]);

        if (rowsVerify.length === 0) {
            const sql = 'SELECT * FROM usersl WHERE status = 1';
            const [rows, fields] = await db.execute(sql);
            const randomUsers = [];

            /* Obtenemos 4 Usuarios al azar para formar nuestro arreglo al azar, borrando el usuario Seleccionado para evitar duplicar */
            for (let index = 0; index < 4; index++) {
                const randomIndex = random(0, rows.length - 1);
                const selectedUser = rows.splice(randomIndex, 1)[0];
                randomUsers.push(selectedUser);

            }

            /* Los insertamos en la BD en la Tabla [rolesl]  */
            let count = 0;
            for (const user of randomUsers) {
                const insertSql = 'INSERT INTO rolesl (name_user, day, month, year, created_at) VALUES (?, ?, ?, ?, ?)';
                await db.execute(insertSql, [user.name, sundaysInMonth[count], currentMonth + 1, currentYear, null]);
                count++;
            }

            /* Regresamos los registros de los rolesL */
            const [rowsRolsL, fieldsRolsL] = await db.execute(sqlVerify, [month, currentYear]);
            res.status(200).send(rowsRolsL);
        } else {
            res.status(200).send(rowsVerify);
        }

        db.release();
    } catch (err) {
        res.status(500).send(err);
    }
});

//Get Roles Oración to currently month => year
app.get('/roleso', async (req, res) => {
    try {
        const db = await connection.getConnection();

        /* Por seguridad que no se dupliquen los datos, verificamos si en la Tabla roleso 
           ya exiten registros les año y mes actual, de ser así, ya no ejectamos ninguna inserción 
        */
        const sqlVerify = 'SELECT * FROM `roleso` WHERE month = ? AND year = ?';
        const [rowsVerify, fieldsVerify] = await db.execute(sqlVerify, [month, currentYear]);

        if (rowsVerify.length === 0) {
            const sql = 'SELECT * FROM userso WHERE status = 1';
            const [rows, fields] = await db.execute(sql);
            const randomUsers = [];

            /* Obtenemos 4 Usuarios al azar para formar nuestro arreglo al azar, borrando el usuario Seleccionado para evitar duplicar */
            for (let index = 0; index < 4; index++) {
                const randomIndex = random(0, rows.length - 1);
                const selectedUser = rows.splice(randomIndex, 1)[0];
                randomUsers.push(selectedUser);

            }

            /* Los insertamos en la BD en la Tabla [rolesO]  */
            let count = 0;
            for (const user of randomUsers) {
                const insertSql = 'INSERT INTO roleso (name_user, day, month, year, created_at) VALUES (?, ?, ?, ?, ?)';
                await db.execute(insertSql, [user.name, sundaysInMonth[count], currentMonth + 1, currentYear, null]);
                count++;
            }

            /* Regresamos los registros de los rolesO */
            const [rowsRolsO, fieldsRolsO] = await db.execute(sqlVerify, [month, currentYear]);
            res.status(200).send(rowsRolsO);
        } else {
            res.status(200).send(rowsVerify);
        }

        db.release();
    } catch (err) {
        res.status(500).send(err);
    }
});

//Get Roles Niños to currently month => year
app.get('/rolesn', async (req, res) => {
    try {
        const db = await connection.getConnection();

        /* Por seguridad que no se dupliquen los datos, verificamos si en la Tabla rolesN
           ya exiten registros les año y mes actual, de ser así, ya no ejectamos ninguna inserción 
        */
        const sqlVerify = 'SELECT * FROM `rolesn` WHERE month = ? AND year = ?';
        const [rowsVerify, fieldsVerify] = await db.execute(sqlVerify, [month, currentYear]);

        if (rowsVerify.length === 0) {
            const sql = 'SELECT * FROM usersn WHERE status = 1';
            const [rows, fields] = await db.execute(sql);
            const randomUsers = [];

            /* Obtenemos 4 Usuarios al azar para formar nuestro arreglo al azar, borrando el usuario Seleccionado para evitar duplicar */
            for (let index = 0; index < 4; index++) {
                const randomIndex = random(0, rows.length - 1);
                const selectedUser = rows.splice(randomIndex, 1)[0];
                randomUsers.push(selectedUser);

            }

            /* Los insertamos en la BD en la Tabla [rolesn]  */
            let count = 0;
            for (const user of randomUsers) {
                const insertSql = 'INSERT INTO rolesn (name_user, day, month, year, created_at) VALUES (?, ?, ?, ?, ?)';
                await db.execute(insertSql, [user.name, sundaysInMonth[count], currentMonth + 1, currentYear, null]);
                count++;
            }

            /* Regresamos los registros de los rolesB */
            const [rowsRolsN, fieldsRolsN] = await db.execute(sqlVerify, [month, currentYear]);
            res.status(200).send(rowsRolsN);
        } else {
            res.status(200).send(rowsVerify);
        }

        db.release();
    } catch (err) {
        res.status(500).send(err);
    }
});

const port = process.env.port || 4000;
app.listen(port, () => console.log("Escuchando en el puerto"));