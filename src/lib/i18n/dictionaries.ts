import type { Locale } from "./config";
import { en, type Messages } from "./en";
import { es } from "./es";
import { lt } from "./lt";
import { pl } from "./pl";
import { pt } from "./pt";
import { ro } from "./ro";
import { ru } from "./ru";

export const dictionaries: Record<Locale, Messages> = { en, es, pl, pt, lt, ro, ru };
