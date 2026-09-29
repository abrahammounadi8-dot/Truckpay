/** Only local import screens can be OAuth return destinations. */
export function gmailReturnPath(value: unknown): string {
 if (value === "/payslips/new") return value;
 if (typeof value === "string" && /^\/report(?:\?company=[A-Za-z0-9%_-]+)?$/.test(value)) return value;
 return "/report";
}
export function gmailReturnLocation(value: unknown, result: string) {
 const path = gmailReturnPath(value);
 return path + (path.includes("?") ? "&" : "?") + "gmail=" + encodeURIComponent(result);
}
