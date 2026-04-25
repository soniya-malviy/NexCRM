import DemoForm from '../../components/public/DemoForm';
import { ArrowRight, Zap, Shield, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-dark-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm rotate-45"></div>
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight">NexusCRM</span>
          </div>
          <a href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-32">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none">
          <div className="absolute top-20 left-0 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full"></div>
          <div className="absolute top-40 right-0 w-72 h-72 bg-purple-500/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <Zap size={16} /> Powering modern sales teams
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-[1.1] mb-6">
                Close deals faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI-driven</span> insights.
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
                NexusCRM brings your sales, support, and analytics into one intelligent workspace. Request a demo to see how we can transform your workflow.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-blue-400"><Shield size={16} /></div>
                  Enterprise-grade security
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-purple-400"><BarChart size={16} /></div>
                  Real-time analytics dashboard
                </div>
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <DemoForm />
            </div>

          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} NexusCRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
