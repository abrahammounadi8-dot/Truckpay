type Environment = Record<string, string | undefined>;
/** Production stays disabled until every required dependency is configured. */
export function productionConfiguration(env: Environment = process.env) {
 const missing: string[] = [];
 if (env.MTP_PRODUCTION_AUTH !== "enabled") missing.push("MTP_PRODUCTION_AUTH");
 let origin = "";
 try { const url = new URL(env.MTP_AUTH_URL ?? ""); if(url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || ["localhost","127.0.0.1"].includes(url.hostname)) throw Error(); origin=url.origin; } catch { missing.push("MTP_AUTH_URL"); }
 if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL ?? "")) missing.push("DATABASE_URL");
 if ((env.BETTER_AUTH_SECRET?.length ?? 0) < 32) missing.push("BETTER_AUTH_SECRET");
 if ((env.MTP_RECEIPT_SECRET?.length ?? 0) < 32) missing.push("MTP_RECEIPT_SECRET");
 if (env.MTP_AUTH_EMAIL_MODE !== "resend") missing.push("MTP_AUTH_EMAIL_MODE");
 if (!env.RESEND_API_KEY?.startsWith("re_") || env.RESEND_API_KEY.length < 8) missing.push("RESEND_API_KEY");
 if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.MTP_AUTH_EMAIL_FROM ?? "")) missing.push("MTP_AUTH_EMAIL_FROM");
 return { ready: missing.length === 0, missing, origin };
}
