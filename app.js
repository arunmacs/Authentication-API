const express = require("express");
const app = express();
app.use(express.json());
let port = 3001;
const bcrypt = require("bcrypt");

const path = require("path");
const databasePath = path.join(__dirname, "userData.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let database = null;

const initializeDBServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBServer();

//API-1: Register user

app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const searchUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}';`;
    const isDbUser = await database.get(searchUserQuery);
    if (isDbUser === undefined) {
      if (password.length >= 5) {
        const createUserQuery = `
        INSERT INTO user (username,name,password,gender,location)
        VALUES
          ( '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}' );`;
        await database.run(createUserQuery);
        response.send("User created successfully");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-2: user Login

app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const searchUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}';`;
    const isDbUser = await database.get(searchUserQuery);
    if (isDbUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const isPasswordMatched = await bcrypt.compare(
        password,
        isDbUser.password
      );
      if (isPasswordMatched === true) {
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-3: Change User Password

app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const searchUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}';`;
    const DbUser = await database.get(searchUserQuery);
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      DbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length >= 5) {
        const UpdatePasswordQuery = `
        UPDATE user
        SET
            password ='${hashedPassword}'
        WHERE username = '${DbUser.username}';`;
        await database.run(UpdatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

module.exports = app;
