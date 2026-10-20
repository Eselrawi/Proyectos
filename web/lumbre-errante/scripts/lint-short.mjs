// Resumen corto de ESLint: archivo:línea regla mensaje
import { ESLint } from "eslint";
const eslint = new ESLint();
const res = await eslint.lintFiles(["src"]);
let n = 0;
for (const f of res) for (const m of f.messages) {
  n++;
  console.log(`${f.filePath.split("restaurante\\")[1]}:${m.line} [${m.severity === 2 ? "E" : "W"}] ${m.ruleId} ${m.message.split("\n")[0].slice(0, 100)}`);
}
console.log(n ? `${n} problemas` : "lint limpio");
