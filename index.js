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
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user",
  },
];

// Middleware to protect routes
const requireLogin = (request, response, next) => {
  if (!request.session.user) {
    return response.redirect("/login");
  }
  next();
};

// GET /login - Render login form
app.get("/login", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  const errorMessage = request.query.error || null;
  response.render("login", { errorMessage });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
  const { email, password } = request.body;
  const user = USERS.find((user) => user.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return response.render("login", {
      errorMessage: "Invalid email or password",
    });
  }

  request.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("signup", { errorMessage: null });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const { username, password, email } = request.body;

  if (USERS.find((user) => user.username === username)) {
    return response.render("signup", {
      errorMessage: "Username is already taken",
    });
  }

  if (USERS.find((user) => user.email === email)) {
    return response.render("signup", {
      errorMessage: "Email is already registered",
    });
  }

  const newUser = {
    id: USERS.length + 1,
    username,
    email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role: "user",
  };

  USERS.push(newUser);

  request.session.user = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  };

  return response.redirect("/landing");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", requireLogin, (request, response) => {
  const user = request.session.user;

  if (user.role === "admin") {
    return response.render("landing", {
      user,
      users: USERS.map((user) => ({
        username: user.username,
        email: user.email,
        role: user.role,
      })),
      isAdmin: true,
    });
  }

  return response.render("landing", {
    user,
    isAdmin: false,
  });
});

// POST /logout - Logs out a user
app.post("/logout", (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      return response.status(500).send("Failed to log out.");
    }
    response.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
