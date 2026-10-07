import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  "Technology", "Business", "Design", "Science", "Culture",
  "Education", "Politics", "Finance", "AI", "Programming",
  "Lifestyle", "Personal Development", "Creativity", "Career", "Society"
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [intent, setIntent] = useState<string | null>(null);

  const toggleInterest = (category: string) => {
    setSelectedInterests(prev => 
      prev.includes(category)
        ? prev.filter(i => i !== category)
        : [...prev, category]
    );
  };

  const handleComplete = () => {
    // Here we would typically save preferences to backend
    // For now, mark onboarding as completed in local storage
    localStorage.setItem('onboardingCompleted', 'true');
    navigate('/');
  };

  const skipToApp = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    navigate('/');
  };

  const nextStep = () => setStep(prev => prev + 1);

  // Animations
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };
  const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

  return (
    <div className="min-h-screen bg-light-100 dark:bg-dark-100 flex flex-col relative overflow-hidden text-dark-100 dark:text-light-100 font-serif">
      {/* Background aesthetic */}
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3CfeColorMatrix type=%22matrix%22 values=%221 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0 0%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-light-100/80 dark:to-dark-100/80 z-0 pointer-events-none"></div>

      {/* Progress & Header */}
      <div className="relative z-10 p-8 flex justify-between items-center w-full max-w-4xl mx-auto">
        <div className="font-heading font-bold text-2xl tracking-tighter">KBlog.</div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-primary-600 dark:bg-primary-400' : 'w-1.5 bg-light-300 dark:bg-dark-300'}`} />
          ))}
        </div>
        <button onClick={skipToApp} className="text-sm font-medium text-dark-300 dark:text-light-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors">
          Skip for now
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div
                key="step1"
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="text-center"
              >
                <div className="mb-12 relative w-64 h-64 mx-auto bg-dark-200 rounded-full overflow-hidden flex items-center justify-center border-4 border-light-200 dark:border-dark-300 shadow-2xl">
                   <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply z-10"></div>
                   <img src="https://images.unsplash.com/photo-1513001900722-370f803f498d?q=80&w=2787&auto=format&fit=crop" alt="Books" className="absolute inset-0 w-full h-full object-cover grayscale opacity-80" />
                </div>
                <h1 className="text-5xl md:text-6xl font-heading font-bold tracking-tight mb-6">Welcome to KBlog.</h1>
                <p className="text-xl md:text-2xl font-light text-dark-400 dark:text-light-400 max-w-xl mx-auto mb-12 leading-relaxed">
                  A better place for ideas worth reading. Let's quickly personalize your experience so you see what matters most to you.
                </p>
                <button onClick={nextStep} className="rounded-full bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 px-8 py-4 font-medium text-lg hover:scale-105 transition-transform duration-300 shadow-xl">
                  Let's personalize KBlog
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              >
                <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4 text-center">What are you interested in?</h2>
                <p className="text-lg font-light text-dark-400 dark:text-light-400 text-center mb-12">Choose a few topics you'd love to read about.</p>
                
                <div className="flex flex-wrap gap-4 justify-center mb-12">
                  {CATEGORIES.map(category => {
                    const isSelected = selectedInterests.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => toggleInterest(category)}
                        className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${isSelected ? 'bg-primary-600 text-white shadow-md scale-105 border-transparent' : 'bg-transparent border border-light-300 dark:border-dark-300 text-dark-300 dark:text-light-300 hover:border-dark-100 dark:hover:border-light-100'}`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex justify-center">
                  <button onClick={nextStep} className={`rounded-full px-8 py-4 font-medium text-lg transition-all duration-300 shadow-xl ${selectedInterests.length > 0 ? 'bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 hover:scale-105' : 'bg-light-200 dark:bg-dark-300 text-dark-300 dark:text-light-400'}`}>
                    {selectedInterests.length > 0 ? 'Continue' : 'Skip this step'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
              >
                <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4 text-center">What brings you to KBlog?</h2>
                <p className="text-lg font-light text-dark-400 dark:text-light-400 text-center mb-12">This helps us tailor your workspace.</p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {[
                    { id: 'read', title: 'Read', desc: 'Discover ideas, perspectives, and stories.' },
                    { id: 'write', title: 'Write', desc: 'Share your ideas and publish your work.' },
                    { id: 'both', title: 'Both', desc: 'Read, write, and build your audience.' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setIntent(option.id)}
                      className={`text-left p-8 rounded-3xl border transition-all duration-300 ${intent === option.id ? 'border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg scale-105' : 'border-light-300 dark:border-dark-300 hover:border-dark-200 dark:hover:border-light-200 bg-light-100/50 dark:bg-dark-200/50'}`}
                    >
                      <h3 className="text-2xl font-heading font-bold mb-3">{option.title}</h3>
                      <p className={`font-light ${intent === option.id ? 'text-dark-200 dark:text-light-200' : 'text-dark-400 dark:text-light-400'}`}>{option.desc}</p>
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <button onClick={nextStep} className={`rounded-full px-8 py-4 font-medium text-lg transition-all duration-300 shadow-xl ${intent ? 'bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 hover:scale-105' : 'bg-light-200 dark:bg-dark-300 text-dark-300 dark:text-light-400'}`}>
                    {intent ? 'Continue' : 'Skip this step'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="text-center"
              >
                <div className="mb-12 relative w-64 h-64 mx-auto bg-dark-200 rounded-full overflow-hidden flex items-center justify-center border-4 border-light-200 dark:border-dark-300 shadow-2xl">
                   <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply z-10"></div>
                   <img src="https://images.unsplash.com/photo-1455390582262-044cdead2708?q=80&w=2873&auto=format&fit=crop" alt="Writing" className="absolute inset-0 w-full h-full object-cover grayscale opacity-80" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2940&auto=format&fit=crop"; }} />
                </div>
                <h1 className="text-5xl md:text-6xl font-heading font-bold tracking-tight mb-6">You're all set.</h1>
                <p className="text-xl md:text-2xl font-light text-dark-400 dark:text-light-400 max-w-xl mx-auto mb-12 leading-relaxed">
                  {intent === 'write' ? "Ready to write your first story?" 
                   : intent === 'read' ? "Here's where your reading journey begins." 
                   : "Read something. Write something. Make it yours."}
                </p>
                <button onClick={handleComplete} className="rounded-full bg-primary-600 text-white px-8 py-4 font-medium text-lg hover:bg-primary-700 hover:scale-105 transition-all duration-300 shadow-xl">
                  Let's go
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
