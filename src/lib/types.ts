export type Equipment = "curtain" | "reefer" | "flatbed" | "tanker" | "specialized";

export type Operation = "domestic" | "uk" | "europe";

export type PayType = "hourly" | "day" | "salary" | "percentage";

export type Company = {
  publicAddress?: { address: string; sourceUrl: string; sourceName: string; mapUrl: string };
  driverReported?: boolean;
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
  companyName?: string;
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
