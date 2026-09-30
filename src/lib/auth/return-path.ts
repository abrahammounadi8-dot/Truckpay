/** Explicit internal destinations only; never redirect to an arbitrary query value. */
export function accountReturnPath(next?: string) {
  if (next === "/payslips" || next === "/payslips/new") return next;
  return next && /^\/report(?:\?company=[A-Za-z0-9%_-]+)?$/.test(next) ? next : "/";
}
