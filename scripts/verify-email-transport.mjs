import net from "node:net";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import ts from "typescript";

// This test never loads .env.local or contacts an external SMTP service.
const require = createRequire(import.meta.url);
const source = ts.transpileModule(await readFile("lib/email.ts", "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;
function load(mailer = require("nodemailer")) {
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => (name === "nodemailer" ? mailer : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
Object.assign(process.env, {
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "fixture-user",
  SMTP_PASS: "fixture-secret",
  SMTP_FROM: "fixture@example.test",
});
const message = {
  to: "member@example.test",
  subject: "Local fixture only",
  html: "<p>Local fixture only</p>",
};
let configuration,
  submitted,
  fail = false;
const mocked = {
  createTransport(options) {
    configuration = options;
    return {
      async sendMail(mail) {
        submitted = mail;
        if (fail)
          throw new Error("SMTP fixture-secret private-provider-response");
        return { messageId: "fixture-message-id" };
      },
    };
  },
};
const delivery = load(mocked);
assert.equal(configuration.secure, false);
assert.equal(configuration.requireTLS, true);
assert.deepEqual(configuration.tls, {
  minVersion: "TLSv1.2",
  rejectUnauthorized: true,
});
assert.equal(configuration.connectionTimeout, 15000);
assert.equal(configuration.greetingTimeout, 15000);
assert.equal(configuration.socketTimeout, 30000);
assert.equal(configuration.disableFileAccess, true);
assert.equal(configuration.disableUrlAccess, true);
assert.deepEqual(await delivery.sendEmail(message), {
  success: true,
  messageId: "fixture-message-id",
});
assert.deepEqual(submitted, {
  from: '"Weave Network" <fixture@example.test>',
  ...message,
});
process.env.SMTP_PORT = "465";
load(mocked);
assert.equal(configuration.secure, true);
assert.equal(configuration.requireTLS, true);

const logs = [],
  originalError = console.error;
console.error = (...args) => logs.push(args.join(" "));
const commands = [],
  sockets = new Set();
const server = net.createServer((socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
  socket.setEncoding("utf8");
  socket.write("220 local-fixture ESMTP\r\n");
  let buffer = "",
    data = false;
  socket.on("data", (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf("\r\n")) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      commands.push(line.split(" ")[0]);
      if (data) {
        if (line === ".") {
          data = false;
          socket.write("250 Queued\r\n");
        }
      } else if (line.startsWith("EHLO"))
        socket.write("250-local-fixture\r\n250 AUTH PLAIN LOGIN\r\n");
      else if (line === "STARTTLS") socket.write("502 TLS unavailable\r\n");
      else if (line.startsWith("AUTH")) socket.write("235 Authenticated\r\n");
      else if (line === "DATA") {
        data = true;
        socket.write("354 Send data\r\n");
      } else if (line === "QUIT") {
        socket.write("221 Bye\r\n");
        socket.end();
      } else socket.write("250 OK\r\n");
    }
  });
});
try {
  fail = true;
  assert.deepEqual(await delivery.sendEmail(message), {
    error: "Failed to send email",
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.SMTP_PORT = String(server.address().port);
  const actual = load();
  assert.deepEqual(await actual.sendEmail(message), {
    error: "Failed to send email",
  });
  assert.ok(commands.includes("STARTTLS"));
  assert.ok(!commands.includes("AUTH"));
  assert.ok(!commands.includes("MAIL"));
  assert.ok(!commands.includes("DATA"));
  const previous = commands.length;
  delete process.env.SMTP_PASS;
  assert.deepEqual(await actual.sendEmail(message), {
    error: "Email delivery is not configured",
  });
  assert.equal(commands.length, previous);
  assert.ok(
    logs.every(
      (line) =>
        !line.includes("fixture-secret") &&
        !line.includes("private-provider-response"),
    ),
  );
} finally {
  console.error = originalError;
  for (const socket of sockets) socket.destroy();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
}
console.log(
  "PASS: SMTP TLS/certificate requirements, timeouts, safe delivery results and redacted errors; real Nodemailer refuses plaintext before credentials or mail submission. Local fixture only; no external emails sent.",
);
