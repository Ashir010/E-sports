/** DEMO DATA fixtures — all names are fictional. */

export const DEMO_USERS = [
  {
    id: 'u-demo-admin',
    username: 'arena.admin',
    displayName: 'Arena Admin',
    avatarColor: '#8B5CF6',
    avatarUrl: null,
    college: 'Esports Hub Organising Committee',
    favoriteGame: 'valorant',
    gameIds: {},
    role: 'admin',
    bio: 'Tournament operations. Ping me for disputes and scheduling.',
  },
  {
    id: 'u-demo-captain',
    username: 'kabir.gg',
    displayName: 'Kabir Mehta',
    avatarColor: '#C6FF3D',
    avatarUrl: null,
    college: 'Delhi Technological University',
    favoriteGame: 'valorant',
    gameIds: { valorant: 'kabir#DTU1' },
    role: 'player',
    bio: 'IGL for Phantom Protocol. Controller main, Omen enjoyer.',
  },
  {
    id: 'u-demo-player',
    username: 'ananya.exe',
    displayName: 'Ananya Rao',
    avatarColor: '#22D3EE',
    avatarUrl: null,
    college: 'BITS Pilani',
    favoriteGame: 'valorant',
    gameIds: { valorant: 'ananya#BITS' },
    role: 'player',
    bio: 'Duelist for Neon Vandals. Jett or bust.',
  },
];

/** Order inside each game matters: seed.js references teams by index. */
export const DEMO_TEAMS = [
  // Valorant (5v5)
  { id: 'tm-phantom', name: 'Phantom Protocol', tag: 'PHX', game: 'valorant', college: 'Delhi Technological University', color: '#C6FF3D', inviteCode: 'PHX4KQ9Z', fixedCaptain: 'u-demo-captain' },
  { id: 'tm-neon', name: 'Neon Vandals', tag: 'NVD', game: 'valorant', college: 'BITS Pilani', color: '#22D3EE', inviteCode: 'NVD7TB2M', fixedMembers: ['u-demo-player'] },
  { id: 'tm-spike', name: 'Spike Syndicate', tag: 'SPK', game: 'valorant', college: 'IIIT Hyderabad', color: '#FF4655', inviteCode: 'SPK3XW8R' },
  { id: 'tm-radiant', name: 'Radiant Rush', tag: 'RDR', game: 'valorant', college: 'VIT Vellore', color: '#F5A524', inviteCode: 'RDR9LM4C' },
  { id: 'tm-echo', name: 'Echo Five', tag: 'EC5', game: 'valorant', college: 'Netaji Subhas University of Technology', color: '#8B5CF6', inviteCode: 'EC5Q2N7V' },
  { id: 'tm-kinetic', name: 'Kinetic Ascent', tag: 'KNA', game: 'valorant', college: 'Manipal Institute of Technology', color: '#E879F9', inviteCode: 'KNA6HD3P' },
  // BGMI (squad)
  { id: 'tm-soul', name: 'Soul Raiders', tag: 'SLR', game: 'bgmi', college: 'Amity University Noida', color: '#F5A524', inviteCode: 'SLR2PQ8K' },
  { id: 'tm-zone', name: 'Zone Breakers', tag: 'ZNB', game: 'bgmi', college: 'Lovely Professional University', color: '#60A5FA', inviteCode: 'ZNB5RT1W' },
  { id: 'tm-erangel', name: 'Erangel Elites', tag: 'ERE', game: 'bgmi', college: 'Chandigarh University', color: '#3DDC97', inviteCode: 'ERE8YU3N' },
  { id: 'tm-redzone', name: 'Red Zone Rebels', tag: 'RZR', game: 'bgmi', college: 'SRM Institute of Science and Technology', color: '#FF4655', inviteCode: 'RZR4CV6B' },
  { id: 'tm-airdrop', name: 'Airdrop Assassins', tag: 'ADA', game: 'bgmi', college: 'IIT Delhi', color: '#C6FF3D', inviteCode: 'ADA1JK7L' },
  { id: 'tm-pochinki', name: 'Pochinki Panthers', tag: 'PKP', game: 'bgmi', college: 'Christ University', color: '#8B5CF6', inviteCode: 'PKP6GF2D' },
  // Free Fire (squad)
  { id: 'tm-booyah', name: 'Booyah Brigade', tag: 'BYB', game: 'freefire', college: 'SRM Institute of Science and Technology', color: '#FF7A1A', inviteCode: 'BYB3QS9A' },
  { id: 'tm-inferno', name: 'Inferno Squad', tag: 'INF', game: 'freefire', college: 'VIT Vellore', color: '#FF4655', inviteCode: 'INF7WE4Z' },
  { id: 'tm-clash', name: 'Clash Kings', tag: 'CLK', game: 'freefire', college: 'Lovely Professional University', color: '#FACC15', inviteCode: 'CLK2XC5V' },
  { id: 'tm-bermuda', name: 'Bermuda Blitz', tag: 'BMB', game: 'freefire', college: 'Amity University Noida', color: '#22D3EE', inviteCode: 'BMB9NM1Q' },
  // Mini Militia (duo)
  { id: 'tm-doodle', name: 'Doodle Dynamos', tag: 'DDY', game: 'minimilitia', college: 'Delhi Technological University', color: '#3DDC97', inviteCode: 'DDY4BH8T' },
  { id: 'tm-jetpack', name: 'Jetpack Jesters', tag: 'JPJ', game: 'minimilitia', college: 'Netaji Subhas University of Technology', color: '#E879F9', inviteCode: 'JPJ6KL2S' },
  { id: 'tm-sniper', name: 'Sniper Sloths', tag: 'SNS', game: 'minimilitia', college: 'IIIT Hyderabad', color: '#60A5FA', inviteCode: 'SNS1ZX7E' },
  { id: 'tm-rocket', name: 'Rocket Rascals', tag: 'RKR', game: 'minimilitia', college: 'Manipal Institute of Technology', color: '#F5A524', inviteCode: 'RKR8PO3U' },
];

