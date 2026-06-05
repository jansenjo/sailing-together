import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16 pb-20 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link to="/disclaimer" className="hover:text-gray-700 transition-colors">Disclaimer</Link>
            <Link to="/privacy"    className="hover:text-gray-700 transition-colors">Privacyverklaring</Link>
            <a href="mailto:contact@sailing-together.com" className="hover:text-gray-700 transition-colors">
              contact@sailing-together.com
            </a>
          </nav>

          <p className="text-xs text-gray-300">
            © {new Date().getFullYear()} Sail Together
          </p>
        </div>
      </div>
    </footer>
  )
}
