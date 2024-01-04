import { Plugin } from "vite";
import { writeFileSync } from "fs";

let m = new Map<string, string>()
let dir = ''
export default () => ({
  name: 'server-plugin',

  configResolved(config) {
    dir = config.root!
  },

  transform(code, id) {
    const c = code
      .split("//#region server")
      .filter((v,i) => i > 0)
      .map(v=>v.split("//#endregion server")[0])
      .join("\n")
      .trim()

    console.log(c)

    if(c) {
      m.set(id, c)
    } else {
      m.delete(id)
    }
  },

  buildEnd() {
    writeFileSync(dir + '/server/generated.ts', `
      export function setup(defineServer: (...args: any[]) => any) {
        ${[...m.entries()].map(([id, code]) => `// id: ${id}\n${code}`).join("\n\n")}
      }
    `, 'utf-8')
  },

} as Plugin)
