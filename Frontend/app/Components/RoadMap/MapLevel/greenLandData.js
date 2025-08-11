// @refresh reset

const levels = [
  {
    id: 1,
    level: 1,
    isUnlocked: true,
    type: 'enemy',
    content: "Testing",
    levelName: 'HTML',
  },
  {
    id: 2,
    level: 1,
    isUnlocked: true,
    type: 'micomi',
    levelName: 'HTML',
  },
  {
    id: 3,
    level: 3,
    isUnlocked: true,
    type: 'shop',
    levelName: 'CSS',
  },
  {
    id: 4,
    level: 4,
    isUnlocked: true,
    type: 'enemy',
    content: 'none',
    levelName: 'CSS',
  },
  {
    id: 5,
    level: 5,
    isUnlocked: true,
    type: 'enemy',
    content: "Testing",
  },
  {
    id: 6,
    level: 6,
    isUnlocked: true,
    type: 'enemy',
    content: ''
  },
  {
    id: 7,
    level: 7,
    isUnlocked: true,
    type: 'enemy'
  },
  {
    id: 8,
    level: 8,
    isUnlocked: true,
    type: 'boss'
  },
  {
    id: 9,
    level: 9,
    isUnlocked: false,
    type: 'micomi'
  },
  {
    id: 10,
    level: 10,
    isUnlocked: false,
    type: 'shop'
  },
  {
    id: 11,
    level: 11,
    isUnlocked: false,
    type: 'level'
  },
  //until to 16
  {
    id: 12,
    level: 12,
    isUnlocked: false,
    type: 'level'
  },
  {
    id: 13,
    level: 13,
    isUnlocked: false,
    type: 'level',
    content: 'footer'
  },
  {
    id: 14,
    level: 14,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 15,
    level: 15,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 16,
    level: 16,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'shop'
  },
  //until 24
  {
    id: 17,
    level: 17,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 18,
    level: 18,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 19,
    level: 19,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 20,
    level: 20,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 21,
    level: 21,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'level'
  },
  {
    id: 22,
    level: 22,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 23,
    level: 23,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 24,
    level: 24,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'micomi'
  },
  {
    id: 25,
    level: 25,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'shop'
  },
  //until 100
  {
    id: 26,
    level: 26,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 27,
    level: 27,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 28,
    level: 28,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 29,
    level: 29,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 30,
    level: 30,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'level'
  },
  {
    id: 31,
    level: 31,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 32,
    level: 32,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 33,
    level: 33,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 34,
    level: 34,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 35,
    level: 35,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'level'
  },
  {
    id: 36,
    level: 36,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 37,
    level: 37,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 38,
    level: 38,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 39,
    level: 39,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'micomi'
  },
  {
    id: 40,
    level: 40,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'shop'
  },
  {
    id: 41,
    level: 41,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 42,
    level: 42,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 43,
    level: 43,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 44,
    level: 44,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 45,
    level: 45,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'level'
  },
  {
    id: 46,
    level: 46,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 47,
    level: 47,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 48,
    level: 48,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'level'
  },
  {
    id: 49,
    level: 49,
    isUnlocked: false, // CHANGED: from locked: false
    type: 'micomi'
  },
  {
    id: 50,
    level: 50,
    isUnlocked: false, // CHANGED: from locked: true
    type: 'shop'
  },
  // Add more levels...
];

export default levels;