import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-6 p-6 bg-bg-base">
      <div className="text-6xl font-black text-text-muted">404</div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-base">Page Not Found</h2>
        <p className="text-sm text-text-muted mt-1">The page you're looking for doesn't exist.</p>
      </div>
      <Link href="/" className="px-6 py-3 bg-btn-primary text-text-primary rounded-xl font-bold text-sm hover:opacity-90">
        Go Home
      </Link>
    </div>
  );
}
