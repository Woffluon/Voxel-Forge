export interface GenerateImageParams {
  prompt: string;
  aspectRatio: string;
  optimize: boolean;
}

export interface GenerateVoxelParams {
  imageBase64: string;
  onThoughtUpdate?: (thought: string) => void;
}
