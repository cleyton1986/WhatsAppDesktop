import Store from "electron-store";

export interface Account {
  id: string;
  name: string;
}

/**
 * Gerencia contas (CRUD) persistidas via electron-store.
 */
export default class AccountManager {
  private readonly store = new Store();
  private nextId = 1;

  constructor() {
    // Calcula o proximo ID baseado nas contas existentes
    const accounts = this.getAccounts();
    if (accounts.length > 0) {
      const maxId = Math.max(
        ...accounts.map((a) => parseInt(a.id.replace("account-", ""), 10) || 0)
      );
      this.nextId = maxId + 1;
    }
  }

  /**
   * Retorna todas as contas cadastradas.
   */
  public getAccounts(): Account[] {
    return this.store.get("accounts", []) as Account[];
  }

  /**
   * Adiciona uma nova conta e retorna ela.
   */
  public addAccount(name: string): Account {
    const account: Account = {
      id: `account-${this.nextId++}`,
      name,
    };
    const accounts = this.getAccounts();
    accounts.push(account);
    this.store.set("accounts", accounts);
    return account;
  }

  /**
   * Remove uma conta pelo ID.
   */
  public removeAccount(id: string): void {
    const accounts = this.getAccounts().filter((a) => a.id !== id);
    this.store.set("accounts", accounts);
  }

  /**
   * Renomeia uma conta.
   */
  public renameAccount(id: string, newName: string): void {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === id);
    if (account) {
      account.name = newName;
      this.store.set("accounts", accounts);
    }
  }

  /**
   * Retorna uma conta pelo ID.
   */
  public getAccount(id: string): Account | undefined {
    return this.getAccounts().find((a) => a.id === id);
  }

  /**
   * Garante que exista pelo menos uma conta padrao.
   */
  public ensureDefaultAccount(): Account[] {
    let accounts = this.getAccounts();
    if (accounts.length === 0) {
      this.addAccount("WhatsApp");
      accounts = this.getAccounts();
    }
    return accounts;
  }
}
