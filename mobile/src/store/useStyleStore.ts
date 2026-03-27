import { create } from "zustand";
import type { StyleProfile, Outfit, ReferralData, TryOnAnalysis } from "../lib/types";

interface StyleState {
  photoUri: string | null;
  photoMimeType: string | null;
  photoBase64: string | null;
  setPhoto: (uri: string | null, mimeType?: string | null) => void;
  setPhotoBase64: (base64: string) => void;

  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number, stage: string) => void;

  profile: StyleProfile | null;
  setProfile: (profile: StyleProfile) => void;

  selectedOccasion: string | null;
  setSelectedOccasion: (occasion: string) => void;

  outfits: Outfit[];
  selectedOutfit: Outfit | null;
  isLoadingOutfits: boolean;
  setOutfits: (outfits: Outfit[]) => void;
  setSelectedOutfit: (outfit: Outfit | null) => void;
  setLoadingOutfits: (loading: boolean) => void;

  tryOnAnalysis: TryOnAnalysis | null;
  isTryOnLoading: boolean;
  setTryOnAnalysis: (analysis: TryOnAnalysis | null) => void;
  setTryOnLoading: (loading: boolean) => void;

  referral: ReferralData | null;
  setReferral: (referral: ReferralData) => void;

  reset: () => void;
}

export const useStyleStore = create<StyleState>((set) => ({
  photoUri: null,
  photoMimeType: null,
  photoBase64: null,
  setPhoto: (photoUri, photoMimeType = null) =>
    set({ photoUri, photoMimeType }),
  setPhotoBase64: (photoBase64) => set({ photoBase64 }),

  isAnalyzing: false,
  analysisProgress: 0,
  analysisStage: "",
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisProgress: (analysisProgress, analysisStage) =>
    set({ analysisProgress, analysisStage }),

  profile: null,
  setProfile: (profile) => set({ profile }),

  selectedOccasion: null,
  setSelectedOccasion: (selectedOccasion) => set({ selectedOccasion }),

  outfits: [],
  selectedOutfit: null,
  isLoadingOutfits: false,
  setOutfits: (outfits) => set({ outfits }),
  setSelectedOutfit: (selectedOutfit) =>
    set({ selectedOutfit, tryOnAnalysis: null }),
  setLoadingOutfits: (isLoadingOutfits) => set({ isLoadingOutfits }),

  tryOnAnalysis: null,
  isTryOnLoading: false,
  setTryOnAnalysis: (tryOnAnalysis) => set({ tryOnAnalysis }),
  setTryOnLoading: (isTryOnLoading) => set({ isTryOnLoading }),

  referral: null,
  setReferral: (referral) => set({ referral }),

  reset: () =>
    set({
      photoUri: null,
      photoMimeType: null,
      photoBase64: null,
      isAnalyzing: false,
      analysisProgress: 0,
      analysisStage: "",
      profile: null,
      selectedOccasion: null,
      outfits: [],
      selectedOutfit: null,
      isLoadingOutfits: false,
      tryOnAnalysis: null,
      isTryOnLoading: false,
      referral: null,
    }),
}));
