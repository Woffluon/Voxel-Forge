export type AppStatus =
  | 'idle'
  | 'generating_image'
  | 'generating_voxels'
  | 'error';

export type ViewMode = 'image' | 'voxel';

export interface Example {
  img: string;
  html: string;
  alt: string;
}

export interface UserContent {
  image: string;
  voxel: string | null;
  prompt: string;
}

export type SelectedTile = number | 'user' | null;
