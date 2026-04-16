import Store from "electron-store";

/**
 * Classe para gerenciamento de configurações da aplicação.
 */
export default class Settings {
  private readonly store = new Store();
  private readonly section: string;

  constructor(section: string) {
    this.section = section + ".";
  }

  /**
   * Retorna o valor da chave especificada.
   * @param key Chave de configuração.
   * @param defaults Valor padrão se a chave não existir.
   */
  public get(key: string, defaults: any = null): any {
    return this.store.get(this.section + key, defaults);
  }

  /**
   * Define um valor para a chave especificada.
   * @param key Chave de configuração.
   * @param value Valor a ser armazenado.
   */
  public set(key: string, value: any): void {
    this.store.set(this.section + key, value);
  }
}
