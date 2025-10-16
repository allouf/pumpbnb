import React from 'react';

export default function TrademarkGuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Trademark guidelines</h1>
        <p className="text-text-secondary">Guidelines for using trademarks and brand assets on PumpBNB</p>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <div className="bg-background-card rounded-lg border border-border p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Trademark Respect</h2>
            <p className="text-text-secondary">
              PumpBNB respects trademark rights and expects all users to do the same. 
              Users should not create tokens or content that infringes on existing trademarks 
              or creates consumer confusion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Token Creation Guidelines</h2>
            <ul className="space-y-2 text-text-secondary">
              <li>• Do not use existing brand names, logos, or slogans</li>
              <li>• Avoid creating tokens that impersonate established companies</li>
              <li>• Be creative with original names and concepts</li>
              <li>• Consider trademark searches before launching</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Fair Use and Parody</h2>
            <p className="text-text-secondary">
              While fair use and parody may be protected under certain circumstances, 
              users should be cautious about using trademarked material. When in doubt, 
              create original content or seek legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">PumpBNB Brand Usage</h2>
            <p className="text-text-secondary">
              The PumpBNB name, logo, and other brand assets are trademarks. 
              Unauthorized use of PumpBNB branding is prohibited. For partnership 
              or promotional use, please contact our team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Reporting Violations</h2>
            <p className="text-text-secondary">
              If you believe content on PumpBNB violates your trademark rights, 
              please contact us at legal@pumpbnb.com with detailed information 
              about the alleged infringement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Enforcement</h2>
            <p className="text-text-secondary">
              PumpBNB may remove content or suspend accounts that violate trademark 
              rights. We reserve the right to take appropriate action to protect 
              intellectual property rights.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}