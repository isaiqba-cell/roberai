import { create } from "zustand";
import { BodyProfile, FitPreference } from "@rober/fit-engine";

export type StyleProfile = {
  styleTags: string[];
  dislikedTags: string[];
  colorPreferences: string[];
  materialPreferences: string[];
  occasionPreferences: string[];
  favoriteBrands: string[];
  priceMin?: number;
  priceMax?: number;
  budgetLabel?: string;
};

export type KnownGoodItem = {
  id: string;
  brand: string;
  category: string;
  itemName: string;
  sizeLabel: string;
  fitNotes: string;
  measurements: {
    chestCm?: number;
    waistCm?: number;
    hipCm?: number;
    shoulderCm?: number;
    inseamCm?: number;
  };
};

type DemoUserState = {
  guestMode: boolean;
  onboardingCompleted: boolean;
  bodyProfile: BodyProfile;
  styleProfile: StyleProfile;
  knownGoodItems: KnownGoodItem[];
  setGuestMode: (guestMode: boolean) => void;
  updateBodyProfile: (profile: Partial<BodyProfile>) => void;
  updateFitPreference: (fitPreference: FitPreference) => void;
  updateStyleProfile: (profile: Partial<StyleProfile>) => void;
  addKnownGoodItem: (item: KnownGoodItem) => void;
  completeOnboarding: () => void;
};

export const demoBodyProfile: BodyProfile = {
  heightCm: 178,
  weightKg: 77,
  chestCm: 101,
  waistCm: 84,
  hipCm: 98,
  inseamCm: 81,
  shoulderCm: 46,
  shoeSizeUs: 10.5,
  fitPreference: "relaxed"
};

export const demoStyleProfile: StyleProfile = {
  styleTags: ["utility", "minimal", "business casual", "weekend"],
  dislikedTags: ["loud logos"],
  colorPreferences: ["clay", "olive", "black", "cream", "light blue"],
  materialPreferences: ["cotton", "denim", "linen", "wool"],
  occasionPreferences: ["summer office", "weekend errands", "travel"],
  favoriteBrands: ["Fieldstone Supply Co.", "Northgate Denim", "Alder & Thread"],
  priceMin: 40,
  priceMax: 160,
  budgetLabel: "Quality under $160"
};

export const demoKnownGoodItems: KnownGoodItem[] = [
  {
    id: "known-overshirt",
    brand: "Fieldstone Supply Co.",
    category: "tops",
    itemName: "Chore overshirt",
    sizeLabel: "M",
    fitNotes: "Room through chest, clean shoulder, easy over a tee.",
    measurements: {
      chestCm: 106,
      waistCm: 103,
      shoulderCm: 47
    }
  },
  {
    id: "known-regular-jeans",
    brand: "Northgate Denim",
    category: "bottoms",
    itemName: "Regular straight jeans",
    sizeLabel: "32",
    fitNotes: "True waist, enough thigh room, breaks once at shoe.",
    measurements: {
      waistCm: 86,
      hipCm: 101,
      inseamCm: 81
    }
  }
];

export const useDemoStore = create<DemoUserState>((set) => ({
  guestMode: true,
  onboardingCompleted: false,
  bodyProfile: demoBodyProfile,
  styleProfile: demoStyleProfile,
  knownGoodItems: demoKnownGoodItems,
  setGuestMode: (guestMode) => set({ guestMode }),
  updateBodyProfile: (profile) =>
    set((state) => ({
      bodyProfile: {
        ...state.bodyProfile,
        ...profile
      }
    })),
  updateFitPreference: (fitPreference) =>
    set((state) => ({
      bodyProfile: {
        ...state.bodyProfile,
        fitPreference
      }
    })),
  updateStyleProfile: (profile) =>
    set((state) => ({
      styleProfile: {
        ...state.styleProfile,
        ...profile
      }
    })),
  addKnownGoodItem: (item) =>
    set((state) => ({
      knownGoodItems: [item, ...state.knownGoodItems]
    })),
  completeOnboarding: () => set({ onboardingCompleted: true })
}));
