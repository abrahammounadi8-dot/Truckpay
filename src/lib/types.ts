export type Equipment = "curtain" | "reefer" | "flatbed" | "tanker" | "specialized";

export type Operation = "domestic" | "uk" | "europe";

export type PayType = "hourly" | "day" | "salary" | "percentage";

export type Company = {
  slug: string;
  name: string;
  shortName: string;
  initials: string;
  hue: number;
  headquarters: string;
  county: string;
  founded?: number;
  website: string;
  fleetNote?: string;
  equipment: Equipment[];
  operations: Operation[];
  summary: string;
};

export type DriverReport = {
  id: string;
  companySlug: string;
  role: string;
  tenure: string;
  payType: PayType;
  equipment: Equipment;
  operation: Operation;
  quotedWeekly?: number;
  hourlyRate?: number;
  weeklyPay: number;
  kmPerWeek?: number;
  hoursPerWeek: number;
  body: string;
  submittedAt: string;
};
