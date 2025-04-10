
import { useState } from 'react';
import { api } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

type EmotionAnalysisResult = {
  primaryEmotion: string;
  reflection: string;
  suggestions: string[];
  intensity: number;
};

export function useEmotionAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EmotionAnalysisResult | null>(null);

  const analyzeEmotion = async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter your feelings to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await api.analyzeEmotion(text);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setResult(response.data);
      return response.data;
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      toast({
        title: "Analysis failed",
        description: "We couldn't analyze your emotions. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeEmotion,
    isAnalyzing,
    result,
    resetResult: () => setResult(null)
  };
}
