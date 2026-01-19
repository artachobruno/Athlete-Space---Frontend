import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

const links = {
  Product: ['Features', 'Pricing', 'Integrations', 'API'],
  Company: ['About', 'Careers', 'Blog', 'Press'],
  Resources: ['Documentation', 'Help Center', 'Community', 'Contact'],
  Legal: ['Privacy', 'Terms', 'Security'],
};

export const FooterSection = () => {
  return (
    <footer className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-slate-950" />
      
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Main footer content */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="font-semibold text-white">Athlete Space</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Intelligence for endurance athletes. Train smarter, perform better.
                </p>
              </motion.div>
            </div>

            {/* Link columns */}
            {Object.entries(links).map(([category, items], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              >
                <h4 className="text-sm font-medium text-white mb-4">{category}</h4>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom bar */}
          <motion.div
            className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} Athlete Space. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {['Twitter', 'Instagram', 'Strava', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};
