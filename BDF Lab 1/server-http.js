// Lab 1, Task 3: a small server using Node.js's built-in http module.
const http = require("http");
const PORT = 3001;

const server = http.createServer((request, response) => {
  const path = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (path === "/") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Hello");
    console.log(`${request.method} ${path} -> 200`);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("404 - Page not found");
  console.log(`${request.method} ${path} -> 404`);
});

server.listen(PORT, () => {
  console.log(`Plain Node.js HTTP server running at http://localhost:${PORT}`);
});
