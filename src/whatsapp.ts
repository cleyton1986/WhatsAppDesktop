/**
 * Este arquivo existe apenas para manter compatibilidade de tipos.
 * A classe principal agora e AppController (app-controller.ts).
 * Os modulos que precisam de uma interface "quittable" usam este tipo.
 */
export default interface WhatsApp {
  quitting: boolean;
  quit(): void;
  reload(): void;
}
