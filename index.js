const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "replace_this_with_a_secure_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS),
    // In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  const errorMessage = request.query.error || null;
  return response.render("login", { errorMessage });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
  const { email, password } = request.body;
  const user = USERS.find((user) => user.email === email);

  if (!!user && bcrypt.compareSync(password, user.password)) {
    request.session.email = email;
    return response.redirect("/landing");
  }

  return response.redirect("/login?error=Invalid username or password");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const { username, password, email } = request.body;

  if (USERS.find((user) => user.username === username)) {
    return response
      .status(400)
      .render("signup", { errorMessage: "Username is taken" });
  }

  let newId = USERS.length + 1;

  // Commented for testing
  // console.log(USERS);

  const newUser = {
    id: newId,
    username: username,
    email: email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role: "user",
  };

  USERS.push(newUser);

  // Commented for testing
  // console.log(USERS);

  return response.redirect("/landing");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    console.log("User is already logged in, redirecting.");
    return response.redirect("/landing");
  }
  response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  response.render("landing", { user: request.session.user });
});

// POST /logout - Logs out a user
app.post("/logout", (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      return response.status(500).send("Failed to log out.");
    }
    console.log("User successfully logged out.");
    response.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
