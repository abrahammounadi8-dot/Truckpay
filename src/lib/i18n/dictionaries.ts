import type { Locale } from "./config";
import { en, type Messages } from "./en";
import { es } from "./es";
import { pl } from "./pl";
import { pt } from "./pt";

export const dictionaries: Record<Locale, Messages> = { en, es, pl, pt };
