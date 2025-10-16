import React from 'react';

export default function DMCAPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">DMCA policy</h1>
        <p className="text-text-secondary">Digital Millennium Copyright Act compliance and takedown procedures</p>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <div className="bg-background-card rounded-lg border border-border p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Copyright Protection</h2>
            <p className="text-text-secondary">
              PumpBNB respects the intellectual property rights of others and expects our users to do the same. 
              We will respond to clear notices of alleged copyright infringement that comply with the Digital 
              Millennium Copyright Act (DMCA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Filing a DMCA Notice</h2>
            <p className="text-text-secondary mb-3">
              If you believe that content on PumpBNB infringes your copyright, please provide our 
              designated agent with the following information:
            </p>
            <ul className="space-y-2 text-text-secondary">
              <li>• Your physical or electronic signature</li>
              <li>• Identification of the copyrighted work claimed to have been infringed</li>
              <li>• Identification of the allegedly infringing material</li>
              <li>• Your contact information</li>
              <li>• A statement of good faith belief that use is not authorized</li>
              <li>• A statement of accuracy made under penalty of perjury</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Contact Information</h2>
            <div className="bg-background-sidebar p-4 rounded">
              <p className="text-text-secondary">
                <strong>DMCA Agent:</strong><br />
                Email: dmca@pumpbnb.com<br />
                Address: [Legal Department Address]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Counter-Notification</h2>
            <p className="text-text-secondary">
              If you believe that material you posted was removed by mistake or misidentification, 
              you may file a counter-notification. Counter-notifications must include specific 
              information as outlined in the DMCA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Repeat Infringer Policy</h2>
            <p className="text-text-secondary">
              PumpBNB will terminate the accounts of users who are determined to be repeat infringers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}