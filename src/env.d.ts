declare namespace App {
  interface Locals {
    user: import("better-auth").User | null;
    session: import("better-auth").Session | null;
    // You can add other properties to locals if needed
  }
}
