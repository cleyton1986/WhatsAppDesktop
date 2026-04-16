/**
 * Classe abstrata base para módulos da aplicação.
 */
export default abstract class Module {
  public beforeLoad() {}
  public onLoad() {}
  public onQuit() {}
}
