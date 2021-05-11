const utils = require("./utils");
const express = require("express");
const app = express();
const port = process.env.PORT || 4277;
const path = require("path");
const openHelpers = {};
const secretMap = {};
const url = "https://hass-wear-authenticator.herokuapp.com/";

// App create new set-up
app.get("/newSetup", (req, res) => {
  let friendlyId = utils.makeId(8);
  while (openHelpers[friendlyId]) {
    console.log(`Friendly ID ${friendlyId} is a duplicate. Regenerating`);
    friendlyId = utils.makeId(8);
  }
  console.log(`Created session ${friendlyId}`);
  const secretId = utils.makeId(99);
  openHelpers[friendlyId] = { secretId, createdAt: new Date() };
  secretMap[secretId] = friendlyId;
  res.send(JSON.stringify({ friendlyId, secretId }));
  setTimeout(() => {
    delete openHelpers[friendlyId];
    delete secretMap[secretId];
    console.log(`Session ${friendlyId} expired.`);
  }, 900000);
});

// App fetches status
app.get("/status/:secretId", (req, res) => {
  if (secretMap[req.params.secretId]) {
    const helper = openHelpers[secretMap[req.params.secretId]];
    res.sendFile(JSON.stringify(helper));
  } else {
    res.send("That request has expired.");
  }
});

// User set-up
app.get("/:requestId", (req, res) => {
  if (!openHelpers[req.params.requestId]) {
    res.send(`Error: Unknown or expired request ${req.params.requestId}`);
  } else {
    res.sendFile(path.join(__dirname, "/index.html"));
  }
});

// User gets a succesful callback
app.get("/auth/:requestId", (req, res) => {
  if (openHelpers[req.params.requestId]) {
    const url = req.query.url;
    const code = req.query.code;
    openHelpers[req.params.requestId] = {
      ...openHelpers[req.params.requestId],
      code,
      url,
    };

    res.sendFile(path.join(__dirname, "/success.html"));
  } else {
    res.send(`Unknown internal request code ${req.params.requestId}`);
  }
});

// Default
app.get("/", (req, res) => {
  res.send("Please open this url with the requestID you got from your watch!");
});

app.listen(port, () => {
  console.log(`Now listening for hass-requests on ${url}`);
});
