export type Equipment =
  | "dry-van"
  | "reefer"
  | "flatbed"
  | "tanker"
  | "specialized";

export type Operation = "otr" | "regional" | "local" | "dedicated";

export type PayType = "cpm" | "salary" | "percentage" | "hourly";

export type AdvertisedPay = {
  cpm?: number;
  salary?: number;
  hourly?: number;
  milesPerWeek?: number;
  signOnBonus?: number;
  claim: string;
};

export type ReportedPay = {
  cpm?: number;
  weeklyPay: number;
  milesPerWeek: number;
  homeTimeDaysOut: number;
  rating: number;
  reviewCount: number;
};

export type Conditions = {
  detentionPaid: boolean;
  layoverPaid: boolean;
  forcedDispatch: boolean;
  slipSeating: boolean;
  orientationPaid: boolean;
  petFriendly: boolean;
  passengerPolicy: boolean;
  truckAge: string;
  averageHours: number;
  trainerNote?: string;
};

export type Company = {
  slug: string;
  name: string;
  shortName: string;
  initials: string;
  hue: number;
  headquarters: string;
  founded: number;
  fleetSize: number;
  equipment: Equipment[];
  operations: Operation[];
  payType: PayType;
  advertised: AdvertisedPay;
  reported: ReportedPay;
  conditions: Conditions;
  summary: string;
};

export type DriverReview = {
  id: string;
  companySlug: string;
  nickname: string;
  role: string;
  tenure: string;
  payType: PayType;
  cpm?: number;
  weeklyPay: number;
  milesPerWeek: number;
  homeTime: string;
  rating: number;
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  date: string;
};

export type DriverReport = {
  id: string;
  companySlug: string;
  nickname: string;
  role: string;
  tenure: string;
  payType: PayType;
  cpm?: number;
  weeklyPay: number;
  milesPerWeek: number;
  homeTime: string;
  rating: number;
  title: string;
  body: string;
  wouldRecommend: boolean;
  date: string;
};
