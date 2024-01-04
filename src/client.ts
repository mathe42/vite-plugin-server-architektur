import { ref, shallowRef } from "vue";
import type { BaseConfig } from "./shared";


class FetchContext<T> {
  public isLoading = ref(true);
  public isError = ref(false);
  public isSettled = ref(false);

  public error = ref("");
  public data = ref<T>();

  private abortCtl = new AbortController();

  abort() {
    this.abortCtl.abort();
  }

  constructor(private url: string, private args: any, private isPost, private baseConfig: BaseConfig) {
    if (baseConfig.useShallowRef) {
      this.data = shallowRef();
    }
    this.run();
  }

  async run() {
    const search = new URLSearchParams(this.args);
    const query = search.toString();

    const fullURL = `${this.baseConfig.origin}${this.baseConfig.baseUrl}${this.url}?${query}`;

    try {
      const data = await fetch(fullURL, {
        signal: this.abortCtl.signal,
        method: this.isPost ? "POST" : "GET"
      });
      const json = await data.json();
      this.data.value = json;
      this.isLoading.value = false;
      this.isSettled.value = true;
    } catch (ex) {
      this.error.value = ex as any;
      this.isError.value = true;
      this.isSettled.value = true;
    }
  }
}

export function createDefineServer<CONTEXT>(baseConfig: BaseConfig) {
  return function defineServer<
    T extends (ctx: CONTEXT) => {
      get(args: any): any;
      update: {
        [k in string]: (args: any) => any;
      };
    }
  >(id: string, _fn: T) {
    return {
      get(...args: Parameters<ReturnType<T>["get"]>) {
        return new FetchContext(`/${id}`, args, false, baseConfig);
      },
      update<K extends keyof ReturnType<T>["update"]>(
        name: K,
        ...args: Parameters<ReturnType<T>["update"][K]>
      ) {
        return new FetchContext(`/${id}/` + (name as string), args, true, baseConfig);
      },
    };
  }
}
