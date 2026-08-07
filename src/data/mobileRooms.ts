export type MobileRoom = {
  id: string;
  name: string;
  imageUrl: string;
  defaultPosition: { x: number; y: number };
};

export const MOBILE_ROOMS: readonly MobileRoom[] = [
  {
    id: 'mobile-lavender-lounge',
    name: 'Lavender Gallery Lounge',
    imageUrl: '/rooms/mobile-room-01.webp',
    defaultPosition: { x: 50, y: 34 },
  },
  {
    id: 'mobile-moroccan-salon',
    name: 'Contemporary Moroccan Salon',
    imageUrl: '/rooms/mobile-room-02.webp',
    defaultPosition: { x: 50, y: 32 },
  },
  {
    id: 'mobile-japandi-room',
    name: 'Quiet Japandi Room',
    imageUrl: '/rooms/mobile-room-03.webp',
    defaultPosition: { x: 52, y: 34 },
  },
  {
    id: 'mobile-paris-apartment',
    name: 'Paris Apartment',
    imageUrl: '/rooms/mobile-room-04.webp',
    defaultPosition: { x: 50, y: 33 },
  },
  {
    id: 'mobile-concrete-loft',
    name: 'Concrete Design Loft',
    imageUrl: '/rooms/mobile-room-05.webp',
    defaultPosition: { x: 50, y: 35 },
  },
  {
    id: 'mobile-calm-bedroom',
    name: 'Calm Linen Bedroom',
    imageUrl: '/rooms/mobile-room-06.webp',
    defaultPosition: { x: 50, y: 31 },
  },
] as const;
