import type { BaseConfig } from "./shared";
import express from "express";

export function setupExpress(app = express(), ctx: any, baseConfig: BaseConfig) {
  const router = express.Router()

  app.use(baseConfig.baseUrl, router)

  function defineServer<
    T extends (ctx: any) => {
      get(args: any): any;
      update: {
        [k in string]: (args: any) => any;
      };
    }
  >(id: string, fn: T) {
    const r = fn(ctx);

    router.get(id, async (req, res) => {
      res.json(await r.get(res)) 
    })

    router.post(`${id}/:name`, (req, res) => {
      const u = r.update[req.params.name];

      if(typeof u == "function") {
        res.json(u(req.query))
      }
    })
  }

  return {defineServer, app}
}
