'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';

interface FeatureCard {
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    title: 'Reasoning DAG',
    description:
      'Map every reasoning step into a directed acyclic graph. See branching logic, dead ends, and the path to the final answer laid out structurally.',
  },
  {
    title: 'Step Attribution',
    description:
      'Understand which intermediate steps contributed to the conclusion. Attribute weight to individual reasoning nodes across the trace.',
  },
  {
    title: 'Cross-Model Comparison',
    description:
      'Run the same prompt through multiple models and compare their reasoning topologies side by side. Spot divergence patterns instantly.',
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <main>
          <section className="hero">
            <h1>Visualize how language models think</h1>
            <p className="hero-description">
              Trace, explore, and compare reasoning paths across models. Built
              for engineers and researchers who need to understand what happens
              between prompt and completion.
            </p>
            <Link href="/auth/login" className="hero-cta">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              Continue with GitHub
            </Link>
          </section>

          <section className="features">
            <div className="features-grid">
              {features.map((feature) => (
                <div key={feature.title} className="feature-card">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <span>&copy; 2026 ThoughtDag</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </footer>
      </motion.div>
    </>
  );
}
