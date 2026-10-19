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
  roomId?: string;
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

export interface Doorway {
  id: string;
  name: string; // e.g. "Kitchen", "SOPREMISH'S LAB"
  targetRoomId: string;
  targetSpawn: Position;
  facingOnArrival?: Direction;
  bounds: Rect; // Trigger area where player steps to transition
  promptPosition: Position; // Floating "[E] Enter Kitchen" prompt
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

export type RoomTheme =
  | 'living_room'
  | 'kitchen'
  | 'bedroom'
  | 'balcony'
  | 'garage'
  | 'theatre'
  | 'working_lab'
  | 'bathroom'
  | 'store_room';

export interface RoomDefinition {
  id: string;
  name: string;
  theme: RoomTheme;
  icon: string;
  description?: string;
  tileWidth: number; // In tiles
  tileHeight: number; // In tiles
  tileSize: number; // In pixels (32)
  pixelWidth: number; // tileWidth * tileSize
  pixelHeight: number; // tileHeight * tileSize
  playerSpawn: Position;
  floorSpriteKey?: string;
  wallTheme?: string;
  walls: Rect[]; // Solid wall collision boxes
  doors: Doorway[]; // Doorways connecting to other rooms
  furniture: RoomObject[];
  interactiveObjects: InteractiveObject[];
  ambientLighting?: {
    color: string;
    intensity: number;
    pulseSpeed?: number;
  };
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}
