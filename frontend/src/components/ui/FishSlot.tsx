// Slot-machine style fish animation — same size as one Chinese character
const FISHES = ['🐟', '🐠', '🐡', '🦈', '🐬', '🐙'];

export default function FishSlot() {
  return (
    <span className="fish-slot" aria-hidden="true">
      <span className="fish-track">
        {/* 6 fish + duplicate first for seamless loop */}
        {[...FISHES, FISHES[0]].map((f, i) => (
          <span key={i} className="fish-item">{f}</span>
        ))}
      </span>
    </span>
  );
}
