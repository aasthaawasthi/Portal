var express = require("express"),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  passportLocalMongoose = require("passport-local-mongoose"),
  nodemailer = require("nodemailer");
app = express();

'use strict';

mongoose.connect("mongodb://localhost/user_portal", { useNewUrlParser: true });
mongoose.set('useCreateIndex', true);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// MONGOOSE CONFIGURATION
// Login Model
var loginSchema = new mongoose.Schema({
  username: String,
  password: String
});
loginSchema.plugin(passportLocalMongoose);
var Login = mongoose.model("Login", loginSchema);

// Profile Model
var profileSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  gen: String,
  reg: String,
  email: String,
  username: String,
  password: String,
  con_pass: String
});
profileSchema.plugin(passportLocalMongoose);
var Profile = mongoose.model("Profile", profileSchema);

//PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "send_mails",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(Profile.authenticate()));
passport.serializeUser(Profile.serializeUser());
passport.deserializeUser(Profile.deserializeUser());

// ROUTES 
app.get("/", (req, res) => {
  res.render("profile");
});

app.post("/profile", (req, res) => {
  console.log(req.body)
  var user = new Profile({
    fname: req.body.fname,
    lname: req.body.lname,
    dob: req.body.dob,
    gen: req.body.gen,
    reg: req.body.reg,
    email: req.body.email,
    username: req.body.username,
    con_pass: req.body.con_pass
  });
  Profile.register(user, req.body.password, (err, data) => {
    if (err) {
      console.log(err);
      return res.render("profile");
    }
    passport.authenticate("local")(req, res, () => {
      if (data.reg === "admin") {
        res.redirect("/admin");
      } else {
        res.redirect(`/login/${data._id}`);
      }
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/login/:id", (req, res) => {
  console.log(req.params.id)
  Profile.findById(req.params.id, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.render("update", { data });
    }
  });
});

app.post("/login", (req, res) => {
  console.log(req.body)
  Profile.findOne({ username: req.body.username }, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      console.log(result)
      passport.authenticate("local")(req, res, () => {
        res.redirect(`/login/${result._id}`);
      }
      );
    }
  })
});

app.get("/update", (req, res) => {
  res.render("update");
})

app.post("/update/:id", (req, res) => {
  console.log(req.params.id);
  Profile.findByIdAndUpdate(req.params.id, req.body, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      res.render("thanks", { message: "Successfully updated your profile" });
    }
  });
});

app.get("/admin", (req, res) => {
  res.render("admin");
});

app.post("/admin", (req, res) => {
  console.log("in admin route")
  Profile.findOne({ username: req.body.username }, (err, result) => {
    if (err) {
      console.log(err)
    } else {
      console.log(result)
      passport.authenticate("local")(req, res, () => {
        res.render(`send_mails`);
      }
      );
    }
  })
});

// Logout logic
app.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

app.get("/send_mails", (req, res) => {
  res.render("send_mails");
});

// NODEMAILER CONFIG
app.post("/send_mails", (req, res) => {
  Profile.find({ reg: req.body.category }, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
    console.log(result)
    result.forEach(data => {
      async function main() {
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: 'asthaavasthi10@gmail.com',
            pass: 'Qwerty12345%'
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        let info = await transporter.sendMail({
          from: '"Astha" <aastha.onetechway@gmail.com>',
          to: `${data.email}`,
          subject: "Admin mail",
          text: "This mail is sent by your admin.",
        });
        console.log("Message sent: %s", info.messageId);
      }
      main().catch(console.error);
    });
  })
  res.render("thanks",{message: "Mail is successfully sent"});
});

// SERVER LISTENING
app.listen(4000, process.env.IP, (req, res) => {
  console.log("SERVER IS ON");
});