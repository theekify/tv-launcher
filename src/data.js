const PALETTE = [
  '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#65a30d',
  '#c026d3', '#2563eb', '#dc2626', '#0d9488', '#ca8a04',
]

// same title always gets the same colour (used when a movie has no poster)
export function colorFor(str) {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}
