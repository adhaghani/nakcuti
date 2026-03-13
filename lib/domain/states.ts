export const MALAYSIAN_STATES = [
  "JHR",
  "KDH",
  "KTN",
  "MLK",
  "NSN",
  "PHG",
  "PRK",
  "PLS",
  "PNG",
  "SBH",
  "SWK",
  "SGR",
  "TRG",
  "KUL",
  "LBN",
  "PJY",
] as const

export type MalaysianStateCode = (typeof MALAYSIAN_STATES)[number]

export const STATE_LABELS: Record<MalaysianStateCode, string> = {
  JHR: "Johor",
  KDH: "Kedah",
  KTN: "Kelantan",
  MLK: "Melaka",
  NSN: "Negeri Sembilan",
  PHG: "Pahang",
  PRK: "Perak",
  PLS: "Perlis",
  PNG: "Pulau Pinang",
  SBH: "Sabah",
  SWK: "Sarawak",
  SGR: "Selangor",
  TRG: "Terengganu",
  KUL: "Kuala Lumpur",
  LBN: "Labuan",
  PJY: "Putrajaya",
}
