import React, { useState } from 'react';
import bgFadeDark from '../assets/bgFadeDark.svg';
import rocket from '../assets/rocket.svg';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_MODE, setAppMode } from '../appMode';

export const Welcome = () => {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  // Drift the content out to the left before handing off to the next route.
  const leaveTo = (path) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => navigate(path), 230);
  };

  // The fork between the two app modes. Setting up puts the app on the
  // company's own API data; skipping opens the seeded demo dataset instead,
  // which can be left again later from the banner the shell shows.
  const startSetup = () => {
    setAppMode(APP_MODE.LIVE);
    leaveTo('/onboarding');
  };

  const startDemo = () => {
    setAppMode(APP_MODE.DEMO);
    leaveTo('/dashboard');
  };

  return (
    <div className="relative bg-primary min-h-screen w-full overflow-hidden animate-fade-in">
      {/* BG Fade */}
      <div className="absolute left-1/2 top-[calc(50%+273.5px)] h-[811px] w-[1648px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="absolute inset-[-38.23%_-18.81%]">
          <img src={bgFadeDark} alt="" className="block max-w-none size-full" />
        </div>
      </div>

      {/* Content layer — drifts out on navigate while the canvas stays put. */}
      <div className={`absolute inset-0 ${leaving ? 'animate-slide-out-left' : ''}`}>
      {/* Logo */}
      <div className="absolute left-1/2 top-[30px] -translate-x-1/2 flex w-[254px] items-center justify-center p-[10px]">
        <p className="bg-gradient-to-b from-neutral-50 to-neutral-800 bg-clip-text text-[20px] font-semibold leading-[normal] text-transparent whitespace-nowrap">
          ServiceOS
        </p>
      </div>

      {/* Welcome Card */}
      <div className="absolute left-1/2 top-[calc(50%-0.5px)] flex w-[406px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[40px] rounded-[40px] p-[30px]">
        <div className="flex w-full flex-col items-center gap-[30px]">
          {/* Rocket */}
          <div className="relative size-[100px] overflow-clip">
            <div className="absolute inset-[8.33%_8.33%_10.42%_10.42%]">
              <div className="absolute inset-[-3.69%]">
                <img src={rocket} alt="" className="block max-w-none size-full" />
              </div>
            </div>
          </div>

          {/* Header text */}
          <div className="flex w-full flex-col items-center justify-center gap-[10px] text-center leading-[normal] whitespace-nowrap">
            <p className="text-[24px] font-semibold text-neutral-50">Welcome to ServiceOS</p>
            <p className="overflow-hidden text-ellipsis text-[14px] font-normal text-neutral-500">
              Let’s setup your company.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-[20px]">
          <button
            type="button"
            onClick={startSetup}
            className="flex h-[44px] w-[160px] cursor-pointer items-center justify-center gap-[var(--spacing-sm)] overflow-clip rounded-[100px] border border-neutral-200 bg-neutral-50 px-[var(--spacing-xl)] py-[10px]"
          >
            <span className="flex items-center justify-center px-[var(--spacing-xxs)]">
              <span className="text-[14px] font-medium leading-[24px] text-neutral-900 whitespace-nowrap">
                Setup
              </span>
            </span>
            <ArrowRight className="size-[18px] shrink-0 text-neutral-900" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={startDemo}
            className="cursor-pointer overflow-hidden text-ellipsis text-center text-[14px] font-normal leading-[normal] text-neutral-500 whitespace-nowrap"
          >
            Skip for now
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
