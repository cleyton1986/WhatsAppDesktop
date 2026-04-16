import Module from "./module";

/**
 * Gerenciador de módulos que executa métodos de inicialização e finalização.
 */
export default class ModuleManager implements Module {
  constructor(private readonly modules: Array<Module>) {}

  public beforeLoad() {
    this.forEach((module) => module.beforeLoad());
  }

  public onLoad() {
    this.forEach((module) => module.onLoad());
  }

  public onQuit() {
    this.forEach((module) => module.onQuit());
  }

  private forEach(callback: (module: Module) => void) {
    this.modules.forEach(callback);
  }
}
