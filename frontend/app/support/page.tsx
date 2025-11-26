'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    question: 'How do I create a token?',
    answer: 'Connect your wallet, click "Create" in the navigation, fill in your token details (name, symbol, description, image), and confirm the transaction. Your token will be live on the bonding curve immediately.',
  },
  {
    question: 'What is a bonding curve?',
    answer: 'A bonding curve is an automated market maker that determines token price based on supply. As more tokens are bought, the price increases. When tokens are sold, the price decreases. This creates a fair and transparent pricing mechanism.',
  },
  {
    question: 'What happens when a token graduates?',
    answer: 'When a token reaches 100 ASTER in liquidity on the bonding curve, it "graduates" to PancakeSwap. The liquidity is automatically migrated to create a trading pair, and LP tokens are burned for permanent liquidity.',
  },
  {
    question: 'What are the trading fees?',
    answer: 'During the bonding curve phase, there is a 1% trading fee split between the token creator (0.3%) and the platform (0.7%). After graduation, fees are reduced to 0.3% total.',
  },
  {
    question: 'How do I get ASTER tokens?',
    answer: 'ASTER is the native token used for trading on our platform. You can acquire ASTER from supported exchanges or swap BNB for ASTER on PancakeSwap.',
  },
  {
    question: 'Is my token safe?',
    answer: 'All smart contracts are deployed on BNB Chain and are immutable. Token creators cannot rug pull because liquidity is locked in the bonding curve until graduation, after which LP tokens are burned.',
  },
  {
    question: 'Why is my transaction failing?',
    answer: 'Common reasons include: insufficient ASTER balance, insufficient BNB for gas, high slippage during volatile periods, or network congestion. Try increasing slippage tolerance or waiting for network conditions to improve.',
  },
  {
    question: 'How do I view my holdings?',
    answer: 'Go to your Profile page by clicking on Profile in the navigation. The "Balances" tab shows all tokens you hold and your P&L statistics.',
  },
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-secondary pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Support Center</h1>
          <p className="text-gray-400 text-lg">
            Get help with ASTER FUN platform
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Link
            href="/how-it-works"
            className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition group"
          >
            <div className="text-3xl mb-3">📖</div>
            <h3 className="font-bold mb-2 group-hover:text-primary transition">How It Works</h3>
            <p className="text-sm text-gray-400">Learn the basics of token creation and trading</p>
          </Link>
          <Link
            href="/docs"
            className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition group"
          >
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-bold mb-2 group-hover:text-primary transition">Documentation</h3>
            <p className="text-sm text-gray-400">Technical docs and API reference</p>
          </Link>
          <a
            href="https://t.me/your_telegram_channel"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary-light border border-gray-700 rounded-xl p-6 hover:border-primary transition group"
          >
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold mb-2 group-hover:text-primary transition">Community</h3>
            <p className="text-sm text-gray-400">Join our Telegram for live support</p>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-secondary-light border border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-gray-400 mb-6">
            Our team is here to assist you. Reach out through any of these channels:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://x.com/AsterFun"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-secondary px-6 py-3 rounded-lg hover:bg-secondary-light transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter/X
            </a>
            <a
              href="https://t.me/your_telegram_channel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-secondary px-6 py-3 rounded-lg hover:bg-secondary-light transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.23 13.615l-2.97-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
              Telegram
            </a>
            <a
              href="https://discord.gg/your_discord"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-secondary px-6 py-3 rounded-lg hover:bg-secondary-light transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