export const HANDLES = [
  'Zephyr', 'NightOwl', 'Riftz', 'Vortex', 'Blaze', 'Kairo', 'Specter', 'Nova', 'Hexa', 'Drift',
  'Pulse', 'Raze0', 'Frostbyte', 'Mirage', 'Talon', 'Cipher', 'Onyx', 'Havoc', 'Saber', 'Lynx',
  'Quill', 'Ember', 'Rogue', 'Volt', 'Ghosty', 'Krait', 'Nexus', 'Orbit', 'Prism', 'Rush',
  'Sly', 'Torque', 'Umbra', 'Viper', 'Wraith', 'Xeno', 'Yeti', 'Zenith', 'Atlas', 'Bolt',
  'Comet', 'Dusk', 'Echo', 'Flux', 'Grit', 'Halo', 'Ion', 'Jinx', 'Karma', 'Loki',
  'Mamba', 'Nitro', 'Omen', 'Pixel', 'Quake', 'Rebel', 'Shade', 'Titan', 'Ultra', 'Valk',
  'Warden', 'Xylo', 'Yoru', 'Zion', 'Apex', 'Bandit', 'Cobra', 'Dynamo', 'Enigma', 'Fang',
  'Glitch', 'Hunter', 'Inked', 'Jolt', 'Kenji', 'Lumen', 'Maverick', 'Neon',
];

export const FIRST_NAMES = [
  'Aarav', 'Ishaan', 'Diya', 'Rohan', 'Meera', 'Arjun', 'Sana', 'Vihaan', 'Kavya', 'Aditya',
  'Nisha', 'Reyansh', 'Tara', 'Kunal', 'Priya', 'Dev', 'Aisha', 'Yash', 'Riya', 'Siddharth',
  'Zoya', 'Harsh', 'Anika', 'Pranav', 'Ira', 'Rahul', 'Neha', 'Varun', 'Pooja', 'Aryan',
];

export const LAST_NAMES = [
  'Sharma', 'Iyer', 'Khan', 'Gupta', 'Reddy', 'Nair', 'Singh', 'Patel', 'Das', 'Menon',
  'Bose', 'Kapoor', 'Joshi', 'Chopra', 'Verma', 'Pillai', 'Malhotra', 'Shetty', 'Bhat', 'Saxena',
];
