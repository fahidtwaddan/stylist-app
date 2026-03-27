"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ScanningAnimation from "@/components/ScanningAnimation";
import { useStyleStore } from "@/store/useStyleStore";

// Resize image client-side before uploading — smaller images = faster Vision API
async function resizeImage(file: File, maxDim: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Skip resize if already small enough
      if (img.width <= maxDim && img.height <= maxDim) {
        resolve(file);
        return;
      }

      const scale = maxDim / Math.max(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file); // Fallback to original
    img.src = URL.createObjectURL(file);
  });
}

const ANALYSIS_STAGES = [
  "Detecting body proportions...",
  "Analyzing skin tone...",
  "Mapping color season...",
  "Decoding style personality...",
  "Crafting your archetype...",
  "Generating recommendations...",
  "Finalizing your style DNA...",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const {
    photo,
    photoFile,
    analysisProgress,
    analysisStage,
    setAnalysisProgress,
    setProfile,
    setAnalyzing,
    setPhotoBase64,
  } = useStyleStore();

  const runAnalysis = useCallback(async () => {
    if (!photoFile || !photo) {
      router.push("/");
      return;
    }

    setAnalyzing(true);

    // Simulate progress while API call runs
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 8 + 2;
        if (progress > 90) progress = 90;
        const stageIndex = Math.min(
          Math.floor((progress / 100) * ANALYSIS_STAGES.length),
          ANALYSIS_STAGES.length - 1
        );
        setAnalysisProgress(progress, ANALYSIS_STAGES[stageIndex]);
      }
    }, 400);

    try {
      // Save base64 for later try-on API
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        setPhotoBase64(base64, photoFile.type);
      };
      reader.readAsDataURL(photoFile);

      // Resize image before upload to speed up Vision API
      const resizedFile = await resizeImage(photoFile, 1024);

      const formData = new FormData();
      formData.append("photo", resizedFile);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();

      clearInterval(interval);
      setAnalysisProgress(100, "Complete!");
      setProfile(data.profile);

      setTimeout(() => {
        setAnalyzing(false);
        router.push("/profile");
      }, 800);
    } catch (error) {
      clearInterval(interval);
      console.error("Analysis error:", error);
      setAnalyzing(false);
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setAnalysisProgress(
        0,
        isTimeout ? "Timed out — tap to retry" : "Error — tap to retry"
      );
    }
  }, [photoFile, photo, router, setAnalyzing, setAnalysisProgress, setProfile, setPhotoBase64]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (!photo) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <ScanningAnimation
          photoUrl={photo}
          progress={analysisProgress}
          stage={analysisStage}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center text-sm text-white/40"
      >
        Our AI is reading your unique style DNA...
      </motion.p>

      {analysisStage === "Error — tap to retry" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={runAnalysis}
          className="mt-4 rounded-xl bg-gold-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Retry Analysis
        </motion.button>
      )}
    </div>
  );
}
