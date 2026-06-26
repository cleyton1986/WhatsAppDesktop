import Store from "electron-store";
import { createHash } from "crypto";

export interface AccountVault {
  enabled: boolean;
  pinHash: string;
  pinLength: 4 | 6;
  notificationsEnabled: boolean;
}

export interface Account {
  id: string;
  name: string;
  emoji: string;
  theme: "system" | "dark" | "light";
  vault?: AccountVault;
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
  public addAccount(name: string, emoji: string = ""): Account {
    const account: Account = {
      id: `account-${this.nextId++}`,
      name,
      emoji: emoji || "",
      theme: "system",
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
   * Atualiza o emoji de uma conta.
   */
  public setEmoji(id: string, emoji: string): void {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === id);
    if (account) {
      account.emoji = emoji;
      this.store.set("accounts", accounts);
    }
  }

  /**
   * Atualiza o tema de uma conta.
   */
  public setTheme(id: string, theme: "system" | "dark" | "light"): void {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === id);
    if (account) {
      account.theme = theme;
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
   * Ativa ou desativa o cofre de uma conta, salvando o hash do PIN.
   */
  public setVault(id: string, enabled: boolean, pin?: string, pinLength: 4 | 6 = 4, notificationsEnabled = false): void {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === id);
    if (!account) return;
    if (!enabled) {
      delete account.vault;
    } else {
      account.vault = {
        enabled: true,
        pinHash: pin ? createHash("sha256").update(pin).digest("hex") : (account.vault?.pinHash ?? ""),
        pinLength,
        notificationsEnabled,
      };
    }
    this.store.set("accounts", accounts);
  }

  /**
   * Verifica se o PIN fornecido está correto para a conta.
   */
  public checkPin(id: string, pin: string): boolean {
    const account = this.getAccount(id);
    if (!account?.vault?.enabled) return false;
    const hash = createHash("sha256").update(pin).digest("hex");
    return hash === account.vault.pinHash;
  }

  /**
   * Atualiza as configuracoes de notificacao do cofre.
   */
  public setVaultNotifications(id: string, enabled: boolean): void {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === id);
    if (account?.vault) {
      account.vault.notificationsEnabled = enabled;
      this.store.set("accounts", accounts);
    }
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
