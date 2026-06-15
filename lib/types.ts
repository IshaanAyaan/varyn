// Shared types for Varyn skin-symptom tracking.

export type SeverityLabel = "Clear" | "Mild" | "Moderate" | "Concerning";

export type Attributes = {
  rednessLevel: number; // 0-10
  scalingLevel: number; // 0-10
  textureScore: number; // 0-10 (higher = more irregular/raised)
  colorVariationPct: number; // 0-100
  sizeEstimateMm: number; // approximate longest dimension in mm
};

export type Analysis = {
  description: string; // plain-language description of what is visible
  label: SeverityLabel;
  severityScore: number; // 0-100
  attributes: Attributes;
  concernFlags: string[]; // notable things worth mentioning to a clinician
  recommendations: string;
  disclaimer: string;
};

export type Entry = {
  id: string;
  at: string; // ISO timestamp
  region: string; // body region, e.g. "Left forearm"
  spotLabel: string; // optional name for a specific spot/mole, e.g. "Mole near wrist"
  notes: string; // user-entered symptoms / context
  imageThumb: string; // downscaled data URL kept small for localStorage
  analysis: Analysis;
};

export const BODY_REGIONS = [
  "Face",
  "Scalp",
  "Neck",
  "Chest",
  "Back",
  "Abdomen",
  "Left arm",
  "Right arm",
  "Left hand",
  "Right hand",
  "Left leg",
  "Right leg",
  "Left foot",
  "Right foot",
  "Other",
] as const;
