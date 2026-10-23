// Execute only the tracked CSV Code node, not a workflow or an HTTP request.
const vm = require('node:vm');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  const {code, body} = JSON.parse(input);
  const result = vm.runInNewContext(`(function(){\n${code}\n})()`, {$json: {body}}, {
    timeout: 1000,
    contextCodeGeneration: {strings: false, wasm: false},
  });
  process.stdout.write(JSON.stringify(result));
});
