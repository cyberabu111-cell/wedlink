import Link from "next/link";

const designs = [
  { id: "royal-rajwada", name: "Royal Rajwada", mood: "A little grandeur. A lot of love.", style: "royal", mark: "✧", names: "Priya & Rahul" },
  { id: "minimal-sage", name: "Minimal Sage", mood: "For the beautifully understated.", style: "sage", mark: "❧", names: "Aditi & Arjun" },
  { id: "boho-floral", name: "Boho Floral", mood: "Warm hearts. Wild romance.", style: "floral", mark: "✽", names: "Meera & Kabir" },
];

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-nav">
        <Link href="/" className="brand"><span aria-hidden="true">✳</span> everafter<span className="brand-dot">.</span></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <Link href="/login" style={{ fontSize: '13px', fontWeight: 600, color: '#663c51', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/studio/new" className="nav-create">Open studio <span aria-hidden="true">↗</span></Link>
        </div>
      </header>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Made for your once-in-a-lifetime</p>
          <h1>Your love story.<br />An invitation<br /><em>to remember.</em></h1>
          <p className="hero-description">A beautiful little home for your big day. Choose a design, make it yours, and bring your favourite people together.</p>
          <div className="hero-actions"><Link href="/studio/new" className="primary-link">Create your invitation <span aria-hidden="true">↗</span></Link><a href="#designs" className="text-link">Explore designs ↓</a></div>
          <p className="hero-note">Free to create & preview <span>·</span> Pay once when you publish</p>
        </div>
        <div className="hero-art" aria-label="Example wedding invitation for Priya and Rahul">
          <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
          <div className="art-caption">a new chapter begins</div>
          <div className="invitation-paper">
            <span className="paper-flower" aria-hidden="true">❧</span>
            <p className="paper-kicker">Together with our families</p>
            <h2>Priya<br /><i>&</i><br />Rahul</h2>
            <div className="paper-rule" />
            <p className="paper-date">14 · DECEMBER · 2026</p>
            <p className="paper-place">Hyderabad, India</p>
            <span className="paper-footer">THE BEGINNING OF FOREVER</span>
          </div>
          <div className="art-stamp"><span>Made with love</span><strong>Yours, always.</strong></div>
        </div>
      </section>
      <div className="home-ribbon"><span>Your story, beautifully told</span><span aria-hidden="true">✧</span><span>Every celebration, in one place</span><span aria-hidden="true">✧</span><span>Made to share with love</span></div>
      <section id="designs" className="design-section">
        <div className="section-heading"><div><p className="eyebrow">The collection</p><h2>Find your kind of <em>beautiful.</em></h2></div><p>Three distinct styles.<br />One story that’s entirely yours.</p></div>
        <div className="design-grid">{designs.map((design, index) => (
          <Link href={`/studio/new?template=${design.id}`} className="design-card" key={design.id}>
            <div className={`design-art ${design.style}`}><div className="mini-invite"><span className="mini-mark" aria-hidden="true">{design.mark}</span><p>THE WEDDING OF</p><h3>{design.names}</h3><span className="mini-divider" /><p>TOGETHER, FOREVER & ALWAYS</p></div><span className="design-number">0{index + 1}</span></div>
            <div className="design-info"><div><h3>{design.name}</h3><p>{design.mood}</p></div><span className="design-arrow" aria-label={`Choose ${design.name}`}>↗</span></div>
          </Link>
        ))}</div>
      </section>
      <section className="home-steps"><p className="eyebrow">A little magic, made simple</p><h2>From “yes” to <em>“you’re invited.”</em></h2><div className="steps-grid">{[["01", "Find your design", "Choose a look that feels like the two of you."], ["02", "Make it personal", "Add your story, photos and every celebration."], ["03", "Share your day", "Preview for free. Publish when you’re ready."]].map(([number, title, description]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></div>)}</div><Link href="/studio/new" className="primary-link">Let’s make something beautiful ↗</Link></section>
      <footer className="home-footer"><Link href="/" className="brand">✳ everafter.</Link><p>For the moments that become memories.</p><span>Made with love, in India.</span></footer>
    </main>
  );
}
