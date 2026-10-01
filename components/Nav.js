import Link from 'next/link';
export default function Nav(){
  return <header className="nav"><Link className="brand" href="/">AudioStudio<span>Pro</span></Link><nav>
    <Link href="/editor">Editor</Link><Link href="/features">Features</Link><Link href="/blog">Blog</Link><Link href="/help">Help</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/account">Account</Link>
  </nav><Link className="cta" href="/editor">Open Editor</Link></header>
}
