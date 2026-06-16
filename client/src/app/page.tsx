'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/navbar';
import { GitHubButton } from '@/components/github-button';

interface FeatureCard {
  index: string;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    index: '01',
    title: 'Reasoning DAG',
    description:
      'Map every reasoning step into a directed acyclic graph. See branching logic, dead ends, and the path to the final answer laid out structurally.',
  },
  {
    index: '02',
    title: 'Step Attribution',
    description:
      'Understand which intermediate steps contributed to the conclusion. Attribute weight to individual reasoning nodes across the trace.',
  },
  {
    index: '03',
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
            <div className="hero-accent" aria-hidden="true" />
            <h1>Visualize how language models think</h1>
            <p className="hero-description">
              Trace, explore, and compare reasoning paths across models. Built
              for engineers and researchers who need to understand what happens
              between prompt and completion.
            </p>
            <div className="hero-actions">
              <GitHubButton />
            </div>
          </section>

          <section className="features">
            <div className="features-grid">
              {features.map((feature) => (
                <article key={feature.title} className="feature-card">
                  <span className="feature-index">{feature.index}</span>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </article>
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
