const { spawn } = require("child_process");
const path = require("path");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Terminal connected");

    let runningProcess = null; // ✅ PER SOCKET

    const startProcess = (cmd, args, cwd) => {
      runningProcess = spawn(cmd, args, { cwd, shell: true });

      runningProcess.stdout.on("data", (data) => {
        socket.emit("terminal-output", data.toString());
      });

      runningProcess.stderr.on("data", (data) => {
        socket.emit("terminal-output", data.toString());
      });

      runningProcess.on("close", () => {
        socket.emit("terminal-output", "\n[Process finished]\n");
        runningProcess = null;
      });
    };

    socket.on("run-code", ({ filePath, language }) => {
      if (runningProcess) {
        runningProcess.kill();
        runningProcess = null;
      }

      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath);
      const name = fileName.split(".")[0];

      switch (language) {
        case "java": {
          const compile = spawn("javac", [fileName], { cwd: dir });

          compile.stderr.on("data", (d) =>
            socket.emit("terminal-output", d.toString())
          );

          compile.on("close", (code) => {
            if (code === 0) {
              startProcess("java", [name], dir);
            }
          });
          break;
        }

        case "python":
          startProcess("python", [fileName], dir);
          break;

        case "javascript":
          startProcess("node", [fileName], dir);
          break;

        case "c": {
          const compile = spawn("gcc", [fileName, "-o", `${name}.exe`], {
            cwd: dir,
          });

          compile.stderr.on("data", (d) =>
            socket.emit("terminal-output", d.toString())
          );

          compile.on("close", () => {
            startProcess(`${name}.exe`, [], dir);
          });
          break;
        }

        case "cpp": {
          const compile = spawn("g++", [fileName, "-o", `${name}.exe`], {
            cwd: dir,
          });

          compile.stderr.on("data", (d) =>
            socket.emit("terminal-output", d.toString())
          );

          compile.on("close", () => {
            startProcess(`${name}.exe`, [], dir);
          });
          break;
        }

        default:
          socket.emit("terminal-output", "Language not supported\n");
      }
    });

    socket.on("terminal-input", (input) => {
      if (runningProcess) {
        runningProcess.stdin.write(input);
      }
    });

    socket.on("disconnect", () => {
      if (runningProcess) runningProcess.kill();
    });
  });
};