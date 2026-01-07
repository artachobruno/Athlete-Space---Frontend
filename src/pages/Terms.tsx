import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { FileText, AlertTriangle, Scale, Shield, UserCheck, Brain } from 'lucide-react';

export default function Terms() {
  return (
    <PublicLayout>
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: January 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-foreground/90">
            {/* Introduction */}
            <section className="space-y-4">
              <p className="leading-relaxed">
                Welcome to Athlete Space. By accessing or using our platform, you agree to be bound 
                by these Terms of Service. Please read them carefully before using the service.
              </p>
              <p className="leading-relaxed">
                Athlete Space is an AI-powered endurance training platform designed to help athletes 
                train smarter through data-driven insights and personalized guidance.
              </p>
            </section>

            {/* Service Description */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-primary">Service Description</h2>
              </div>
              <p className="leading-relaxed">
                Athlete Space provides training and performance insights for endurance athletes. 
                Our platform analyzes training data, offers workout suggestions, and delivers 
                AI-generated recommendations to support your athletic development.
              </p>
              <p className="leading-relaxed">
                The service is intended as a tool to assist athletes in making informed training 
                decisions. All insights, recommendations, and guidance provided are informational 
                in nature and designed to support—not replace—your own judgment.
              </p>
            </section>

            {/* Medical Disclaimer */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-2xl font-semibold text-destructive">Medical Disclaimer</h2>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 space-y-4">
                <p className="leading-relaxed font-medium">
                  Athlete Space does NOT provide medical advice, diagnosis, or treatment.
                </p>
                <p className="leading-relaxed">
                  The information and recommendations provided through our platform are for 
                  training and performance purposes only. They are not intended to diagnose, 
                  treat, cure, or prevent any medical condition.
                </p>
                <p className="leading-relaxed">
                  Always consult with qualified healthcare professionals before starting any 
                  new training program, especially if you have pre-existing health conditions, 
                  injuries, or concerns about your physical readiness for exercise.
                </p>
              </div>
            </section>

            {/* AI-Generated Content */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-primary">AI-Generated Insights</h2>
              </div>
              <p className="leading-relaxed">
                Athlete Space uses artificial intelligence to analyze your training data and 
                generate personalized insights. These AI-generated recommendations are:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    <strong>Informational only</strong> — intended to inform, not to direct your training
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    <strong>Decision-support tools</strong> — designed to assist your judgment, not replace it
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    <strong>Not a substitute for professional coaching</strong> — we recommend working 
                    with qualified coaches for comprehensive training guidance
                  </span>
                </li>
              </ul>
            </section>

            {/* User Responsibility */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-primary">User Responsibility</h2>
              </div>
              <p className="leading-relaxed">
                As a user of Athlete Space, you acknowledge and agree that:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    You are solely responsible for all training decisions you make
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    You will listen to your body and adjust training as needed
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    You will seek appropriate medical attention when experiencing pain, 
                    injury, or health concerns
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    You understand that athletic training carries inherent risks
                  </span>
                </li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-primary">Limitation of Liability</h2>
              </div>
              <p className="leading-relaxed">
                To the maximum extent permitted by applicable law, Athlete Space and its creators, 
                operators, and affiliates shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    Personal injury, illness, or health complications arising from training activities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    Loss of athletic performance or competition results
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    Any decisions made based on AI-generated insights or recommendations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 shrink-0" />
                  <span className="leading-relaxed">
                    Data loss or service interruptions
                  </span>
                </li>
              </ul>
            </section>

            {/* Privacy Policy Reference */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-primary">Data & Privacy</h2>
              </div>
              <p className="leading-relaxed">
                Your privacy is important to us. For detailed information about how we collect, 
                use, and protect your data, please refer to our{' '}
                <Link to="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">Changes to These Terms</h2>
              <p className="leading-relaxed">
                We may update these Terms of Service from time to time. We will notify users of 
                any material changes by posting the updated terms on this page with a revised 
                "Last updated" date. Your continued use of the service after such changes 
                constitutes acceptance of the updated terms.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-4 pb-8">
              <h2 className="text-2xl font-semibold text-primary">Questions?</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please reach out to us 
                through the platform or consult our{' '}
                <Link to="/faq" className="text-primary hover:underline font-medium">
                  FAQ
                </Link>{' '}
                for more information.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
