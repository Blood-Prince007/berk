export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: Direction;
  isMoving: boolean;
  animFrame: number;
  walkTimer: number;
  avatarId?: string;
  // Prepared for Phase 2 multiplayer:
  avatarColor?: {
    sweater: string;
    hair: string;
    pants: string;
  };
}

export interface InteractiveObject {
  id: string;
  name: string;
  bounds: Rect; // Proximity detection area
  promptPosition: Position; // Where floating "[E] Inspect" shows
  title: string;
  description: string;
  actionText?: string;
}

export interface RoomObject {
  id: string;
  spriteKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // Base Y for depth sorting (default: y + height)
  depthY?: number;
  // If this object is solid, define its physical collision box
  solidBox?: Rect;
}

export interface RoomDefinition {
  id: string;
  name: string;
  tileWidth: number; // In tiles (e.g. 22)
  tileHeight: number; // In tiles (e.g. 15)
  tileSize: number; // In pixels (e.g. 32)
  pixelWidth: number; // tileWidth * tileSize
  pixelHeight: number; // tileHeight * tileSize
  playerSpawn: Position;
  walls: Rect[]; // Solid wall collision boxes
  furniture: RoomObject[];
  interactiveObjects: InteractiveObject[];
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}
