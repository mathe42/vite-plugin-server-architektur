import { Plugin } from "vite";
import { writeFileSync } from "fs";

let m = new Map<string, string>()
let dir = ''
export default {
  name: 'server-plugin',

  configResolved(config) {
    dir = config.root!
  },

  transform(code, id) {
    const c = code.split("#region server").slice(1).map(v=>v.split("#endregion server")[0]).join("\n")

    m.set(id, c)
  },

  buildEnd() {
    writeFileSync(dir + './server/generated.ts', `
      export function setup(defineServer: (...args: any[]) => any) {
        ${[...m.entries()].map(([id, code]) => `// id: ${id}\n${code}`).join("\n\n")}
      }
    `)
  },

} as Plugin