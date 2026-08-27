declare module 'load-script' {
  function loadScript(url: string, cb: (err: Error) => void): void;
  export = loadScript;
}
