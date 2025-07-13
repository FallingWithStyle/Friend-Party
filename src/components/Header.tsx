import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-bg-surface text-text-primary p-4 border-b-4 border-border-primary shadow-lg">
      <nav className="container mx-auto flex justify-between items-center font-heading">
        <Link href="/" className="text-2xl hover:text-primary transition-colors">
          Friend Party
        </Link>
        <div className="space-x-6">
          <Link href="/create" className="hover:text-primary transition-colors">
            Create a Party
          </Link>
          {/* Add other links as needed */}
        </div>
      </nav>
    </header>
  );
}