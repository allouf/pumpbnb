import React from 'react';

export default function LivestreamPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Livestream policy</h1>
        <p className="text-text-secondary">Community guidelines for livestreaming on PumpBNB</p>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <div className="bg-background-card rounded-lg border border-border p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Community Guidelines</h2>
            <ul className="space-y-2 text-text-secondary">
              <li>• Keep content appropriate and respectful</li>
              <li>• No harassment, hate speech, or discriminatory content</li>
              <li>• Respect intellectual property rights</li>
              <li>• No spam or excessive promotion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Trading Content</h2>
            <ul className="space-y-2 text-text-secondary">
              <li>• Educational content is encouraged</li>
              <li>• No financial advice or guarantees</li>
              <li>• Disclose any paid partnerships</li>
              <li>• Focus on community building</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Prohibited Activities</h2>
            <ul className="space-y-2 text-text-secondary">
              <li>• Market manipulation or coordinated trading</li>
              <li>• Pump and dump schemes</li>
              <li>• False or misleading information</li>
              <li>• Impersonation of other users or projects</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Enforcement</h2>
            <p className="text-text-secondary">
              Violations of these guidelines may result in warnings, temporary suspension, 
              or permanent ban from livestreaming features. We reserve the right to take 
              appropriate action to maintain a safe and productive community environment.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}