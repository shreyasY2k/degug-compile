var express = require("express");
var request = require("request");
const InitiateMongoServer = require("./db");
InitiateMongoServer();
const User = require("./User");
const Code = require("./Code");
var app = express();
var cors = require("cors");
const { default: nodeCluster } = require("node:cluster");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

app.post("/login-auth", async (req, res) => {
  var userId = req.body.userId;
  try {
    let user = await User.findOne({
      userId
    });
    if (!user)
      return res.status(400).json({
        message: "User Not Exist"
      });
    if (user.loggedIn == true) {
      let code = await Code.findOne({ level: user.level });
      console.log(code);
      if (!code)
        return res.status(400).json({
          message: "Code Not Exist"
        });
      res.status(200).json({
        time: code.time,
        code: code.question,
        level: code.level
      });
    } else {
      user.loggedInAt = Date.now();
      user.loggedIn = true;
      user.level = 1;
      user.time = Date.now();
      user.save();
      var userLevel = user.level;
      let code = await Code.findOne({ level: userLevel });
      if (!code)
        return res.status(400).json({
          message: "Code Not Exist"
        });
      res.status(200).json({
        time: code.time,
        code: code.question,
        level: code.level
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Server Error"
    });
  }
});
app.post("/compile", async (req, res) => {
  console.log(req.body);
  var bodyObj = JSON.parse(JSON.stringify(req.body));
  var userId = bodyObj.userId.toString();
  let user = await User.findOne({
    userId
  });
  let code = bodyObj.code.toString();
  let language = bodyObj.language.toString();
  let inputs = bodyObj.standardIn.toString();
  var program = {
    script: code,
    language: language,
    stdin: inputs,
    versionIndex: "0",
    clientId: "id",
    clientSecret:
      "secret"
  };
  console.log(user);
  var userLevel = user.level;
  request(
    {
      url: "https://api.jdoodle.com/v1/execute",
      method: "POST",
      json: program
    },
    async function (error, response, body) {
      console.log("error:", error);
      console.log("statusCode:", response && response.statusCode);
      console.log("body:", body);
      let code2 = await Code.findOne({ level: userLevel });
      if (code2.solution.toString() == body.output.toString().slice(0,-1)) {
        user.level = userLevel + 1;
        if (user.level <= 10) {
          user.time = user.time.getTime() + (Date.now() - user.time.getTime());
          user.save();
          res.status(200).json({
            time: code2.time,
            code: code2.question,
            level: code2.level
          });
        } else {
          if (user.level > 10)
            res.status(200).json({
              status: "finished"
            });
        }
      } else {
        res.status(200).json({ status: "unsuccesful" });
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
