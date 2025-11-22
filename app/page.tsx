import Link from 'next/link';
import { ArrowRight, Terminal, Shield, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <span className="text-sm text-gray-300">Competition Live Now</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Master the Art of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Prompt Injection
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Join the ultimate AI security CTF. Test your skills against advanced LLM defenses,
            uncover vulnerabilities, and climb the global leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/practice"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center"
            >
              Start Hacking
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/teams"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-lg transition-all flex items-center"
            >
              Create Team
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-world Scenarios</h3>
              <p className="text-gray-400">
                Face off against production-grade LLM defenses simulated in a controlled environment.
              </p>
            </div>

            <div className="glass-card p-8 hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Team Competition</h3>
              <p className="text-gray-400">
                Form squads of up to 4 members. Collaborate, share strategies, and dominate the leaderboard.
              </p>
            </div>

            <div className="glass-card p-8 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Scoring</h3>
              <p className="text-gray-400">
                Instant feedback on your submissions. Watch your rank rise in real-time as you crack the codes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
