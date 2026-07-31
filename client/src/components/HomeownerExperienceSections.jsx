import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const popularServices = [
  { to: '/us/services/decks', title: 'Decks & Porches', image: '/images/service-decks.jpg', icon: '⚒' },
  { to: '/us/services/carpentry', title: 'Doors & Windows', image: '/images/service-carpentry.jpg', icon: '▯' },
  { to: '/us/services/painting', title: 'Painting', image: '/images/service-painting.jpg', icon: '▰' },
  { to: '/us/services/plumbing', title: 'Plumbing', image: '/images/service-plumbing.jpg', icon: '⚙' },
  { to: '/us/services/electrical', title: 'Electrical', image: '/images/service-electrical.jpg', icon: 'ϟ' },
  { to: '/us/services/landscaping', title: 'Landscaping', image: '/images/service-landscaping.jpg', icon: '♧' },
  { to: '/services', title: 'And More', image: '/images/hero-pro.jpg', icon: '⌂' },
];

const steps = [
  { icon: '▤', title: 'Tell Us About Your Project', text: 'Share the details so we can understand your needs.' },
  { icon: '♙', title: 'We Match You with Pros', text: 'We connect you with trusted local professionals.' },
  { icon: '◷', title: 'A Pro Will Contact You Within 24 Hours', text: 'Expect a call, text, or email from a qualified pro.' },
  { icon: '⌂', title: 'Get Your Project Done Right', text: 'Get a quote, schedule, and sit back while it gets done.' },
];

export default function HomeownerExperienceSections() {
  const navigate = useNavigate();

  return (
    <>
      <section id="services" className="bg-white py-12 md:py-16">
        <div className="container-xl">
          <h2 className="text-center text-3xl font-black text-slate-950 md:text-4xl">Popular Services</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {popularServices.map((service) => (
              <Link key={service.title} to={service.to} className="group text-center">
                <div className="relative overflow-visible rounded-2xl">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-44 w-full rounded-2xl object-cover shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
                    loading="lazy"
                  />
                  <span className="absolute -bottom-5 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-black text-2xl font-black text-amber-400 shadow-lg">
                    {service.icon}
                  </span>
                </div>
                <p className="mt-8 text-sm font-black text-slate-950">{service.title}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/services')}
              className="rounded-lg border border-slate-500 bg-white px-10 py-3 font-bold text-slate-950 transition hover:border-amber-400 hover:bg-amber-50"
            >
              View All Services
            </button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-black py-14 text-white md:py-20">
        <div className="container-xl">
          <h2 className="text-center text-3xl font-black md:text-4xl">
            How Fixlo <span className="text-amber-400">Works</span>
          </h2>
          <p className="mt-3 text-center text-white/75">It’s simple. Fast. And built for homeowners.</p>

          <div className="relative mt-12 grid gap-10 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-4 hidden border-t border-dashed border-amber-400/70 md:block" aria-hidden="true" />
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <span className="relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 font-black text-black">
                  {index + 1}
                </span>
                <span className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/30 text-4xl">
                  {step.icon}
                </span>
                <h3 className="mx-auto mt-5 max-w-[210px] text-lg font-black leading-6">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-[230px] text-sm leading-6 text-white/70">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-10 md:py-12">
        <div className="container-xl grid items-center gap-8 md:grid-cols-[1.35fr_repeat(3,1fr)]">
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-4xl shadow-sm">♢</span>
            <div>
              <h2 className="text-xl font-black text-slate-950">Your project is in good hands.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We carefully screen every professional on Fixlo so you can feel confident from start to finish.
              </p>
            </div>
          </div>
          {[
            { icon: '♙', title: 'Verified Pros', text: 'Background-checked and vetted.' },
            { icon: '▣', title: 'Safe & Secure', text: 'Your information is always protected.' },
            { icon: '★', title: 'Satisfaction Guaranteed', text: 'We’re here to make it right.' },
          ].map((item) => (
            <div key={item.title} className="text-center md:text-left">
              <span className="text-4xl text-amber-400">{item.icon}</span>
              <h3 className="mt-2 font-black text-slate-950">{item.title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-black py-9 text-center text-white">
        <p className="text-3xl font-black tracking-wide"><span className="text-amber-400">⌂</span> FIXLO</p>
        <p className="mt-2 text-xs font-bold tracking-[.2em] text-amber-400">FIND. BOOK. GET IT DONE.</p>
        <p className="mt-5 text-xs text-white/55">© {new Date().getFullYear()} Fixlo. All rights reserved.</p>
      </footer>
    </>
  );
}
