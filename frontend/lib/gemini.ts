import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export interface AIAnalysisResult {
  issueType: string;
  confidence: number;
  description: string;
  severity: "low" | "medium" | "high";
  recommendations: string[];
}

export async function analyzeImageWithGemini(
  imageBase64: string
): Promise<AIAnalysisResult> {
  try {
    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this urban infrastructure issue image. Provide:

    1. Issue Type: Urban problem category (pothole, broken streetlight, sidewalk, graffiti, garbage dump, footpath enroachment etc.)
    2. Confidence: Assessment confidence only percentage (0-100%)
    3. Description: A description of visible issue
    4. Severity: Give any one from Low/Medium/High, no description needed

    `;

    const imageData = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response to extract structured information
    return parseAIResponse(text);
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to analyze image with AI");
  }
}

function parseAIResponse(aiText: string): AIAnalysisResult {
  try {
    // Default values in case parsing fails
    const defaultResult: AIAnalysisResult = {
      issueType: "Unknown Issue",
      confidence: 70,
      description: aiText || "AI analysis completed but couldn't parse specific details.",
      severity: "medium",
      recommendations: ["Contact local authorities", "Document the issue with photos"],
    };

    // Try to extract structured information from the AI response
    const lines = aiText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let issueType = defaultResult.issueType;
    let confidence = defaultResult.confidence;
    let description = defaultResult.description;
    let severity = defaultResult.severity;
    let recommendations: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Extract issue type
      if (lowerLine.includes('issue type:') || lowerLine.includes('type:')) {
        issueType = line.split(':')[1]?.trim() || issueType;
      }
      
      // Extract confidence
      if (lowerLine.includes('confidence:') || lowerLine.includes('%')) {
        const confidenceMatch = line.match(/(\d+)%/);
        if (confidenceMatch) {
          confidence = parseInt(confidenceMatch[1]);
        }
      }
      
      // Extract severity
      if (lowerLine.includes('severity:')) {
        const severityText = line.split(':')[1]?.trim().toLowerCase() || '';
        if (severityText.includes('low')) severity = 'low';
        else if (severityText.includes('high')) severity = 'high';
        else severity = 'medium';
      }
      
      // Extract recommendations
      if (lowerLine.includes('recommendation') || lowerLine.includes('suggestion')) {
        const recText = line.split(':')[1]?.trim();
        if (recText && recText.length > 10) {
          recommendations.push(recText);
        }
      }
    }

    // If we couldn't extract recommendations, try to find them in the text
    if (recommendations.length === 0) {
      const recMatches = aiText.match(/(?:recommendation|suggestion|advice)[:\s]+([^.\n]+)/gi);
      if (recMatches) {
        recommendations = recMatches.slice(0, 3).map(rec => 
          rec.replace(/(?:recommendation|suggestion|advice)[:\s]+/i, '').trim()
        );
      }
    }

    // If still no recommendations, use the full text as description
    if (recommendations.length === 0) {
      description = aiText;
    }

    return {
      issueType: issueType || defaultResult.issueType,
      confidence: confidence || defaultResult.confidence,
      description: description || defaultResult.description,
      severity: severity || defaultResult.severity,
      recommendations: recommendations.length > 0 ? recommendations : defaultResult.recommendations,
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Return default result if parsing fails
    return {
      issueType: "Unknown Issue",
      confidence: 70,
      description: aiText || "AI analysis completed successfully.",
      severity: "medium",
      recommendations: ["Contact local authorities", "Document the issue with photos"],
    };
  }
}

// Helper function to convert image URI to base64
export async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to convert image to base64");
  }
}
